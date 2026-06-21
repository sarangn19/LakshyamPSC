import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { typography } from '../../theme/typography';
import { computeExamOutlook } from '../../services/examOutlookEngine';
import type { ExamOutlook } from '../../services/examOutlookEngine';

const STATUS_COLORS: Record<string, string> = {
  'Getting Started': colors.status.notPracticed,
  'Building Foundation': colors.status.needsRevision,
  'Making Progress': colors.status.improving,
  'Competitive': colors.status.strong,
  'Exam Ready': colors.primary,
};

export function ExamOutlookCard() {
  const outlook: ExamOutlook = computeExamOutlook();

  return (
    <View style={[styles.card, { borderLeftColor: STATUS_COLORS[outlook.outlookStatus] || colors.primary, borderLeftWidth: 4 }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.overline}>Exam Outlook</Text>
          <Text style={styles.status}>{outlook.outlookStatus}</Text>
        </View>
        <View style={[styles.confidenceBadge, { backgroundColor: STATUS_COLORS[outlook.outlookStatus] + '20' }]}>
          <Text style={[styles.confidenceText, { color: STATUS_COLORS[outlook.outlookStatus] }]}>
            {outlook.confidenceLevel}
          </Text>
        </View>
      </View>

      <View style={styles.rangeRow}>
        <Text style={styles.rangeLabel}>Expected Score Range</Text>
        <Text style={styles.rangeValue}>
          {outlook.expectedScoreRange.min}–{outlook.expectedScoreRange.max} Marks
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.actionRow}>
        <Text style={styles.actionLabel}>Next Action</Text>
        <Text style={styles.actionText}>{outlook.nextBestAction}</Text>
      </View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  overline: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: typography.overline.fontFamily,
  },
  status: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
    fontFamily: typography.h2.fontFamily,
  },
  confidenceBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: typography.captionBold.fontFamily,
  },
  rangeRow: {
    marginBottom: spacing.md,
  },
  rangeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    fontFamily: typography.caption.fontFamily,
  },
  rangeValue: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
    marginTop: spacing.xs,
    fontFamily: typography.displayL.fontFamily,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  actionRow: {},
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: typography.overline.fontFamily,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.xs,
    fontFamily: typography.bodyBold.fontFamily,
  },
});
