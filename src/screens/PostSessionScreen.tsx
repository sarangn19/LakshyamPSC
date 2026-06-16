import React, { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { typography } from '../theme/typography';
import { useMCQStore } from '../store';
import { usePerformanceStore } from '../store/performanceStore';
import {
  generateImprovementMessages,
  buildSessionSummary,
} from '../services/sessionFeedback';
import { useFlashcardStore } from '../store/flashcardStore';

const TYPE_COLORS: Record<string, string> = {
  improvement: colors.accentGreen,
  decline: colors.error,
  steady: colors.info,
  insight: colors.accentTeal,
  weakness: colors.warning,
};

const TYPE_ICONS: Record<string, string> = {
  improvement: '📈',
  decline: '📉',
  steady: '➡️',
  insight: '💡',
  weakness: '🎯',
};

export function PostSessionScreen({ navigation }: any) {
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

  useEffect(() => {
    if (!lastSessionOutcome) {
      navigation.goBack();
    }
  }, [lastSessionOutcome, navigation]);

  const handleDismiss = () => {
    clearLastSessionOutcome();
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
    clearLastSessionOutcome();
    navigation.navigate('MainTabs', { screen: 'Learn' });
  };

  const handleReviewFlashcards = () => {
    useFlashcardStore.getState().loadDueCards();
    clearLastSessionOutcome();
    navigation.navigate('Flashcards');
  };

  const handleContinuePlan = () => {
    clearLastSessionOutcome();
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  if (!lastSessionOutcome || !feedback) return null;

  const outcome = lastSessionOutcome;
  const accuracyPct = Math.round(outcome.accuracy * 100);
  const accuracyEmoji = accuracyPct >= 80 ? '🎉' : accuracyPct >= 50 ? '👍' : '💪';
  const weakestSubject = outcome.weakestSubject || 'None';
  const strongestSubject = outcome.strongestSubject || 'None';

  const hasWeakAction = outcome.weakestSubject && (outcome.subjectScores[outcome.weakestSubject]?.accuracy ?? 1) < 0.6;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={{ fontSize: 48, textAlign: 'center' }}>{accuracyEmoji}</Text>
        <Text style={[typography.h2, { color: colors.text, textAlign: 'center', marginTop: spacing.md }]}>
          Session Complete
        </Text>
      </View>

      <View style={styles.accuracyCard}>
        <Text style={[typography.h1, { color: accuracyPct >= 80 ? colors.accentGreen : accuracyPct >= 50 ? colors.warning : colors.error, textAlign: 'center' }]}>
          {accuracyPct}%
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center' }]}>
          {outcome.correctAnswers}/{outcome.totalQuestions} correct
        </Text>
        {previousOutcome && (
          <View style={styles.deltaRow}>
            <Text style={[typography.small, {
              color: accuracyPct >= Math.round(previousOutcome.accuracy * 100) ? colors.accentGreen : colors.error,
            }]}>
              {accuracyPct >= Math.round(previousOutcome.accuracy * 100) ? '▲' : '▼'} {Math.abs(accuracyPct - Math.round(previousOutcome.accuracy * 100))}% vs last session
            </Text>
          </View>
        )}
      </View>

      {feedback.messages.length > 0 && (
        <View style={styles.messagesSection}>
          {feedback.messages.map((msg, i) => (
            <View key={i} style={[styles.messageRow, { borderLeftColor: TYPE_COLORS[msg.type] }]}>
              <Text style={{ fontSize: 14, marginRight: spacing.sm }}>{TYPE_ICONS[msg.type]}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary, flex: 1 }]}>{msg.text}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={[typography.captionBold, { color: colors.text }]}>{outcome.durationMinutes}m</Text>
          <Text style={[typography.tiny, { color: colors.textMuted }]}>Duration</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[typography.captionBold, { color: colors.text }]}>{outcome.totalQuestions}</Text>
          <Text style={[typography.tiny, { color: colors.textMuted }]}>Questions</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[typography.captionBold, { color: colors.accentGreen }]}>{strongestSubject.length > 20 ? strongestSubject.slice(0, 18) + '…' : strongestSubject}</Text>
          <Text style={[typography.tiny, { color: colors.textMuted }]}>Strongest</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[typography.captionBold, { color: colors.error }]}>{weakestSubject.length > 20 ? weakestSubject.slice(0, 18) + '…' : weakestSubject}</Text>
          <Text style={[typography.tiny, { color: colors.textMuted }]}>Weakest</Text>
        </View>
      </View>

      <View style={styles.closureCard}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>Reflection</Text>
        <View style={styles.closureRow}>
          <Text style={[typography.captionBold, { color: colors.primaryLight }]}>What did I do?</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>{feedback.summary.what}</Text>
        </View>
        <View style={styles.closureRow}>
          <Text style={[typography.captionBold, { color: colors.primaryLight }]}>Did I improve?</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>{feedback.summary.improvement}</Text>
        </View>
        <View style={styles.closureRow}>
          <Text style={[typography.captionBold, { color: colors.primaryLight }]}>What should I do next?</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>{feedback.summary.next}</Text>
        </View>
      </View>

      <View style={styles.actionsSection}>
        {hasWeakAction && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.error + '20', borderColor: colors.error + '40' }]} onPress={handleTargetWeakness}>
            <Text style={{ fontSize: 20 }}>🎯</Text>
            <View style={{ marginLeft: spacing.md, flex: 1 }}>
              <Text style={[typography.captionBold, { color: colors.text }]}>Target Weakness</Text>
              <Text style={[typography.tiny, { color: colors.textMuted }]}>Practice {weakestSubject}</Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]} onPress={handleReviewFlashcards}>
          <Text style={{ fontSize: 20 }}>🃏</Text>
          <View style={{ marginLeft: spacing.md, flex: 1 }}>
            <Text style={[typography.captionBold, { color: colors.text }]}>Review Related Flashcards</Text>
            <Text style={[typography.tiny, { color: colors.textMuted }]}>Reinforce with spaced repetition</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]} onPress={handleContinuePlan}>
          <Text style={{ fontSize: 20 }}>📋</Text>
          <View style={{ marginLeft: spacing.md, flex: 1 }}>
            <Text style={[typography.captionBold, { color: colors.text }]}>Continue Planned Session</Text>
            <Text style={[typography.tiny, { color: colors.textMuted }]}>Back to your study plan</Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss}>
        <Text style={[typography.bodyBold, { color: colors.textSecondary }]}>Done</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  header: { paddingTop: spacing.huge, paddingBottom: spacing.xl, alignItems: 'center' },
  accuracyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  deltaRow: { marginTop: spacing.xs },
  messagesSection: { marginBottom: spacing.lg },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  closureCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  closureRow: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
  },
  actionsSection: { gap: spacing.sm, marginBottom: spacing.xl },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  dismissBtn: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.huge,
  },
});
