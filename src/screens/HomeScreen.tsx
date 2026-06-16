import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { typography } from '../theme/typography';
import { useUserStore, useFlashcardStore, useMCQStore, usePerformanceStore } from '../store';
import { refreshProfile } from '../services/profileBuilder';
import { orchestrateSession, StudySessionPlan } from '../services/sessionOrchestrator';
import { RecommendationCard } from '../components/RecommendationCard';
import { ProgressBar, Badge } from '../components/common/StyledComponents';

export function HomeScreen({ navigation }: any) {
  const [plan, setPlan] = useState<StudySessionPlan | null>(null);
  const [initialized, setInitialized] = useState(false);

  const mcqSessionActive = useMCQStore((s) => s.sessionActive);
  const flashcardReviewMode = useFlashcardStore((s) => s.reviewMode);
  const getDueCount = useFlashcardStore((s) => s.getDueCount);
  const { targetExams, primaryExam, streak, examReadiness } = useUserStore();

  const prevMcqActive = useRef(mcqSessionActive);
  const prevFlashcardMode = useRef(flashcardReviewMode);
  const planRef = useRef<StudySessionPlan | null>(null);

  useEffect(() => {
    const profile = refreshProfile();
    const availableMinutes = profile.averageSessionMinutes || 20;
    const sessionPlan = orchestrateSession({
      profile,
      availableMinutes,
      lastSessionType: null,
      recentSessionTypes: [],
    });
    planRef.current = sessionPlan;
    setPlan(sessionPlan);
    setInitialized(true);
  }, []);

  const reOrchestrate = useCallback(() => {
    const profile = refreshProfile(true);
    const availableMinutes = profile.averageSessionMinutes || 20;
    const lastType = planRef.current?.sessionType || null;
    const recentTypes = planRef.current ? [planRef.current.sessionType] : [];
    const sessionPlan = orchestrateSession({ profile, availableMinutes, lastSessionType: lastType, recentSessionTypes: recentTypes });
    planRef.current = sessionPlan;
    setPlan(sessionPlan);
  }, []);

  useEffect(() => {
    if (prevMcqActive.current && !mcqSessionActive) reOrchestrate();
    prevMcqActive.current = mcqSessionActive;
  }, [mcqSessionActive, reOrchestrate]);

  useEffect(() => {
    if (prevFlashcardMode.current && !flashcardReviewMode) reOrchestrate();
    prevFlashcardMode.current = flashcardReviewMode;
  }, [flashcardReviewMode, reOrchestrate]);

  const dueCount = getDueCount();
  const profile = usePerformanceStore((s) => s.profile);
  const accuracyPct = profile ? Math.round(profile.averageAccuracy * 100) : 0;

  if (!initialized) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.md }]}>Planning your session...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[typography.caption, { color: colors.primaryLight }]}>Welcome back</Text>
          <Text style={[typography.h1, { color: colors.text, marginTop: spacing.xs }]}>Lakshyam</Text>
        </View>
        <View style={styles.headerStats}>
          {streak.current > 0 && (
            <View style={styles.statPill}>
              <Text style={styles.statPillText}>🔥 {streak.current}d</Text>
            </View>
          )}
          {primaryExam && (
            <View style={styles.statPill}>
              <Text style={styles.statPillText}>🎯 {primaryExam}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profile')}>
            <Text style={{ fontSize: 20 }}>🧑‍🎓</Text>
          </TouchableOpacity>
        </View>
      </View>

      {plan && <RecommendationCard plan={plan} navigation={navigation} />}

      <View style={styles.secondaryRow}>
        <TouchableOpacity
          style={[styles.secondaryBtn, dueCount === 0 && { opacity: 0.4 }]}
          onPress={() => {
            if (dueCount > 0) {
              useFlashcardStore.getState().loadDueCards();
              navigation.navigate('Learn');
            }
          }}
          disabled={dueCount === 0}
        >
          <Text style={{ fontSize: 20 }}>🃏</Text>
          <View style={{ marginLeft: spacing.sm, flex: 1 }}>
            <Text style={[typography.captionBold, { color: colors.text }]}>Review Flashcards</Text>
            <Text style={[typography.tiny, { color: dueCount > 0 ? colors.textMuted : colors.textSecondary }]}>
              {dueCount > 0 ? `${dueCount} card${dueCount > 1 ? 's' : ''} due today` : 'All caught up'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Analytics')}>
          <Text style={{ fontSize: 20 }}>📊</Text>
          <View style={{ marginLeft: spacing.sm, flex: 1 }}>
            <Text style={[typography.captionBold, { color: colors.text }]}>View Analytics</Text>
            <Text style={[typography.tiny, { color: colors.textMuted }]}>
              {accuracyPct > 0 ? `${accuracyPct}% accuracy` : 'Track progress'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {examReadiness.filter((r) => targetExams.includes(r.examName)).length > 0 && (
        <View style={styles.readinessFooter}>
          <Text style={[typography.tiny, { color: colors.textMuted, marginBottom: spacing.xs }]}>Readiness</Text>
          <View style={styles.readinessRow}>
            {examReadiness
              .filter((r) => targetExams.includes(r.examName))
              .sort((a, b) => b.readinessPercent - a.readinessPercent)
              .slice(0, 3)
              .map((r) => (
                <View key={r.examName} style={styles.readinessPill}>
                  <Text style={[typography.tiny, { color: colors.textSecondary }]}>{r.examName}</Text>
                  <Text style={[typography.small, { color: r.readinessPercent > 70 ? colors.accentGreen : colors.warning, fontWeight: '700' }]}>
                    {r.readinessPercent}%
                  </Text>
                </View>
              ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: spacing.huge,
    paddingBottom: spacing.xl,
  },
  headerLeft: {},
  headerStats: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statPill: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statPillText: { fontSize: 12, color: colors.textSecondary },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  secondaryRow: { gap: spacing.sm, marginBottom: spacing.xl },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  readinessFooter: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.huge,
  },
  readinessRow: { flexDirection: 'row', gap: spacing.md },
  readinessPill: { flex: 1, alignItems: 'center' },
});
