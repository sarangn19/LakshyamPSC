import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { typography } from '../../theme/typography';
import type { CurrentAffair } from '../../data/mockData';

type Props = {
  items: CurrentAffair[];
  onViewAll: () => void;
};

export function CurrentAffairsCard({ items, onViewAll }: Props) {
  const important = items.filter((ca) => ca.isImportant).slice(0, 3);

  if (important.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.overline}>Current Affairs</Text>
        <Text style={styles.emptyText}>No current affairs loaded yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.overline}>Current Affairs</Text>
          <Text style={styles.subtitle}>Latest important items</Text>
        </View>
        <TouchableOpacity onPress={onViewAll} activeOpacity={0.7}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      {important.map((item) => (
        <TouchableOpacity key={item.id} style={styles.caItem} onPress={() => item.url ? Linking.openURL(item.url) : null} activeOpacity={0.7}>
          <View style={styles.caDot} />
          <View style={styles.caContent}>
            <Text style={styles.caTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.caSummary} numberOfLines={2}>{item.summary}</Text>
            <View style={styles.caMeta}>
              <Text style={styles.caCategory}>{item.category}</Text>
              <Text style={styles.caDate}>{item.date}</Text>
            </View>
          </View>
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
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
    fontFamily: typography.caption.fontFamily,
  },
  viewAll: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    fontFamily: typography.captionBold.fontFamily,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginVertical: spacing.md,
    fontFamily: typography.bodySmall.fontFamily,
  },
  caItem: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  caDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginRight: spacing.sm,
  },
  caContent: { flex: 1 },
  caTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    fontFamily: typography.bodySmall.fontFamily,
  },
  caSummary: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
    fontFamily: typography.caption.fontFamily,
  },
  caMeta: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  caCategory: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'capitalize',
    fontFamily: typography.tiny.fontFamily,
  },
  caDate: {
    fontSize: 10,
    color: colors.textTertiary,
    fontFamily: typography.tiny.fontFamily,
  },
});
