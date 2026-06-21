import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { typography } from '../../theme/typography';
import { useBKTStore } from '../../store/bktStore';
import { useCognitiveTwinStore } from '../../store/cognitiveTwinStore';

type Props = {
  onStartTopic: (subject: string, topic: string) => void;
};

export function TodayFocusCard({ onStartTopic }: Props) {
  const bktGaps = useBKTStore((s) => s.getLearningGaps());
  const openGaps = useCognitiveTwinStore((s) => s.getOpenGaps());
  const recommendations = useCognitiveTwinStore((s) => s.prioritizeGaps());

  const focusItems: { subject: string; topic: string; reason: string }[] = [];

  if (recommendations.length > 0) {
    const top = recommendations.slice(0, 3);
    for (const r of top) {
      focusItems.push({
        subject: r.gap.subject,
        topic: r.gap.topic,
        reason: r.gap.status === 'open' ? 'Needs practice' : 'Improving — keep going',
      });
    }
  } else if (bktGaps.length > 0) {
    const top = bktGaps.slice(0, 3);
    for (const g of top) {
      focusItems.push({ subject: g.subject, topic: g.topic, reason: 'Gap detected' });
    }
  }

  if (focusItems.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.overline}>Today's Focus</Text>
        <Text style={styles.emptyText}>No recommendations yet — complete a session to get personalized focus areas.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.overline}>Today's Focus</Text>
      <Text style={styles.sectionSubtitle}>Recommended based on your recent performance</Text>
      {focusItems.map((item, i) => (
        <TouchableOpacity
          key={`${item.subject}-${item.topic}-${i}`}
          style={styles.focusItem}
          onPress={() => onStartTopic(item.subject, item.topic)}
          activeOpacity={0.7}
        >
          <View style={styles.focusDot} />
          <View style={styles.focusContent}>
            <Text style={styles.focusTopic}>{item.topic}</Text>
            <Text style={styles.focusSubject}>{item.subject} • {item.reason}</Text>
          </View>
          <Text style={styles.focusArrow}>→</Text>
        </TouchableOpacity>
      ))}
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
  sectionSubtitle: {
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
  focusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  focusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  focusContent: { flex: 1 },
  focusTopic: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontFamily: typography.bodyBold.fontFamily,
  },
  focusSubject: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
    fontFamily: typography.caption.fontFamily,
  },
  focusArrow: {
    fontSize: 16,
    color: colors.textTertiary,
    marginLeft: spacing.sm,
  },
});
