import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { typography } from '../../theme/typography';
import { getDueSummary } from '../../services/spacedRepetition';

type Props = {
  onStartRevision: (subject: string, topic: string) => void;
};

export function RevisionDueCard({ onStartRevision }: Props) {
  const due = getDueSummary();

  if (due.count === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.overline}>Revision Due</Text>
        <Text style={styles.emptyText}>All caught up! No topics due for revision.</Text>
      </View>
    );
  }

  const overdue = due.items.filter((i) => i.daysOverdue > 0);
  const dueToday = due.items.filter((i) => i.daysOverdue === 0);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.overline}>Revision Due</Text>
          <Text style={styles.count}>{due.count} topic{due.count !== 1 ? 's' : ''} to review</Text>
        </View>
        {due.highestOverdue > 0 && (
          <View style={styles.overdueBadge}>
            <Text style={styles.overdueText}>{due.highestOverdue}d overdue</Text>
          </View>
        )}
      </View>

      {overdue.length > 0 && (
        <View style={styles.subSection}>
          <Text style={styles.subLabel}>Overdue</Text>
          {overdue.slice(0, 3).map((item) => (
            <TouchableOpacity
              key={item.nodeId}
              style={styles.revisionItem}
              onPress={() => onStartRevision(item.subject, item.topic)}
              activeOpacity={0.7}
            >
              <Text style={styles.revisionName}>{item.name || item.topic}</Text>
              <Text style={styles.overdueDays}>{item.daysOverdue}d</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {dueToday.length > 0 && (
        <View style={styles.subSection}>
          <Text style={styles.subLabel}>Due Today</Text>
          {dueToday.slice(0, 3).map((item) => (
            <TouchableOpacity
              key={item.nodeId}
              style={styles.revisionItem}
              onPress={() => onStartRevision(item.subject, item.topic)}
              activeOpacity={0.7}
            >
              <Text style={styles.revisionName}>{item.name || item.topic}</Text>
              <Text style={styles.dueTag}>Due</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
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
    marginBottom: spacing.sm,
  },
  overline: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: typography.overline.fontFamily,
  },
  count: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
    fontFamily: typography.bodyBold.fontFamily,
  },
  overdueBadge: {
    backgroundColor: colors.error + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  overdueText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.error,
    fontFamily: typography.captionBold.fontFamily,
  },
  emptyText: {
    fontSize: 13,
    color: colors.success,
    marginVertical: spacing.sm,
    fontFamily: typography.bodySmall.fontFamily,
  },
  subSection: { marginTop: spacing.sm },
  subLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    fontFamily: typography.overline.fontFamily,
  },
  revisionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  revisionName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    fontFamily: typography.bodySmall.fontFamily,
  },
  overdueDays: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.error,
    marginLeft: spacing.sm,
    fontFamily: typography.captionBold.fontFamily,
  },
  dueTag: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.warning,
    marginLeft: spacing.sm,
    fontFamily: typography.caption.fontFamily,
  },
});
