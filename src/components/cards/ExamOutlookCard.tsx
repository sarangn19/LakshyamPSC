import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { typography } from '../../theme/typography';
import { computeExamOutlook } from '../../services/examOutlookEngine';
import { usePerformanceStore } from '../../store/performanceStore';
import type { ExamOutlook } from '../../services/examOutlookEngine';

const STATUS_COLORS: Record<string, string> = {
  'Getting Started': colors.status.notPracticed,
  'Building Foundation': colors.status.needsRevision,
  'Making Progress': colors.status.improving,
  'Competitive': colors.status.strong,
  'Exam Ready': colors.primary,
};

interface ExamOutlookCardProps {
  onStartBlockingTopic: (subject: string, topic: string, recId: string) => void;
  onStartRevision: (subject: string, topic: string, recId: string) => void;
}

export function ExamOutlookCard({ onStartBlockingTopic, onStartRevision }: ExamOutlookCardProps) {
  const outlook: ExamOutlook = computeExamOutlook();
  const recIdRef = useRef<string | null>(null);

  const blocker = outlook.blockingTopics[0];
  const revisionRisk = outlook.revisionRiskTopics[0];

  useEffect(() => {
    const targetSubject = blocker?.subject || revisionRisk?.subject;
    const targetTopic = blocker?.topic || revisionRisk?.topic;
    const bef = targetSubject
      ? usePerformanceStore.getState().getSubjectAccuracy(targetSubject)
      : { correct: 0, total: 0 };
    const accuracyBefore = bef.total > 0 ? Math.round((bef.correct / bef.total) * 100) : undefined;

    const title = blocker
      ? `Practice ${blocker.topic} in ${blocker.subject}`
      : revisionRisk
        ? `Review ${revisionRisk.topic} in ${revisionRisk.subject}`
        : outlook.nextBestAction;
    const recId = usePerformanceStore.getState().addRecommendation({
      sessionType: blocker ? 'blocking_topic' : revisionRisk ? 'revision' : 'general',
      title,
      reasonFactors: blocker
        ? [blocker.reason]
        : revisionRisk
          ? [`${revisionRisk.daysOverdue} day(s) overdue`]
          : [],
      targetSubject,
      targetTopic,
      accuracyBefore,
    });
    recIdRef.current = recId;
  }, []);

  const handleStart = () => {
    const recId = recIdRef.current;
    if (recId) {
      usePerformanceStore.getState().markRecommendation(recId, 'accepted');
    }
    if (blocker) {
      onStartBlockingTopic(blocker.subject, blocker.topic, recId || '');
    } else if (revisionRisk) {
      onStartRevision(revisionRisk.subject, revisionRisk.topic, recId || '');
    }
  };

  const statusColor = STATUS_COLORS[outlook.outlookStatus] || colors.primary;

  return (
    <View style={[styles.card, { borderLeftColor: statusColor, borderLeftWidth: 4 }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.overline}>Exam Outlook</Text>
          <Text style={[styles.status, { color: statusColor }]}>{outlook.outlookStatus}</Text>
        </View>
        <View style={[styles.confidenceBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.confidenceText, { color: statusColor }]}>
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

      {outlook.totalMockTests > 0 && (
        <Text style={styles.mockTestLine}>
          Based on {outlook.totalMockTests} Mock Test{outlook.totalMockTests !== 1 ? 's' : ''} · {outlook.totalMockQuestions} Questions
        </Text>
      )}

      {blocker && (
        <View style={styles.blockerRow}>
          <Text style={styles.blockerLabel}>Biggest Opportunity</Text>
          <View style={styles.blockerContent}>
            <Text style={styles.blockerTopic}>⚠ {blocker.topic}</Text>
            <Text style={styles.blockerReason}>in {blocker.subject} — {blocker.reason}</Text>
          </View>
        </View>
      )}

      <View style={styles.actionRow}>
        <Text style={styles.actionLabel}>Next Action</Text>
        <Text style={styles.actionText}>{outlook.nextBestAction}</Text>
      </View>

      <TouchableOpacity
        style={[styles.startButton, { backgroundColor: statusColor }]}
        onPress={handleStart}
        activeOpacity={0.8}
      >
        <Text style={styles.startButtonText}>Start Now</Text>
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
  mockTestLine: {
    fontSize: 11,
    color: colors.textTertiary,
    marginBottom: spacing.md,
    fontFamily: typography.caption.fontFamily,
  },
  blockerRow: {
    backgroundColor: colors.status.needsRevision + '15',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  blockerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: typography.overline.fontFamily,
    marginBottom: spacing.xs,
  },
  blockerContent: {},
  blockerTopic: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    fontFamily: typography.bodyBold.fontFamily,
  },
  blockerReason: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
    fontFamily: typography.caption.fontFamily,
  },
  actionRow: {
    marginBottom: spacing.md,
  },
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
    color: colors.text,
    marginTop: spacing.xs,
    fontFamily: typography.bodyBold.fontFamily,
  },
  startButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    fontFamily: typography.bodyBold.fontFamily,
  },
});
