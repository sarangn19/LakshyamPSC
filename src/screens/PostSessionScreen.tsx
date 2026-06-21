import React, { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from '../i18n/useTranslation';
import { colors, spacing, fontFamily } from '../theme';
import { typography } from '../theme/typography';
import { useMCQStore } from '../store';
import { usePerformanceStore } from '../store/performanceStore';
import { generateImprovementMessages, buildSessionSummary } from '../services/sessionFeedback';
import { useFlashcardStore } from '../store/flashcardStore';
import { getRecommendedSubjectAndTopic } from '../services/learningRecommendationEngine';
import { getLearnerProfile } from '../services/learnerStage';

export function PostSessionScreen({ navigation }: any) {
  const { t } = useTranslation();
  const lastSessionOutcome = useMCQStore((s) => s.lastSessionOutcome);
  const clearLastSessionOutcome = useMCQStore((s) => s.clearLastSessionOutcome);

  const previousOutcome = useMemo(() => {
    const outcomes = usePerformanceStore.getState().sessionOutcomes;
    return outcomes.length >= 2 ? outcomes[outcomes.length - 2] : null;
  }, []);

  const feedback = useMemo(() => {
    if (!lastSessionOutcome) return null;
    return {
      messages: generateImprovementMessages(lastSessionOutcome, previousOutcome),
      summary: buildSessionSummary(lastSessionOutcome, previousOutcome),
    };
  }, [lastSessionOutcome, previousOutcome]);

  const handleDismiss = () => {
    navigation.navigate('MainTabs');
  };

  const handleTargetWeakness = () => {
    if (!lastSessionOutcome) return;
    const weak = lastSessionOutcome.weakestSubject;
    const mcq = useMCQStore.getState();
    mcq.startOrchestratedSession({
      subjects: weak ? [weak] : undefined,
      difficulty: 'medium',
      count: 10,
      sessionType: 'weakness_practice',
    });
    navigation.navigate('MainTabs', { screen: 'Learn' });
  };

  const handleContinuePlan = () => {
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  if (!lastSessionOutcome || !feedback) return <View style={styles.container} />;

  const outcome = lastSessionOutcome;
  const accuracyPct = Math.round(outcome.accuracy * 100);
  const weakestSubject = outcome.weakestSubject || 'None';
  const hasWeakAction = outcome.weakestSubject && (outcome.subjectScores[outcome.weakestSubject]?.accuracy ?? 1) < 0.6;

  const improvementMsg = feedback.messages.find((m) => m.type === 'improvement');
  const attentionMsg = feedback.messages.find((m) => m.type === 'decline' || m.type === 'weakness');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[typography.displayL, { color: colors.text, lineHeight: 40 }]}>You completed today's practice.</Text>

      <View style={styles.accuracyCard}>
        <Text style={styles.accuracyValue}>{accuracyPct}%</Text>
        <Text style={styles.accuracyLabel}>
          {outcome.correctAnswers} of {outcome.totalQuestions} correct
        </Text>
        {previousOutcome && (
          <Text style={[styles.deltaText, { color: accuracyPct >= Math.round(previousOutcome.accuracy * 100) ? colors.success : colors.error }]}>
            {accuracyPct >= Math.round(previousOutcome.accuracy * 100) ? 'Improved' : 'Decreased'} vs last session
          </Text>
        )}
      </View>

      <View style={styles.reflectionSection}>
        {improvementMsg && (
          <View style={styles.reflectionRow}>
            <Text style={styles.reflectionLabel}>What improved</Text>
            <Text style={styles.reflectionText}>{improvementMsg.text}</Text>
          </View>
        )}

        {attentionMsg && (
          <View style={styles.reflectionRow}>
            <Text style={styles.reflectionLabel}>What needs attention</Text>
            <Text style={styles.reflectionText}>{attentionMsg.text}</Text>
          </View>
        )}

        <View style={styles.reflectionRow}>
          <Text style={styles.reflectionLabel}>Suggested next step</Text>
          <Text style={styles.reflectionText}>{feedback.summary.next}</Text>
        </View>
      </View>

      {(() => {
        const lp = getLearnerProfile();
        const nextRec = getRecommendedSubjectAndTopic();
        const hasEnoughData = lp.totalQuestions >= 5;
        return (
          <View style={styles.reflectionSection}>
            <Text style={styles.reflectionLabel}>Behind the Scenes</Text>
            {hasEnoughData ? (
              <>
                <View style={styles.reflectionRow}>
                  <Text style={styles.reflectionLabel2}>Learner Stage</Text>
                  <Text style={styles.reflectionValue}>{lp.stage} ({lp.totalQuestions} questions, {lp.sessionCount} sessions)</Text>
                </View>
                <View style={styles.reflectionRow}>
                  <Text style={styles.reflectionLabel2}>Overall Mastery</Text>
                  <Text style={styles.reflectionValue}>{lp.overallMastery}%</Text>
                </View>
                <View style={styles.reflectionRow}>
                  <Text style={styles.reflectionLabel2}>Gap Closure Rate</Text>
                  <Text style={styles.reflectionValue}>{Math.round(lp.gapClosureRate * 100)}%</Text>
                </View>
                {nextRec.subject && (
                  <View style={styles.reflectionRow}>
                    <Text style={styles.reflectionLabel2}>Next System Target</Text>
                    <Text style={styles.reflectionValue}>{nextRec.subject}{nextRec.topic ? ` → ${nextRec.topic}` : ''}{nextRec.subtopic ? ` → ${nextRec.subtopic}` : ''}</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.reflectionRow}>
                <Text style={styles.reflectionValue}>Keep going! After {5 - Math.min(lp.totalQuestions, 5)} more questions, personalized insights will unlock here.</Text>
              </View>
            )}
          </View>
        );
      })()}

      <View style={styles.actionsSection}>
        {hasWeakAction && (
          <TouchableOpacity style={styles.primaryAction} onPress={handleTargetWeakness} activeOpacity={0.9}>
            <Text style={styles.primaryActionText}>Practice {weakestSubject}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.secondaryAction} onPress={handleContinuePlan} activeOpacity={0.8}>
          <Text style={styles.secondaryActionText}>Finish for now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingTop: spacing.huge + spacing.lg, paddingBottom: spacing.huge },

  pageTitle: { fontSize: 22, fontWeight: '700', fontFamily: fontFamily.bodyBold, color: colors.text, lineHeight: 30, letterSpacing: -0.3 },

  accuracyCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  accuracyValue: { fontSize: 48, fontWeight: '700', fontFamily: fontFamily.bodyBold, color: colors.primary, letterSpacing: -2 },
  accuracyLabel: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.xs },
  deltaText: { fontSize: 12, fontWeight: '600', fontFamily: fontFamily.bodyMedium, marginTop: spacing.sm },

  reflectionSection: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reflectionRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reflectionLabel: { fontSize: 11, fontWeight: '700', fontFamily: fontFamily.bodyBold, color: colors.textTertiary, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: spacing.sm },
  reflectionText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginTop: spacing.xs },
  reflectionLabel2: { fontSize: 11, fontWeight: '700', fontFamily: fontFamily.bodyBold, color: colors.textTertiary, letterSpacing: 0.3, textTransform: 'uppercase' },
  reflectionValue: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginTop: spacing.xs },

  actionsSection: { marginTop: spacing.xl, gap: spacing.sm },
  primaryAction: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryActionText: { fontSize: 15, fontWeight: '700', fontFamily: fontFamily.bodyBold, color: colors.white },
  secondaryAction: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryActionText: { fontSize: 15, fontWeight: '600', fontFamily: fontFamily.bodyMedium, color: colors.textSecondary },
});
