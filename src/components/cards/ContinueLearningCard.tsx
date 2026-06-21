import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { typography } from '../../theme/typography';
import { usePerformanceStore } from '../../store/performanceStore';

type Props = {
  onStartSession: () => void;
};

export function ContinueLearningCard({ onStartSession }: Props) {
  const lastOutcome = usePerformanceStore((s) => {
    const outcomes = s.sessionOutcomes;
    return outcomes.length > 0 ? outcomes[outcomes.length - 1] : null;
  });

  if (!lastOutcome) {
    return (
      <View style={styles.card}>
        <Text style={styles.overline}>Continue Learning</Text>
        <Text style={styles.emptyText}>No previous session found. Start your first practice session!</Text>
        <TouchableOpacity style={styles.resumeBtn} onPress={onStartSession} activeOpacity={0.7}>
          <Text style={styles.resumeBtnText}>Start Practice</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dateStr = new Date(lastOutcome.startTime).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.overline}>Continue Learning</Text>
          <Text style={styles.title}>Resume Last Session</Text>
        </View>
        <View style={styles.accuracyBadge}>
          <Text style={styles.accuracyText}>{Math.round(lastOutcome.accuracy)}%</Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{lastOutcome.sessionType || 'Practice'} • {lastOutcome.totalQuestions} questions</Text>
        <Text style={styles.meta}>{dateStr}</Text>
      </View>
      <TouchableOpacity style={styles.resumeBtn} onPress={onStartSession} activeOpacity={0.7}>
        <Text style={styles.resumeBtnText}>Continue →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  overline: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: typography.overline.fontFamily,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
    fontFamily: typography.bodyBold.fontFamily,
  },
  accuracyBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  accuracyText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
    fontFamily: typography.captionBold.fontFamily,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: typography.caption.fontFamily,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginVertical: spacing.md,
    fontFamily: typography.bodySmall.fontFamily,
  },
  resumeBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  resumeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    fontFamily: typography.captionBold.fontFamily,
  },
});
