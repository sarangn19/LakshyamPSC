import { supabase } from '../supabase';
import { RecommendationRecord, usePerformanceStore } from '../../store/performanceStore';
import { useUserStore } from '../../store/userStore';
import { useMCQStore } from '../../store/mcqStore';
import { useCognitiveTwinStore } from '../../store/cognitiveTwinStore';
import { getProfileId, now, isOnline, offlineEnqueue } from './syncShared';

export async function syncRecommendation(rec: RecommendationRecord): Promise<void> {
  if (!isOnline()) { offlineEnqueue('upsert', 'recommendations', { recommendation: rec }); return; }
  const profileId = getProfileId();
  if (!profileId) return;

  const { error } = await supabase!
    .from('recommendations')
    .upsert({
      profile_id: profileId, recommendation_id: rec.id, session_type: rec.sessionType,
      title: rec.title, rationale: rec.reasonFactors.join('; '), recommended_action: rec.sessionType,
      status: rec.status, reason_factors: rec.reasonFactors,
      generated_at: new Date(rec.timestamp).toISOString(),
      responded_at: rec.status !== 'pending' ? now() : null,
    }, { onConflict: 'profile_id, recommendation_id' });
  if (error) offlineEnqueue('upsert', 'recommendations', { recommendation: rec });
}

export async function syncRecommendationStatus(id: string, status: 'accepted' | 'skipped'): Promise<void> {
  if (!isOnline()) { offlineEnqueue('update', 'recommendations', { id, status }); return; }
  const profileId = getProfileId();
  if (!profileId) return;
  const { error } = await supabase!.from('recommendations').update({ status, responded_at: now() }).eq('profile_id', profileId).eq('recommendation_id', id);
  if (error) offlineEnqueue('update', 'recommendations', { id, status });
}

export async function pullRecommendations(limit = 50): Promise<void> {
  if (!isOnline()) return;
  const profileId = getProfileId();
  if (!profileId) return;
  const { data } = await supabase!.from('recommendations').select('*').eq('profile_id', profileId).order('generated_at', { ascending: false }).limit(limit);
  if (!data) return;
  const perf = usePerformanceStore.getState();
  const existingIds = new Set(perf.recommendations.map((r) => r.id));
  for (const row of data) {
    if (existingIds.has(row.recommendation_id)) continue;
    perf.addRecommendation({
      sessionType: row.session_type, title: row.title,
      reasonFactors: row.reason_factors as string[] || [],
    });
    perf.markRecommendation(row.recommendation_id, row.status as 'accepted' | 'skipped');
  }
}

export async function syncStudyStreak(): Promise<void> {
  if (!isOnline()) return;
  const profileId = getProfileId();
  if (!profileId) return;
  const streak = useUserStore.getState().streak;
  const { error } = await supabase!.from('study_streaks').upsert({
    profile_id: profileId, current: streak.current, longest: streak.longest,
    last_study_date: streak.lastStudyDate || null, study_dates: streak.dates,
  }, { onConflict: 'profile_id' });
  if (error) console.warn('[Sync] syncStudyStreak failed:', error.message);
}

export async function pullStudyStreak(): Promise<void> {
  if (!isOnline()) return;
  const profileId = getProfileId();
  if (!profileId) return;
  const { data } = await supabase!.from('study_streaks').select('*').eq('profile_id', profileId).maybeSingle();
  if (data) {
    useUserStore.setState({ streak: { current: data.current, longest: data.longest, lastStudyDate: data.last_study_date || '', dates: data.study_dates || [] } });
  }
}

export async function syncSubjectProgress(): Promise<void> {
  if (!isOnline()) return;
  const profileId = getProfileId();
  if (!profileId) return;
  const progress = useMCQStore.getState().subjectProgress;
  if (progress.length === 0) return;
  for (const p of progress) {
    const { error } = await supabase!.from('subject_progress').upsert({
      profile_id: profileId, subject: p.subjectName, topic: '', total_questions: 0, correct_answers: 0,
      accuracy: p.accuracyPercent ? p.accuracyPercent / 100 : null,
      mastery_level: p.revisionStatus === 'needs_attention' ? 'needs_revision' : p.revisionStatus === 'good' ? 'strong' : 'upcoming',
      last_studied: p.lastStudied || null,
    }, { onConflict: 'profile_id, subject, topic' });
    if (error) console.warn('[Sync] syncSubjectProgress failed:', error.message);
  }
}

export async function pullSubjectProgress(): Promise<void> {
  if (!isOnline()) return;
  const profileId = getProfileId();
  if (!profileId) return;
  const { data } = await supabase!.from('subject_progress').select('*').eq('profile_id', profileId);
  if (!data) return;
  useMCQStore.setState({
    subjectProgress: data.map((r) => ({
      subjectId: r.subject, subjectName: r.subject,
      completionPercent: r.total_questions > 0 ? Math.min(100, r.correct_answers / r.total_questions * 100) : 0,
      accuracyPercent: r.accuracy ? Math.round(r.accuracy * 100) : 0, confidenceScore: 0,
      revisionStatus: r.mastery_level === 'needs_revision' ? 'needs_attention' : 'good' as any,
      lastStudied: r.last_studied || '',
    })),
  });
}

export async function syncGoals(): Promise<void> {
  if (!isOnline()) return;
  const profileId = getProfileId();
  if (!profileId) return;
  const goal = useUserStore.getState().dailyGoal;
  if (!goal) return;
  const { error } = await supabase!.from('goals').upsert({
    profile_id: profileId, target_date: goal.date || new Date().toISOString().split('T')[0],
    mcqs_planned: goal.targetMCQs || 0, mcqs_done: goal.completedMCQs || 0,
    flashcards_planned: goal.targetFlashcards || 0, flashcards_done: goal.completedFlashcards || 0,
    completed: goal.completedMCQs >= goal.targetMCQs && goal.completedFlashcards >= goal.targetFlashcards,
  }, { onConflict: 'profile_id, target_date' });
  if (error) console.warn('[Sync] syncGoals failed:', error.message);
}

export async function pullGoals(): Promise<void> {
  if (!isOnline()) return;
  const profileId = getProfileId();
  if (!profileId) return;
  const { data } = await supabase!.from('goals').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (data) {
    useUserStore.setState({
      dailyGoal: {
        date: data.target_date || new Date().toISOString().split('T')[0],
        targetMCQs: data.mcqs_planned, completedMCQs: data.mcqs_done,
        targetFlashcards: data.flashcards_planned, completedFlashcards: data.flashcards_done,
        targetRevision: 0, completedRevision: 0,
      },
    });
  }
}

export async function syncCognitiveTwin(): Promise<void> {
  if (!isOnline()) return;
  const profileId = getProfileId();
  if (!profileId) return;
  const twin = useCognitiveTwinStore.getState();
  const { error } = await supabase!.from('profiles').update({
    cognitive_twin: { masteryMap: twin.masteryMap, gapRecords: twin.gapRecords, gapLifecycles: twin.gapLifecycles, retentionRecords: twin.retentionRecords },
    last_synced_at: now(),
  }).eq('id', profileId);
  if (error) console.warn('[Sync] syncCognitiveTwin failed:', error.message);
}

export async function pullCognitiveTwin(): Promise<void> {
  if (!isOnline()) return;
  const profileId = getProfileId();
  if (!profileId) return;
  const { data } = await supabase!.from('profiles').select('cognitive_twin').eq('id', profileId).maybeSingle();
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
