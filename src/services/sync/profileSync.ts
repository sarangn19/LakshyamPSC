import { supabase } from '../supabase';
import { usePerformanceStore, UserProfile } from '../../store/performanceStore';
import { useUserStore } from '../../store/userStore';
import { useBKTStore } from '../../store/bktStore';
import { useCognitiveTwinStore } from '../../store/cognitiveTwinStore';
import type { TopicKnowledge, BKTFittedParams } from '../knowledgeEngine';
import { setProfileId, getProfileId, now, isOnline, offlineEnqueue } from './syncShared';

export async function syncProfile(): Promise<void> {
  if (!isOnline()) return offlineEnqueue('upsert', 'profiles', {});

  const perf = usePerformanceStore.getState();
  const profile = perf.profile;
  const user = useUserStore.getState();

  const { data: { user: authUser } } = await supabase!.auth.getUser();
  if (!authUser) return;

  const { data: remoteProfile, error: profileErr } = await supabase!
    .from('profiles')
    .select('id, cognitive_profile, updated_at')
    .eq('auth_user_id', authUser.id)
    .maybeSingle();

  if (!remoteProfile) {
    console.warn('[Sync] syncProfile: no remoteProfile', profileErr?.message || 'profile not found');
    return;
  }

  setProfileId(remoteProfile.id);

  const remoteCognitive = (remoteProfile.cognitive_profile as Record<string, unknown>) || {};
  const remoteUpdatedAt = remoteProfile.updated_at ? new Date(remoteProfile.updated_at).getTime() : 0;
  const localUpdatedAt = perf.lastProfileBuild || 0;

  let mergedCognitive: Record<string, unknown>;

  if (localUpdatedAt > remoteUpdatedAt && profile) {
    mergedCognitive = buildCognitivePayload(profile);
  } else {
    mergedCognitive = mergeCognitiveProfiles(remoteCognitive, profile);
  }

  const { error } = await supabase!
    .from('profiles')
    .update({ cognitive_profile: mergedCognitive, last_synced_at: now() })
    .eq('id', remoteProfile.id);

  if (error) {
    offlineEnqueue('upsert', 'profiles', { cognitive_profile: mergedCognitive });
    return;
  }

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
    setProfileId(remoteProfile.id);
    return;
  }

  setProfileId(remoteProfile.id);

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

  const remotePairs = (remote.confusionPairs || []) as Array<{ topicA: string; topicB: string; frequency: number }>;
  const localPairs = (local?.confusionPairs || []) as Array<{ topicA: string; topicB: string; frequency: number }>;
  const pairMap = new Map<string, number>();
  for (const p of remotePairs) pairMap.set(`${p.topicA}::${p.topicB}`, p.frequency);
  for (const p of localPairs) pairMap.set(`${p.topicA}::${p.topicB}`, (pairMap.get(`${p.topicA}::${p.topicB}`) || 0) + p.frequency);
  merged.confusionPairs = Array.from(pairMap.entries()).map(([key, frequency]) => {
    const [topicA, topicB] = key.split('::');
    return { topicA, topicB, frequency };
  });

  const remoteWeak = (remote.weakSubjects || []) as string[];
  const localWeak = local?.weakSubjects || [];
  merged.weakSubjects = Array.from(new Set([...remoteWeak, ...localWeak]));

  const remoteStrong = (remote.strongSubjects || []) as string[];
  const localStrong = local?.strongSubjects || [];
  merged.strongSubjects = Array.from(new Set([...remoteStrong, ...localStrong]));

  const remoteHesitation = (remote.hesitationTopics || []) as string[];
  const localHesitation = local?.hesitationTopics || [];
  merged.hesitationTopics = Array.from(new Set([...remoteHesitation, ...localHesitation]));

  const remoteRates = (remote.forgettingRates || {}) as Record<string, number>;
  const localRates = local?.forgettingRates || {};
  merged.forgettingRates = { ...localRates, ...remoteRates };

  if (remote.studyPreferences) {
    merged.studyPreferences = remote.studyPreferences;
  } else if (local) {
    merged.studyPreferences = {
      targetPost: local.targetPost, daysToExam: local.daysToExam,
      averageSessionMinutes: local.averageSessionMinutes, preferredStudyHour: local.preferredStudyHour,
      streakDays: local.streakDays,
    };
  }

  const remoteTK = (remote.topicKnowledge || {}) as Record<string, { pMastered: number; totalAttempts: number }>;
  const localTK = (local ? useBKTStore.getState().getAllTopicKnowledge() : {});
  const mergedTK: Record<string, unknown> = {};
  const allTKKeys = new Set([...Object.keys(remoteTK), ...Object.keys(localTK)]);
  for (const key of allTKKeys) {
    const r = remoteTK[key]; const l = localTK[key];
    mergedTK[key] = r && l ? (r.totalAttempts >= l.totalAttempts ? r : l) : r || l;
  }
  merged.topicKnowledge = mergedTK;
  useBKTStore.getState().setAllTopicKnowledge(mergedTK as Record<string, TopicKnowledge>);

  const remoteParams = (remote.fittedParams || {}) as Record<string, BKTFittedParams>;
  const localParams = useBKTStore.getState().fittedParams;
  const mergedParams = { ...localParams, ...remoteParams };
  merged.fittedParams = mergedParams;
  useBKTStore.getState().setFittedParams(mergedParams);

  const remotePerf = (remote.performance || {}) as Record<string, unknown>;
  merged.performance = {
    totalQuestionsAttempted: Math.max((remotePerf.totalQuestionsAttempted as number) || 0, local?.totalQuestionsAttempted || 0),
    averageAccuracy: Math.max((remotePerf.averageAccuracy as number) || 0, local?.averageAccuracy || 0),
  };

  merged.updatedAt = now();
  return merged;
}
