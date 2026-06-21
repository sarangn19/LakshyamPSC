import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from '../i18n/useTranslation';
import { colors, spacing, fontFamily } from '../theme';
import { typography } from '../theme/typography';
import { useFlashcardStore, useMCQStore, usePerformanceStore } from '../store';
import { refreshProfile } from '../services/profileBuilder';
import { orchestrateSession, logOrchestratedSessionStart } from '../services/learningRecommendationEngine';

export function RevisionHubScreen({ navigation }: any) {
  const { t } = useTranslation();
  const getDueCount = useFlashcardStore((s) => s.getDueCount);
  const flashcards = useFlashcardStore((s) => s.flashcards);
  const profile = usePerformanceStore((s) => s.profile);

  const dueCount = getDueCount();
  const totalCards = flashcards.length;
  const masteredCount = useFlashcardStore((s) => s.getMasteredCount)();
  const accuracy = profile ? Math.round(profile.averageAccuracy * 100) : 0;

  const handleStartRevision = () => {
    const p = refreshProfile();
    const plan = orchestrateSession({
      profile: p,
      availableMinutes: Math.max(p.averageSessionMinutes, 15),
      lastSessionType: null,
      recentSessionTypes: [],
    });
    logOrchestratedSessionStart(plan);
    usePerformanceStore.getState().addRecommendation({
      sessionType: plan.sessionType,
      title: plan.title,
      reasonFactors: plan.reasoning,
    });
    const mcqActivities = plan.activities.filter((a) => a.type === 'mcq');
    const flashcardActivities = plan.activities.filter((a) => a.type === 'flashcard');
    if (flashcardActivities.length > 0 && dueCount > 0) {
      useFlashcardStore.getState().loadDueCards();
      navigation.navigate('Learn');
    } else if (mcqActivities.length > 0) {
      const mcqCount = mcqActivities.reduce((s, a) => s + a.count, 0);
      useMCQStore.getState().startOrchestratedSession({
        subjects: plan.focusSubjects.length > 0 ? plan.focusSubjects : undefined,
        count: Math.max(5, mcqCount),
        sessionType: plan.sessionType,
      });
      navigation.navigate('MCQ');
    }
  };

  const primaryCount = dueCount;
  const primaryLabel = 'card(s) ready for review';
  const startLabel = 'Start Review';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[typography.displayL, { color: colors.text }]}>Review</Text>

      <View style={styles.reviewCard}>
        <View style={styles.reviewCountArea}>
          <Text style={styles.reviewCount}>{primaryCount}</Text>
          <Text style={styles.reviewLabel}>{primaryLabel}</Text>
        </View>

        <Text style={styles.reviewDesc}>
          {dueCount > 0
            ? `You have ${dueCount} flashcards ready for spaced repetition. Reviewing now will strengthen long-term retention.`
            : 'All caught up! Your review queue is clear.'}
        </Text>

        {dueCount > 0 && (
          <TouchableOpacity style={styles.startBtn} onPress={handleStartRevision} activeOpacity={0.9}>
            <Text style={styles.startBtnText}>{startLabel}</Text>
          </TouchableOpacity>
        )}
      </View>

      {totalCards > 0 && (
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{masteredCount}</Text>
            <Text style={styles.statLabel}>Mastered</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalCards}</Text>
            <Text style={styles.statLabel}>Total cards</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{accuracy}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
        </View>
      )}

      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingTop: spacing.huge + spacing.lg, paddingBottom: spacing.huge },

  pageTitle: { fontSize: 26, fontWeight: '700', color: colors.text, letterSpacing: -0.5, fontFamily: fontFamily.bodyBold },

  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.xl,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewCountArea: { alignItems: 'center', paddingVertical: spacing.md },
  reviewCount: { fontSize: 52, fontWeight: '700', color: colors.primary, letterSpacing: -2, fontFamily: fontFamily.bodyBold },
  reviewLabel: { fontSize: 15, color: colors.textSecondary, marginTop: spacing.xs },
  reviewDesc: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginTop: spacing.lg, textAlign: 'center' },

  startBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startBtnText: { fontSize: 15, fontWeight: '700', color: colors.white, fontFamily: fontFamily.bodyBold },

  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 17, fontWeight: '700', color: colors.text, fontFamily: fontFamily.bodyBold },
  statLabel: { fontSize: 11, color: colors.textTertiary, fontWeight: '500', marginTop: spacing.xs, fontFamily: fontFamily.body },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
});
