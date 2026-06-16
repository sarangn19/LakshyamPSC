import { TouchableOpacity, Text, View, StyleSheet, ViewStyle } from 'react-native';
import React from 'react';
import { colors, spacing, borderRadius } from '../../theme';
import { typography } from '../../theme/typography';

interface Props {
  title: string;
  subtitle?: string;
  onPress: () => void;
  color?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary' | 'outline';
}

export function StyledCard({ title, subtitle, onPress, color = colors.primary, icon, style, variant = 'primary' }: Props) {
  const bgColor = variant === 'outline' ? 'transparent' : colors.bgCard;
  const borderColor = variant === 'outline' ? color : colors.border;

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: bgColor, borderColor, borderLeftColor: color, borderLeftWidth: 3 }, style]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.row}>
        {icon && <View style={styles.iconWrap}>{icon}</View>}
        <View style={styles.textWrap}>
          <Text style={[typography.bodyBold, { color: colors.text }]}>{title}</Text>
          {subtitle && <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>{subtitle}</Text>}
        </View>
        <Text style={{ color: colors.textMuted, fontSize: 18 }}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

export function Badge({ label, color = colors.primary }: { label: string; color?: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
      <Text style={[typography.small, { color }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ percent, color = colors.primary, height = 6 }: { percent: number; color?: string; height?: number }) {
  return (
    <View style={[styles.progressBg, { height }]}>
      <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, percent))}%`, backgroundColor: color, height }]} />
    </View>
  );
}

export function SectionHeader({ title, action, actionLabel }: { title: string; action?: () => void; actionLabel?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[typography.h4, { color: colors.text }]}>{title}</Text>
      {action && actionLabel && (
        <TouchableOpacity onPress={action}>
          <Text style={[typography.captionBold, { color: colors.primary }]}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function StatCard({ label, value, color = colors.primary }: { label: string; value: string; color?: string }) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.bgCard }]}>
      <Text style={[typography.h2, { color }]}>{value}</Text>
      <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center' }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({ message, icon = '📝' }: { message: string; icon?: string }) {
  return (
    <View style={styles.empty}>
      <Text style={{ fontSize: 40 }}>{icon}</Text>
      <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.md }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  progressBg: {
    backgroundColor: colors.bgInput,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    minWidth: 100,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.huge,
  },
});
