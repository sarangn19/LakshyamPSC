import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { typography } from '../theme/typography';
import { useAnalyticsStore, useMCQStore } from '../store';
import { ProgressBar, Badge, SectionHeader, StatCard } from '../components/common/StyledComponents';

export function AnalyticsScreen() {
  const { overallScore, revisionHealth, predictedReadiness, subjectConfidence } = useAnalyticsStore();
  const { subjectProgress, mistakes } = useMCQStore();

  const totalMCQs = 120;
  const totalCorrect = 82;
  const weeklyTrend = [55, 60, 58, 65, 70, 68, 72];

  const insights = [
    { label: 'Strongest Subject', value: subjectProgress.reduce((best, curr) => curr.confidenceScore > best.confidenceScore ? curr : best).subjectName, color: colors.accentGreen },
    { label: 'Needs Focus', value: subjectProgress.reduce((worst, curr) => curr.confidenceScore < worst.confidenceScore ? curr : worst).subjectName, color: colors.error },
    { label: 'Revision Status', value: revisionHealth, color: revisionHealth === 'Excellent' ? colors.accentGreen : colors.warning },
    { label: 'Exam Readiness', value: predictedReadiness, color: colors.info },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.lg }]}>Beyond marks — real insights</Text>

      <View style={styles.scoreCard}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>Preparedness Score</Text>
        <Text style={[typography.h1, { color: overallScore > 70 ? colors.accentGreen : overallScore > 45 ? colors.warning : colors.error, fontSize: 56 }]}>{overallScore}%</Text>
        <ProgressBar percent={overallScore} color={overallScore > 70 ? colors.accentGreen : overallScore > 45 ? colors.warning : colors.error} height={10} />
        <View style={styles.scoreMeta}>
          <Badge label={`Revision: ${revisionHealth}`} color={revisionHealth === 'Excellent' ? colors.accentGreen : colors.warning} />
          <Text style={[typography.small, { color: colors.textMuted }]}>{predictedReadiness}</Text>
        </View>
      </View>

      <View style={styles.insightsGrid}>
        {insights.map((insight) => (
          <View key={insight.label} style={[styles.insightCard, { borderLeftColor: insight.color }]}>
            <Text style={[typography.small, { color: colors.textMuted }]}>{insight.label}</Text>
            <Text style={[typography.bodyBold, { color: insight.color, marginTop: spacing.xs }]}>{insight.value}</Text>
          </View>
        ))}
      </View>

      <SectionHeader title="Subject Confidence" />
      {subjectConfidence.map((s) => {
        const barColor = s.percent > 70 ? colors.accentGreen : s.percent > 45 ? colors.warning : colors.error;
        return (
          <View key={s.subject} style={styles.confRow}>
            <View style={styles.confLabel}>
              <Text style={[typography.caption, { color: colors.text }]}>{s.subject}</Text>
              <Text style={[typography.small, { color: barColor }]}>{s.percent}%</Text>
            </View>
            <ProgressBar percent={s.percent} color={barColor} height={8} />
          </View>
        );
      })}

      <SectionHeader title="Weekly Trend" />
      <View style={styles.trendCard}>
        <View style={styles.trendRow}>
          {weeklyTrend.map((val, i) => {
            const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
            const height = (val / 100) * 120;
            return (
              <View key={i} style={styles.barCol}>
                <View style={[styles.bar, { height, backgroundColor: val > 65 ? colors.accentGreen : colors.warning }]} />
                <Text style={[typography.tiny, { color: colors.textMuted, marginTop: spacing.xs }]}>{days[i]}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Total MCQs" value={`${totalMCQs}`} color={colors.info} />
        <StatCard label="Accuracy" value={`${Math.round((totalCorrect / totalMCQs) * 100)}%`} color={colors.accentGreen} />
        <StatCard label="Mistakes" value={`${mistakes.length}`} color={colors.secondary} />
      </View>

      <SectionHeader title="Subject Breakdown" />
      {subjectProgress.map((sp) => (
        <View key={sp.subjectId} style={styles.breakdownCard}>
          <View style={styles.breakdownHeader}>
            <Text style={[typography.caption, { color: colors.text }]}>{sp.subjectName}</Text>
            <Badge label={sp.revisionStatus.replace('_', ' ')} color={
              sp.revisionStatus === 'good' ? colors.accentGreen :
              sp.revisionStatus === 'needs_attention' ? colors.warning : colors.error
            } />
          </View>
          <View style={styles.breakdownBars}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.tiny, { color: colors.textMuted }]}>Completion</Text>
              <ProgressBar percent={sp.completionPercent} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.tiny, { color: colors.textMuted }]}>Accuracy</Text>
              <ProgressBar percent={sp.accuracyPercent} color={colors.accentGreen} />
            </View>
          </View>
        </View>
      ))}

      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  scoreCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  insightsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xl },
  insightCard: {
    width: '48%',
    backgroundColor: colors.bgCard,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confRow: { marginBottom: spacing.sm },
  confLabel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  trendCard: {
    backgroundColor: colors.bgCard,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 150 },
  barCol: { alignItems: 'center' },
  bar: { width: 28, borderRadius: 4 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  breakdownCard: {
    backgroundColor: colors.bgCard,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  breakdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  breakdownBars: { flexDirection: 'row', gap: spacing.md },
});
