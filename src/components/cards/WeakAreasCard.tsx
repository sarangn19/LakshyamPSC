import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { typography } from '../../theme/typography';
import { getCognitiveTwinSummary } from '../../services/learningRecommendationEngine';
import { computeExamOutlook } from '../../services/examOutlookEngine';

type Props = {
  onPracticeSubject: (subject: string) => void;
};

export function WeakAreasCard({ onPracticeSubject }: Props) {
  const outlook = computeExamOutlook();
  const weakSubjects = outlook.weakestSubjects;
  const strongSubjects = outlook.strongestSubjects;
  const summary = getCognitiveTwinSummary();

  if (weakSubjects.length === 0) {
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

      {weakSubjects.map((subj, i) => {
        const isStrongest = strongSubjects.some((s) => s.name === subj.name);
        return (
          <View key={subj.name} style={styles.weakItem}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>{i + 1}</Text>
            </View>
            <View style={styles.weakContent}>
              <Text style={styles.weakName}>{subj.name}</Text>
              <View style={styles.scoreRow}>
                <View style={[styles.scoreBar, { width: `${subj.score}%`, backgroundColor: isStrongest ? colors.success : colors.error }]} />
              </View>
              <Text style={styles.weakScore}>{subj.score}% proficiency</Text>
            </View>
            <TouchableOpacity
              style={styles.practiceBtn}
              onPress={() => onPracticeSubject(subj.name)}
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
