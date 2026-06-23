import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { typography } from '../../theme/typography';
import { getCognitiveTwinSummary } from '../../services/learningRecommendationEngine';
import { computeExamOutlook } from '../../services/examOutlookEngine';
import { useBKTStore } from '../../store/bktStore';
import { useCognitiveTwinStore } from '../../store/cognitiveTwinStore';
import { usePerformanceStore } from '../../store/performanceStore';

type Props = {
  onPracticeSubject: (subject: string, topic?: string) => void;
};

export function WeakAreasCard({ onPracticeSubject }: Props) {
  // Subscribe to stores so the component re-renders when data changes
  useBKTStore(s => s.topicMap);
  useCognitiveTwinStore(s => s.masteryMap);
  usePerformanceStore(s => s.interactionSignals?.length);

  const outlook = computeExamOutlook();
  const weakSubjects = outlook.weakestSubjects;
  const strongSubjects = outlook.strongestSubjects;
  const blockingTopics = outlook.blockingTopics;
  const summary = getCognitiveTwinSummary();

  // Show blocking topics (specific weak topics) if available, otherwise show weak subjects
  const weakAreas = blockingTopics.length > 0 
    ? blockingTopics.map(t => ({ name: t.topic, subject: t.subject, score: weakSubjects.find(s => s.name === t.subject)?.score ?? 30, isTopic: true }))
    : weakSubjects.map(s => ({ name: s.name, subject: s.name, score: s.score, isTopic: false }));

  if (__DEV__) {
    console.log('[WeakAreasCard] weakAreas:', JSON.stringify(weakAreas));
    console.log('[WeakAreasCard] path:', blockingTopics.length > 0 ? 'blockingTopics' : 'weakSubjects');
  }

  if (weakAreas.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.overline}>Top Weak Areas</Text>
        <Text style={styles.emptyText}>Keep practicing — your weak areas will appear here as you learn.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.overline}>Top Weak Areas</Text>
      <Text style={styles.subtitle}>Focus on these to improve your score</Text>

      {weakAreas.map((area, i) => {
        const isStrongest = strongSubjects.some((s) => s.name === area.subject);
        return (
          <View key={`${area.subject}::${area.name}`} style={styles.weakItem}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>{i + 1}</Text>
            </View>
            <View style={styles.weakContent}>
              <Text style={styles.weakName}>{area.name}</Text>
              {area.isTopic && <Text style={styles.subjectLabel}>{area.subject}</Text>}
              <View style={styles.scoreRow}>
                <View style={[styles.scoreBar, { width: `${area.score}%`, backgroundColor: isStrongest ? colors.success : colors.error }]} />
              </View>
              <Text style={styles.weakScore}>{area.score}% proficiency</Text>
            </View>
            <TouchableOpacity
              style={styles.practiceBtn}
              onPress={() => onPracticeSubject(area.subject, area.isTopic ? area.name : undefined)}
              activeOpacity={0.7}
            >
              <Text style={styles.practiceBtnText}>Practice</Text>
            </TouchableOpacity>
          </View>
        );
      })}
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
  overline: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: typography.overline.fontFamily,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
    fontFamily: typography.caption.fontFamily,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginVertical: spacing.md,
    fontFamily: typography.bodySmall.fontFamily,
  },
  weakItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.error,
    fontFamily: typography.captionBold.fontFamily,
  },
  weakContent: { flex: 1, marginRight: spacing.sm },
  weakName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    fontFamily: typography.bodySmall.fontFamily,
  },
  subjectLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 1,
    fontFamily: typography.tiny.fontFamily,
  },
  scoreRow: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  scoreBar: { height: '100%', borderRadius: 2 },
  weakScore: {
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 1,
    fontFamily: typography.tiny.fontFamily,
  },
  practiceBtn: {
    backgroundColor: colors.primary + '10',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  practiceBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: typography.captionBold.fontFamily,
  },
});
