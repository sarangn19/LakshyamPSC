import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../theme';
import { useTranslation } from '../i18n/useTranslation';
import { getCurrentMonthStats, getAllTimeStats, getArchivedMonths, getMonthRemaining, MINIMUM_ATTEMPTS, MonthlyStats } from '../services/leaderboardService';

function StatRow({ label, value, subtitle }: { label: string; value: string; subtitle?: string }) {
  const { t, locale, setLocale, typography: tx, fontFamily } = useTranslation();
  return (
    <View style={styles.statRow}>
      <Text style={[tx.caption, { color: colors.textMuted }]}>{label}</Text>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[tx.h3, { color: colors.text }]}>{value}</Text>
        {subtitle ? <Text style={[tx.tiny, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function ArchivedMonthCard({ stats, expanded, onToggle }: { stats: MonthlyStats; expanded: boolean; onToggle: () => void }) {
  const { t, locale, setLocale, typography: tx, fontFamily } = useTranslation();
  const monthName = new Date(stats.year, stats.month).toLocaleString('default', { month: 'long' });
  return (
    <TouchableOpacity style={styles.archiveCard} onPress={onToggle} activeOpacity={0.7}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[tx.body, { color: colors.text, fontWeight: '600' }]}>{monthName} {stats.year}</Text>
        <Text style={[tx.caption, { color: colors.textMuted }]}>{t('leaderboard.rankFormat', { rank: stats.rank })}</Text>
      </View>
      {expanded && (
        <View style={{ marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm }}>
          <StatRow label={t('leaderboard.score')} value={stats.score.toLocaleString()} />
          <StatRow label={t('leaderboard.accuracy')} value={`${(stats.accuracy * 100).toFixed(1)}%`} subtitle={t('leaderboard.correctRatio', { correct: stats.correct, total: stats.total })} />
        </View>
      )}
    </TouchableOpacity>
  );
}

export function LeaderboardScreen({ navigation }: any) {
  const { t, locale, setLocale, typography: tx, fontFamily } = useTranslation();
  const [expandedArchive, setExpandedArchive] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(getMonthRemaining());

  useEffect(() => {
    const interval = setInterval(() => setRemaining(getMonthRemaining()), 60000);
    return () => clearInterval(interval);
  }, []);

  const monthly = useMemo(() => getCurrentMonthStats(), []);
  const allTime = useMemo(() => getAllTimeStats(), []);
  const archived = useMemo(() => getArchivedMonths(), []);
  const eligible = monthly.total >= MINIMUM_ATTEMPTS;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.rankBanner}>
        <Text style={styles.rankNumber}>#{monthly.rank}</Text>
        <Text style={styles.rankLabel}>{t('leaderboard.monthlyRank')}</Text>
        {!eligible && (
          <Text style={styles.rankNote}>{t('leaderboard.attemptMore', { count: MINIMUM_ATTEMPTS - monthly.total })}</Text>
        )}
      </View>

      <View style={styles.scoreCard}>
            <Text style={[tx.h2, { color: colors.text, textAlign: 'center', marginBottom: spacing.md }]}>
              {monthly.score.toLocaleString()}
            </Text>
            <View style={styles.scoreBreakdown}>
              <View style={styles.scoreItem}>
                <Text style={[tx.h4, { color: '#22C55E' }]}>{monthly.correct}</Text>
                <Text style={[tx.tiny, { color: colors.textMuted }]}>{t('leaderboard.correct')}</Text>
              </View>
              <View style={styles.scoreItem}>
                <Text style={[tx.h4, { color: '#EF4444' }]}>{monthly.wrong}</Text>
                <Text style={[tx.tiny, { color: colors.textMuted }]}>{t('leaderboard.wrong')}</Text>
              </View>
              <View style={styles.scoreItem}>
                <Text style={[tx.h4, { color: colors.text }]}>{(monthly.accuracy * 100).toFixed(1)}%</Text>
                <Text style={[tx.tiny, { color: colors.textMuted }]}>{t('leaderboard.accuracy')}</Text>
              </View>
              <View style={styles.scoreItem}>
                <Text style={[tx.h4, { color: colors.text }]}>{monthly.total}</Text>
                <Text style={[tx.tiny, { color: colors.textMuted }]}>{t('leaderboard.attempted')}</Text>
              </View>
            </View>
      </View>

      <View style={styles.section}>
        <Text style={[tx.h3, { color: colors.text, marginBottom: spacing.sm }]}>{t('leaderboard.seasonEndsIn')}</Text>
        <View style={styles.countdownRow}>
          <View style={styles.countdownBlock}>
            <Text style={styles.countdownNumber}>{remaining.days}</Text>
            <Text style={styles.countdownLabel}>{t('leaderboard.days')}</Text>
          </View>
          <Text style={styles.countdownSeparator}>:</Text>
          <View style={styles.countdownBlock}>
            <Text style={styles.countdownNumber}>{remaining.hours}</Text>
            <Text style={styles.countdownLabel}>{t('leaderboard.hours')}</Text>
          </View>
        </View>
        <Text style={[tx.tiny, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm }]}>
          {t('leaderboard.resetsOn', { date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('default', { month: 'long', day: 'numeric' }) })}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[tx.h3, { color: colors.text, marginBottom: spacing.sm }]}>{t('leaderboard.allTimeStats')}</Text>
        <View style={styles.statsCard}>
          <StatRow label={t('leaderboard.totalScore')} value={allTime.score.toLocaleString()} />
          <StatRow label={t('leaderboard.questionsAttempted')} value={allTime.total.toLocaleString()} />
          <StatRow label={t('leaderboard.overallAccuracy')} value={`${(allTime.accuracy * 100).toFixed(1)}%`} />
        </View>
      </View>

      {archived.length > 0 && (
        <View style={styles.section}>
          <Text style={[tx.h3, { color: colors.text, marginBottom: spacing.sm }]}>{t('leaderboard.previousMonths')}</Text>
          {archived.map((s) => {
            const key = `${s.year}-${s.month}`;
            return (
              <ArchivedMonthCard
                key={key}
                stats={s}
                expanded={expandedArchive === key}
                onToggle={() => setExpandedArchive(expandedArchive === key ? null : key)}
              />
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  rankBanner: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  rankNumber: { fontSize: 48, fontWeight: '800', color: '#fff' },
  rankLabel: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  rankNote: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 8, textAlign: 'center' },
  scoreCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  scoreBreakdown: { flexDirection: 'row', justifyContent: 'space-around' },
  scoreItem: { alignItems: 'center' },
  section: { marginBottom: spacing.lg },
  statsCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  countdownRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  countdownBlock: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    minWidth: 80,
  },
  countdownNumber: { fontSize: 28, fontWeight: '800', color: colors.text },
  countdownLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  countdownSeparator: { fontSize: 28, fontWeight: '800', color: colors.textMuted },
  archiveCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
});
