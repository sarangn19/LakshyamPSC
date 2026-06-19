import { supabase } from './supabase';
import { useSyncQueue } from './syncQueue';
import { usePerformanceStore, UserProfile, SessionOutcome, RecommendationRecord, InteractionSignal, FlashcardSignal } from '../store/performanceStore';
import { useUserStore } from '../store/userStore';
import { useMCQStore } from '../store/mcqStore';
import { useCognitiveTwinStore } from '../store/cognitiveTwinStore';
import { useBKTStore } from '../store/bktStore';
import type { TopicKnowledge, BKTFittedParams } from './knowledgeEngine';

let _profileId: string | null = null;

export function setProfileId(id: string | null): void {
  _profileId = id;
}

function now(): string {
  return new Date().toISOString();
}

function isOnline(): boolean {
  return supabase !== null;
}

function getProfileId(): string | null {
  return _profileId;
}

// ──────────────────────────────────────────────
// 1. PROFILE SYNCHRONIZATION
// ──────────────────────────────────────────────

export async function syncProfile(): Promise<void> {
  if (!isOnline()) return offlineEnqueue('upsert', 'profiles', {});

  const perf = usePerformanceStore.getState();
  const profile = perf.profile;
  const user = useUserStore.getState();

  const { data: { user: authUser } } = await supabase!.auth.getUser();
  if (!authUser) return;

  // Fetch remote cognitive profile
  const { data: remoteProfile, error: profileErr } = await supabase!
    .from('profiles')
    .select('id, cognitive_profile, updated_at')
    .eq('auth_user_id', authUser.id)
    .maybeSingle();

  if (!remoteProfile) {
    console.warn('[Sync] syncProfile: no remoteProfile', profileErr?.message || 'profile not found');
    return;
  }

  // Store profile_id for other sync operations
  setProfileId(remoteProfile.id);
  console.log('[Sync] Profile synced, profileId:', remoteProfile.id);

  const remoteCognitive = (remoteProfile.cognitive_profile as Record<string, unknown>) || {};
  const remoteUpdatedAt = remoteProfile.updated_at ? new Date(remoteProfile.updated_at).getTime() : 0;
  const localUpdatedAt = perf.lastProfileBuild || 0;

  // Conflict resolution: newest timestamp wins for mutable profile fields
  // Remote is source of truth for cross-device consistency
  let mergedCognitive: Record<string, unknown>;

  if (localUpdatedAt > remoteUpdatedAt && profile) {
    // Local is newer — push to remote
    mergedCognitive = buildCognitivePayload(profile);
  } else {
    // Remote is newer or equal — merge remote into local, but never discard local progress
    mergedCognitive = mergeCognitiveProfiles(remoteCognitive, profile);
  }

  // Write merged profile to remote
  const { error } = await supabase!
    .from('profiles')
    .update({
      cognitive_profile: mergedCognitive,
      last_synced_at: now(),
    })
    .eq('id', remoteProfile.id);

  if (error) {
    offlineEnqueue('upsert', 'profiles', { cognitive_profile: mergedCognitive });
    return;
  }

  // Update local store with merged profile
  if (profile) {
    usePerformanceStore.getState().setProfile(mergedCognitive as unknown as UserProfile);
  }
}

export async function pullProfile(): Promise<void> {
  if (!isOnline()) return;

  const { data: { user: authUser } } = await supabase!.auth.getUser();
  if (!authUser) return;

  const { data: remoteProfile, error: pullErr } = await supabase!
    .from('profiles')
    .select('id, cognitive_profile, updated_at')
    .eq('auth_user_id', authUser.id)
    .maybeSingle();

  if (!remoteProfile) {
    console.warn('[Sync] pullProfile: no profile', pullErr?.message);
    return;
  }

  if (!remoteProfile.cognitive_profile) {
    console.warn('[Sync] pullProfile: no cognitive_profile on profile');
    // Still set profileId so downstream sync can work
    setProfileId(remoteProfile.id);
    return;
  }

  setProfileId(remoteProfile.id);
  console.log('[Sync] pullProfile: profile loaded', remoteProfile.id);

  const remoteCognitive = remoteProfile.cognitive_profile as Record<string, unknown>;
  const localProfile = usePerformanceStore.getState().profile;

  const merged = mergeCognitiveProfiles(remoteCognitive, localProfile);
  usePerformanceStore.getState().setProfile(merged as unknown as UserProfile);
}

function buildCognitivePayload(profile: UserProfile): Record<string, unknown> {
  const bkt = useBKTStore.getState();
  const twin = useCognitiveTwinStore.getState();
  return {
    weakSubjects: profile.weakSubjects,
    strongSubjects: profile.strongSubjects,
    forgettingRates: profile.forgettingRates,
    hesitationTopics: profile.hesitationTopics,
    confusionPairs: profile.confusionPairs,
    topicKnowledge: bkt.getAllTopicKnowledge(),
    fittedParams: bkt.fittedParams,
    studyPreferences: {
      targetPost: profile.targetPost,
      daysToExam: profile.daysToExam,
      averageSessionMinutes: profile.averageSessionMinutes,
      preferredStudyHour: profile.preferredStudyHour,
      streakDays: profile.streakDays,
    },
    performance: {
      totalQuestionsAttempted: profile.totalQuestionsAttempted,
      averageAccuracy: profile.averageAccuracy,
    },
    cognitiveTwin: {
      masteryMap: twin.masteryMap,
      gapRecords: twin.gapRecords,
      gapLifecycles: twin.gapLifecycles,
      retentionRecords: twin.retentionRecords,
    },
    updatedAt: now(),
  };
}

function mergeCognitiveProfiles(
  remote: Record<string, unknown>,
  local: UserProfile | null,
): Record<string, unknown> {
  const merged = { ...remote };

  // Append-only: confusion pairs from both sources
  const remotePairs = (remote.confusionPairs || []) as Array<{ topicA: string; topicB: string; frequency: number }>;
  const localPairs = (local?.confusionPairs || []) as Array<{ topicA: string; topicB: string; frequency: number }>;

  const pairMap = new Map<string, number>();
  for (const p of remotePairs) {
    pairMap.set(`${p.topicA}::${p.topicB}`, p.frequency);
  }
  for (const p of localPairs) {
    const key = `${p.topicA}::${p.topicB}`;
    pairMap.set(key, (pairMap.get(key) || 0) + p.frequency);
  }
  merged.confusionPairs = Array.from(pairMap.entries()).map(([key, frequency]) => {
    const [topicA, topicB] = key.split('::');
    return { topicA, topicB, frequency };
  });

  // Weak/strong subjects: union (append-only)
  const remoteWeak = (remote.weakSubjects || []) as string[];
  const localWeak = local?.weakSubjects || [];
  merged.weakSubjects = Array.from(new Set([...remoteWeak, ...localWeak]));

  const remoteStrong = (remote.strongSubjects || []) as string[];
  const localStrong = local?.strongSubjects || [];
  merged.strongSubjects = Array.from(new Set([...remoteStrong, ...localStrong]));

  // Hesitation topics: union
  const remoteHesitation = (remote.hesitationTopics || []) as string[];
  const localHesitation = local?.hesitationTopics || [];
  merged.hesitationTopics = Array.from(new Set([...remoteHesitation, ...localHesitation]));

  // Forgetting rates: remote wins for subjects both have, local fills gaps
  const remoteRates = (remote.forgettingRates || {}) as Record<string, number>;
  const localRates = local?.forgettingRates || {};
  const mergedRates: Record<string, number> = { ...localRates, ...remoteRates };
  merged.forgettingRates = mergedRates;

  // Study preferences: remote wins (more recent device data)
  if (remote.studyPreferences) {
    merged.studyPreferences = remote.studyPreferences;
  } else if (local) {
    merged.studyPreferences = {
      targetPost: local.targetPost,
      daysToExam: local.daysToExam,
      averageSessionMinutes: local.averageSessionMinutes,
      preferredStudyHour: local.preferredStudyHour,
      streakDays: local.streakDays,
    };
  }

  // Topic knowledge (BKT): per-topic, take the state with more total attempts (more data)
  const remoteTK = (remote.topicKnowledge || {}) as Record<string, { pMastered: number; totalAttempts: number }>;
  const localTK = (local ? useBKTStore.getState().getAllTopicKnowledge() : {});
  const mergedTK: Record<string, unknown> = {};
  const allTKKeys = new Set([...Object.keys(remoteTK), ...Object.keys(localTK)]);
  for (const key of allTKKeys) {
    const r = remoteTK[key];
    const l = localTK[key];
    if (r && l) {
      mergedTK[key] = r.totalAttempts >= l.totalAttempts ? r : l;
    } else {
      mergedTK[key] = r || l;
    }
  }
  merged.topicKnowledge = mergedTK;
  // Restore merged BKT state to local store
  useBKTStore.getState().setAllTopicKnowledge(mergedTK as Record<string, TopicKnowledge>);

  // Fitted BKT params: remote wins (more data across devices), local fills gaps
  const remoteParams = (remote.fittedParams || {}) as Record<string, BKTFittedParams>;
  const localParams = useBKTStore.getState().fittedParams;
  const mergedParams = { ...localParams, ...remoteParams };
  merged.fittedParams = mergedParams;
  useBKTStore.getState().setFittedParams(mergedParams);

  // Performance: always sum totals (append-only)
  const remotePerf = (remote.performance || {}) as Record<string, unknown>;
  const localPerf = local
    ? { totalQuestionsAttempted: local.totalQuestionsAttempted, averageAccuracy: local.averageAccuracy }
    : {};
  merged.performance = {
    totalQuestionsAttempted: Math.max(
      (remotePerf.totalQuestionsAttempted as number) || 0,
      (localPerf.totalQuestionsAttempted as number) || 0,
    ),
    averageAccuracy: Math.max(
      (remotePerf.averageAccuracy as number) || 0,
      (localPerf.averageAccuracy as number) || 0,
    ),
  };

  merged.updatedAt = now();
  return merged;
}

// ──────────────────────────────────────────────
// 2. PERFORMANCE SIGNAL PERSISTENCE
// ──────────────────────────────────────────────

let signalBatch: InteractionSignal[] = [];
let batchTimer: ReturnType<typeof setTimeout> | null = null;

export function queueSignalBatch(signal: InteractionSignal): void {
  signalBatch.push(signal);
  if (batchTimer) clearTimeout(batchTimer);
  if (signalBatch.length >= 25) {
    flushSignalBatch();
  } else {
    batchTimer = setTimeout(() => flushSignalBatch(), 5000);
  }
}

async function flushSignalBatch(): Promise<void> {
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }

  if (signalBatch.length === 0) return;
  const batch = signalBatch.splice(0, signalBatch.length);
  console.log('[Sync] flushSignalBatch: flushing', batch.length, 'signals');

  if (!isOnline()) {
    console.warn('[Sync] flushSignalBatch: offline, enqueueing');
    offlineEnqueue('insert', 'interaction_signals', { signals: batch });
    return;
  }

  const profileId = getProfileId();
  if (!profileId) {
    console.warn('[Sync] flushSignalBatch: no profileId — syncProfile must complete first');
    return;
  }

  const rows = batch.map((s) => ({
    profile_id: profileId,
    signal_type: 'interaction',
    payload: s as unknown as Record<string, unknown>,
    created_at: s.sessionTime || now(),
  }));

  const { error } = await supabase!.from('interaction_signals').insert(rows);
  if (error) {
    offlineEnqueue('insert', 'interaction_signals', { signals: batch });
  }
}

// ──────────────────────────────────────────────
// 3. SESSION OUTCOME PERSISTENCE
// ──────────────────────────────────────────────

export async function syncSessionOutcome(outcome: SessionOutcome): Promise<void> {
  if (!isOnline()) {
    offlineEnqueue('upsert', 'session_outcomes', { outcome });
    return;
  }

  const profileId = getProfileId();
  if (!profileId) return;

  const { error } = await supabase!
    .from('session_outcomes')
    .upsert({
      profile_id: profileId,
      session_id: outcome.sessionId,
      session_type: outcome.sessionType,
      start_time: new Date(outcome.startTime).toISOString(),
      end_time: new Date(outcome.endTime).toISOString(),
      duration_minutes: outcome.durationMinutes,
      total_questions: outcome.totalQuestions,
      correct_answers: outcome.correctAnswers,
      accuracy: outcome.accuracy,
      subject_scores: outcome.subjectScores as unknown as Record<string, unknown>,
      weakest_subject: outcome.weakestSubject,
      strongest_subject: outcome.strongestSubject,
      difficulty_mix: outcome.difficultyMix as unknown as Record<string, unknown>,
    }, {
      onConflict: 'profile_id, session_id',
    });

  if (error) {
    offlineEnqueue('upsert', 'session_outcomes', { outcome });
  }
}

export async function pullSessionOutcomes(sinceDays = 90): Promise<void> {
  if (!isOnline()) return;

  const profileId = getProfileId();
  if (!profileId) return;

  const since = new Date(Date.now() - sinceDays * 86400000).toISOString();

  const { data } = await supabase!
    .from('session_outcomes')
    .select('*')
    .eq('profile_id', profileId)
    .gte('end_time', since)
    .order('end_time', { ascending: false });

  if (!data) return;

  const perf = usePerformanceStore.getState();
  const existingIds = new Set(perf.sessionOutcomes.map((o) => o.sessionId));

  for (const row of data) {
    if (existingIds.has(row.session_id)) continue;
    perf.addSessionOutcome({
      sessionId: row.session_id,
      sessionType: row.session_type,
      startTime: new Date(row.start_time).getTime(),
      endTime: new Date(row.end_time).getTime(),
      durationMinutes: row.duration_minutes,
      totalQuestions: row.total_questions,
      correctAnswers: row.correct_answers,
      accuracy: row.accuracy,
      subjectScores: row.subject_scores as Record<string, { correct: number; total: number; accuracy: number }>,
      weakestSubject: row.weakest_subject || '',
      strongestSubject: row.strongest_subject || '',
      difficultyMix: row.difficulty_mix as { easy: number; medium: number; hard: number },
    });
  }
}

// ──────────────────────────────────────────────
// 4. RECOMMENDATION PERSISTENCE
// ──────────────────────────────────────────────

export async function syncRecommendation(rec: RecommendationRecord): Promise<void> {
  if (!isOnline()) {
    offlineEnqueue('upsert', 'recommendations', { recommendation: rec });
    return;
  }

  const profileId = getProfileId();
  if (!profileId) return;

  const { error } = await supabase!
    .from('recommendations')
    .upsert({
      profile_id: profileId,
      recommendation_id: rec.id,
      session_type: rec.sessionType,
      title: rec.title,
      rationale: rec.reasonFactors.join('; '),
      recommended_action: rec.sessionType,
      status: rec.status,
      reason_factors: rec.reasonFactors,
      generated_at: new Date(rec.timestamp).toISOString(),
      responded_at: rec.status !== 'pending' ? now() : null,
    }, {
      onConflict: 'profile_id, recommendation_id',
    });

  if (error) {
    offlineEnqueue('upsert', 'recommendations', { recommendation: rec });
  }
}

export async function syncRecommendationStatus(id: string, status: 'accepted' | 'skipped'): Promise<void> {
  if (!isOnline()) {
    offlineEnqueue('update', 'recommendations', { id, status });
    return;
  }

  const profileId = getProfileId();
  if (!profileId) return;

  const { error } = await supabase!
    .from('recommendations')
    .update({ status, responded_at: now() })
    .eq('profile_id', profileId)
    .eq('recommendation_id', id);

  if (error) {
    offlineEnqueue('update', 'recommendations', { id, status });
  }
}

export async function pullRecommendations(limit = 50): Promise<void> {
  if (!isOnline()) return;

  const profileId = getProfileId();
  if (!profileId) return;

  const { data } = await supabase!
    .from('recommendations')
    .select('*')
    .eq('profile_id', profileId)
    .order('generated_at', { ascending: false })
    .limit(limit);

  if (!data) return;

  const perf = usePerformanceStore.getState();
  const existingIds = new Set(perf.recommendations.map((r) => r.id));

  for (const row of data) {
    if (existingIds.has(row.recommendation_id)) continue;
    perf.addRecommendation({
      sessionType: row.session_type,
      title: row.title,
      reasonFactors: row.reason_factors as string[] || [],
    });
    // Mark the status from remote
    perf.markRecommendation(row.recommendation_id, row.status as 'accepted' | 'skipped');
  }
}

// ──────────────────────────────────────────────
// 5. STUDY STREAK PERSISTENCE
// ──────────────────────────────────────────────

export async function syncStudyStreak(): Promise<void> {
  if (!isOnline()) return;
  const profileId = getProfileId();
  if (!profileId) return;

  const streak = useUserStore.getState().streak;

  const { error } = await supabase!
    .from('study_streaks')
    .upsert({
      profile_id: profileId,
      current: streak.current,
      longest: streak.longest,
      last_study_date: streak.lastStudyDate || null,
      study_dates: streak.dates,
    }, { onConflict: 'profile_id' });

  if (error) console.warn('[Sync] syncStudyStreak failed:', error.message);
}

export async function pullStudyStreak(): Promise<void> {
  if (!isOnline()) return;
  const profileId = getProfileId();
  if (!profileId) return;

  const { data } = await supabase!
    .from('study_streaks')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (data) {
    useUserStore.setState({
      streak: {
        current: data.current,
        longest: data.longest,
        lastStudyDate: data.last_study_date || '',
        dates: data.study_dates || [],
      },
    });
  }
}

// ──────────────────────────────────────────────
// 6. SUBJECT PROGRESS PERSISTENCE
// ──────────────────────────────────────────────

export async function syncSubjectProgress(): Promise<void> {
  if (!isOnline()) return;
  const profileId = getProfileId();
  if (!profileId) return;

  const progress = useMCQStore.getState().subjectProgress;
  if (progress.length === 0) return;

  const rows = progress.map((p) => ({
    profile_id: profileId,
    subject: p.subjectName,
    topic: '',
    total_questions: 0,
    correct_answers: 0,
    accuracy: p.accuracyPercent ? p.accuracyPercent / 100 : null,
    mastery_level: (p.revisionStatus === 'needs_attention' ? 'needs_revision'
      : p.revisionStatus === 'good' ? 'strong'
      : 'upcoming') as string,
    last_studied: p.lastStudied || null,
  }));

  for (const row of rows) {
    const { error } = await supabase!
      .from('subject_progress')
      .upsert(row, { onConflict: 'profile_id, subject, topic' });
    if (error) console.warn('[Sync] syncSubjectProgress failed:', error.message);
  }
}

export async function pullSubjectProgress(): Promise<void> {
  if (!isOnline()) return;
  const profileId = getProfileId();
  if (!profileId) return;

  const { data } = await supabase!
    .from('subject_progress')
    .select('*')
    .eq('profile_id', profileId);

  if (!data) return;

  useMCQStore.setState({
    subjectProgress: data.map((r) => ({
      subjectId: r.subject,
      subjectName: r.subject,
      completionPercent: r.total_questions > 0 ? Math.min(100, r.correct_answers / r.total_questions * 100) : 0,
      accuracyPercent: r.accuracy ? Math.round(r.accuracy * 100) : 0,
      confidenceScore: 0,
      revisionStatus: (r.mastery_level === 'needs_revision' ? 'needs_attention'
        : 'good') as 'good' | 'needs_attention' | 'critical',
      lastStudied: r.last_studied || '',
    })),
  });
}

// ──────────────────────────────────────────────
// 7. GOALS PERSISTENCE
// ──────────────────────────────────────────────

export async function syncGoals(): Promise<void> {
  if (!isOnline()) return;
  const profileId = getProfileId();
  if (!profileId) return;

  const goal = useUserStore.getState().dailyGoal;
  if (!goal) return;

  const { error } = await supabase!
    .from('goals')
    .upsert({
      profile_id: profileId,
      target_date: goal.date || new Date().toISOString().split('T')[0],
      mcqs_planned: goal.targetMCQs || 0,
      mcqs_done: goal.completedMCQs || 0,
      flashcards_planned: goal.targetFlashcards || 0,
      flashcards_done: goal.completedFlashcards || 0,
      completed: goal.completedMCQs >= goal.targetMCQs && goal.completedFlashcards >= goal.targetFlashcards,
    }, { onConflict: 'profile_id, target_date' });

  if (error) console.warn('[Sync] syncGoals failed:', error.message);
}

export async function pullGoals(): Promise<void> {
  if (!isOnline()) return;
  const profileId = getProfileId();
  if (!profileId) return;

  const { data } = await supabase!
    .from('goals')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data) {
    useUserStore.setState({
      dailyGoal: {
        date: data.target_date || new Date().toISOString().split('T')[0],
        targetMCQs: data.mcqs_planned,
        completedMCQs: data.mcqs_done,
        targetFlashcards: data.flashcards_planned,
        completedFlashcards: data.flashcards_done,
        targetRevision: 0,
        completedRevision: 0,
      },
    });
  }
}

// ──────────────────────────────────────────────
// 8. FLASHCARD REVIEW PERSISTENCE
// ──────────────────────────────────────────────

let flashcardBatch: FlashcardSignal[] = [];
let flashcardBatchTimer: ReturnType<typeof setTimeout> | null = null;

function queueFlashcardBatch(signal: FlashcardSignal): void {
  flashcardBatch.push(signal);
  if (flashcardBatchTimer) clearTimeout(flashcardBatchTimer);
  if (flashcardBatch.length >= 25) {
    flushFlashcardBatch();
  } else {
    flashcardBatchTimer = setTimeout(() => flushFlashcardBatch(), 5000);
  }
}

async function flushFlashcardBatch(): Promise<void> {
  if (flashcardBatchTimer) {
    clearTimeout(flashcardBatchTimer);
    flashcardBatchTimer = null;
  }
  if (flashcardBatch.length === 0) return;

  const batch = flashcardBatch.splice(0, flashcardBatch.length);
  const profileId = getProfileId();
  if (!profileId) return;

  const rows = batch.map((s) => ({
    profile_id: profileId,
    flashcard_id: s.cardId,
    front_text: '',
    back_text: '',
    subject: s.subject,
    difficulty: s.smRating === 'hard' ? 2 : s.smRating === 'good' ? 3 : 4,
    is_recalled: s.smRating !== 'hard',
    next_review_at: new Date(Date.now() + s.intervalDays * 86400000).toISOString(),
    created_at: s.timestamp || now(),
  }));

  const { error } = await supabase!.from('flashcard_reviews').insert(rows);
  if (error) console.warn('[Sync] flushFlashcardBatch failed:', error.message);
}

export function enqueueFlashcardSignal(signal: FlashcardSignal): void {
  queueFlashcardBatch(signal);
}

// ──────────────────────────────────────────────
// 9. COGNITIVE TWIN DATA (mastery, gaps, retention)
// ──────────────────────────────────────────────

function buildCognitiveTwinPayload(): Record<string, unknown> {
  const twin = useCognitiveTwinStore.getState();
  return {
    masteryMap: twin.masteryMap,
    gapRecords: twin.gapRecords,
    gapLifecycles: twin.gapLifecycles,
    retentionRecords: twin.retentionRecords,
  };
}

export async function syncCognitiveTwin(): Promise<void> {
  if (!isOnline()) return;
  const profileId = getProfileId();
  if (!profileId) return;

  const twinData = buildCognitiveTwinPayload();

  const { error } = await supabase!
    .from('profiles')
    .update({
      cognitive_twin: twinData,
      last_synced_at: now(),
    })
    .eq('id', profileId);

  if (error) console.warn('[Sync] syncCognitiveTwin failed:', error.message);
}

export async function pullCognitiveTwin(): Promise<void> {
  if (!isOnline()) return;
  const profileId = getProfileId();
  if (!profileId) return;

  const { data } = await supabase!
    .from('profiles')
    .select('cognitive_twin')
    .eq('id', profileId)
    .maybeSingle();

  if (data?.cognitive_twin) {
    const ct = data.cognitive_twin as Record<string, unknown>;
    const updates: Record<string, unknown> = {};
    if (ct.masteryMap) updates.masteryMap = ct.masteryMap;
    if (ct.gapRecords) updates.gapRecords = ct.gapRecords;
    if (ct.gapLifecycles) updates.gapLifecycles = ct.gapLifecycles;
    if (ct.retentionRecords) updates.retentionRecords = ct.retentionRecords;
    useCognitiveTwinStore.setState(updates as any);
  }
}

// ──────────────────────────────────────────────
// 10. OFFLINE QUEUE
// ──────────────────────────────────────────────

function offlineEnqueue(
  operation: 'upsert' | 'insert' | 'update',
  table: string,
  data: Record<string, unknown>,
): void {
  const idempotencyKey = `${operation}_${table}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  useSyncQueue.getState().enqueue({
    operation,
    table,
    data,
    idempotencyKey,
    maxRetries: 5,
  });
}

export async function flushOfflineQueue(): Promise<{ processed: number; failed: number }> {
  const queue = useSyncQueue.getState();
  if (queue.processing) return { processed: 0, failed: 0 };
  if (queue.queue.length === 0) return { processed: 0, failed: 0 };
  if (!isOnline()) return { processed: 0, failed: 0 };

  useSyncQueue.setState({ processing: true });

  let processed = 0;
  let failed = 0;

  const items = [...queue.queue].filter((q) => q.retries < q.maxRetries);

  for (const item of items) {
    try {
      await processQueueItem(item);
      queue.dequeue(item.id);
      processed++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      queue.markFailed(item.id, msg);
      failed++;
    }
  }

  queue.clearProcessed();
  useSyncQueue.setState({ processing: false });

  return { processed, failed };
}

async function processQueueItem(item: { operation: string; table: string; data: Record<string, unknown>; entityId?: string }): Promise<void> {
  const profileId = getProfileId();
  if (!profileId) throw new Error('No profile ID');

  switch (item.table) {
    case 'profiles':
      await supabase!.from('profiles').update(item.data).eq('id', profileId);
      break;

    case 'interaction_signals': {
      const signals = item.data.signals as InteractionSignal[];
      if (signals) {
        const rows = signals.map((s) => ({
          profile_id: profileId,
          signal_type: 'interaction',
          payload: s as unknown as Record<string, unknown>,
          created_at: s.sessionTime || now(),
        }));
        await supabase!.from('interaction_signals').insert(rows);
      }
      break;
    }

    case 'session_outcomes': {
      const outcome = item.data.outcome as SessionOutcome;
      if (outcome) {
        await supabase!.from('session_outcomes').upsert({
          profile_id: profileId,
          session_id: outcome.sessionId,
          session_type: outcome.sessionType,
          start_time: new Date(outcome.startTime).toISOString(),
          end_time: new Date(outcome.endTime).toISOString(),
          duration_minutes: outcome.durationMinutes,
          total_questions: outcome.totalQuestions,
          correct_answers: outcome.correctAnswers,
          accuracy: outcome.accuracy,
          subject_scores: outcome.subjectScores,
          weakest_subject: outcome.weakestSubject,
          strongest_subject: outcome.strongestSubject,
          difficulty_mix: outcome.difficultyMix,
        }, { onConflict: 'profile_id, session_id' });
      }
      break;
    }

    case 'recommendations': {
      const rec = item.data.recommendation as RecommendationRecord;
      if (rec) {
        await supabase!.from('recommendations').upsert({
          profile_id: profileId,
          recommendation_id: rec.id,
          session_type: rec.sessionType,
          title: rec.title,
          rationale: rec.reasonFactors.join('; '),
          recommended_action: rec.sessionType,
          status: rec.status,
          reason_factors: rec.reasonFactors,
          generated_at: new Date(rec.timestamp).toISOString(),
          responded_at: rec.status !== 'pending' ? now() : null,
        }, { onConflict: 'profile_id, recommendation_id' });
      } else if (item.data.status) {
        await supabase!.from('recommendations')
          .update({ status: item.data.status as string, responded_at: now() })
          .eq('profile_id', profileId)
          .eq('recommendation_id', item.data.id as string);
      }
      break;
    }

    case 'flashcard_reviews': {
      const flashcardSignals = item.data.signals as FlashcardSignal[];
      if (flashcardSignals) {
        const rows = flashcardSignals.map((s) => ({
          profile_id: profileId,
          flashcard_id: s.cardId,
          front_text: '',
          back_text: '',
          subject: s.subject,
          difficulty: s.smRating === 'hard' ? 2 : s.smRating === 'good' ? 3 : 4,
          is_recalled: s.smRating !== 'hard',
          next_review_at: new Date(Date.now() + s.intervalDays * 86400000).toISOString(),
          created_at: s.timestamp || now(),
        }));
        await supabase!.from('flashcard_reviews').insert(rows);
      }
      break;
    }
  }
}

// ──────────────────────────────────────────────
// 7. STARTUP RECOVERY
// ──────────────────────────────────────────────

export async function restoreFromRemote(): Promise<void> {
  if (!isOnline()) return;

  try {
    await pullProfile();
    await pullSessionOutcomes(90);
    await pullRecommendations(50);
    await pullStudyStreak();
    await pullSubjectProgress();
    await pullGoals();
    await pullCognitiveTwin();
    await flushOfflineQueue();
  } catch (err) {
    console.warn('[Sync] Restore failed:', err);
  }
}

// ──────────────────────────────────────────────
// 7. PERIODIC SYNC
// ──────────────────────────────────────────────

let syncInterval: ReturnType<typeof setInterval> | null = null;

export function startPeriodicSync(intervalMs = 60000): void {
  stopPeriodicSync();
  syncInterval = setInterval(async () => {
    if (!isOnline()) return;
    try {
      await syncProfile();
      await syncStudyStreak();
      await syncSubjectProgress();
      await syncGoals();
      await syncCognitiveTwin();
      await flushOfflineQueue();
    } catch {
      // silence periodic sync errors
    }
  }, intervalMs);
}

export function stopPeriodicSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}
