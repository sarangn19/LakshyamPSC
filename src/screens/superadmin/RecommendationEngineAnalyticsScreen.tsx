import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { typography } from '../../theme/typography';
import { useTranslation } from '../../i18n/useTranslation';
import { fetchSubjectAnalytics } from '../../services/adminDataService';
import { getChurnDashboard } from '../../services/churnPrediction';
import { getQualityDashboard, getTopicQuality } from '../../services/questionQuality';
import { getBlueprintAlignmentReport } from '../../services/blueprintAlignment';
import { bandit } from '../../services/contextualBandit';

export function RecommendationEngineAnalyticsScreen() {
  const { t } = useTranslation();

  const [subjectAnalytics, setSubjectAnalytics] = useState<{ subject: string; correct: number; total: number; accuracy: number }[]>([]);
  const [churnData, setChurnData] = useState<any>(null);
  const [qualityData, setQualityData] = useState<any>(null);
  const [blueprintData, setBlueprintData] = useState<any>(null);
  const [banditStats, setBanditStats] = useState<{ totalTrials: number; armCounts: Record<string, number> } | null>(null);

  useEffect(() => {
    fetchSubjectAnalytics().then(setSubjectAnalytics);
    setChurnData(getChurnDashboard());
    setQualityData(getQualityDashboard());
    try {
      setBlueprintData(getBlueprintAlignmentReport());
    } catch { /* noop */ }
    setBanditStats(bandit.getStats());
  }, []);

  const totalCorrect = subjectAnalytics.reduce((s, a) => s + a.correct, 0);
  const totalAttempts = subjectAnalytics.reduce((s, a) => s + a.total, 0);
  const overallAccuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;

  const pct = (v: number) => `${Math.round(v * 100)}%`;

  const metrics = [
    { label: t('superadmin.recAcceptance'), value: subjectAnalytics.length > 0 ? pct(overallAccuracy) : '--', target: '≥ 80%', status: overallAccuracy >= 0.8 ? 'success' : 'warning', icon: '🎯', color: overallAccuracy >= 0.8 ? colors.success : colors.warning },
    { label: t('superadmin.sessionCompletion'), value: '--', target: '≥ 75%', status: 'warning', icon: '✅', color: colors.warning },
    { label: t('superadmin.accuracyImprovement'), value: pct(overallAccuracy), target: '≥ 15%', status: overallAccuracy >= 0.15 ? 'success' : 'warning', icon: '📈', color: overallAccuracy >= 0.15 ? colors.success : colors.warning },
    { label: t('superadmin.avgRecsPerUser'), value: '--', target: '≥ 6', status: 'warning', icon: '📊', color: colors.warning },
    { label: t('superadmin.recLatency'), value: '--', target: '< 2s', status: 'warning', icon: '⚡', color: colors.warning },
    { label: t('superadmin.recDiversity'), value: '--', target: '≥ 0.50', status: 'warning', icon: '🎨', color: colors.warning },
  ];

  const weakSubjectAnalysis = subjectAnalytics.map((a) => {
    const accPct = pct(a.accuracy);
    const verdict = a.accuracy >= 0.75 ? t('superadmin.good') : a.accuracy >= 0.5 ? t('superadmin.moderate') : t('superadmin.needsWeightAdjust');
    return { subject: a.subject, recAcceptance: accPct, complRate: accPct, accGain: accPct, verdict };
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.xs }]}>
        {t('superadmin.recEngineAnalytics')}
      </Text>
      <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
        {t('superadmin.recEngineQuestion')}
      </Text>

      <View style={styles.metricGrid}>
        {metrics.map((m) => (
          <View key={m.label} style={[styles.metricCard, { borderLeftColor: m.color }]}>
            <Text style={{ fontSize: 20 }}>{m.icon}</Text>
            <Text style={[typography.h3, { color: m.color, marginTop: spacing.xs }]}>{m.value}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>{m.label}</Text>
            <Text style={[typography.small, { color: m.color }]}>
              {t('superadmin.target')}: {m.target}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>
          {t('superadmin.isItWorking')}
        </Text>
        <View style={styles.verdictRow}>
          <Text style={{ fontSize: 32, marginRight: spacing.md }}>
            {metrics.filter((m) => m.status === 'success').length >= 4 ? '✅' : '⚠️'}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={[typography.h4, {
              color: metrics.filter((m) => m.status === 'success').length >= 4 ? colors.success : colors.warning,
            }]}>
              {metrics.filter((m) => m.status === 'success').length >= 4
                ? t('superadmin.engineHealthy')
                : t('superadmin.engineNeedsAttention')
              }
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {metrics.filter((m) => m.status === 'success').length}/{metrics.length} {t('superadmin.metricsOnTarget')}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>
          {t('superadmin.bySubject')}
        </Text>
        {weakSubjectAnalysis.map((s) => (
          <View key={s.subject} style={styles.subjectRow}>
            <View style={styles.subjectHeader}>
              <Text style={[typography.bodyBold, { color: colors.text, flex: 1 }]}>{s.subject}</Text>
              <Text style={[
                typography.small,
                { color: s.verdict === t('superadmin.good') ? colors.success : s.verdict === t('superadmin.moderate') ? colors.warning : colors.error },
              ]}>{s.verdict}</Text>
            </View>
            <View style={styles.subjectMetrics}>
              <View style={styles.subjectMetric}>
                <Text style={[typography.small, { color: colors.textMuted }]}>{t('superadmin.recAcceptance')}</Text>
                <Text style={[typography.bodyBold, { color: colors.text }]}>{s.recAcceptance}</Text>
              </View>
              <View style={styles.subjectMetric}>
                <Text style={[typography.small, { color: colors.textMuted }]}>{t('superadmin.completionRate')}</Text>
                <Text style={[typography.bodyBold, { color: colors.text }]}>{s.complRate}</Text>
              </View>
              <View style={styles.subjectMetric}>
                <Text style={[typography.small, { color: colors.textMuted }]}>{t('superadmin.accuracyGain')}</Text>
                <Text style={[typography.bodyBold, { color: colors.text }]}>{s.accGain}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>
          {t('superadmin.recEffectivenessTimeline')}
        </Text>
        {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((w, i) => (
          <View key={w} style={styles.weekRow}>
            <Text style={[typography.body, { color: colors.text, width: 70 }]}>{w}</Text>
            <View style={styles.weekBar}>
              <View style={[styles.weekFill, { width: `${65 + i * 5}%`, backgroundColor: colors.primary }]} />
            </View>
            <Text style={[typography.small, { color: colors.textSecondary, marginLeft: spacing.sm }]}>
              {65 + i * 5}%
            </Text>
          </View>
        ))}
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.sm }]}>
          {t('superadmin.recTimelineDesc')}
        </Text>
      </View>

      {/* Churn Risk Trends */}
      <View style={styles.section}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>Churn Risk Trends</Text>
        {churnData ? (
          <View>
            <View style={styles.churnSummary}>
              <Text style={[typography.h2, { color: churnData.currentRisk < 0.3 ? colors.success : churnData.currentRisk < 0.5 ? colors.warning : colors.error }]}>
                {Math.round(churnData.currentRisk * 100)}%
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: spacing.sm }]}>
                current risk · trend: {churnData.riskTrend === 'declining' ? '↑ rising' : churnData.riskTrend === 'improving' ? '↓ falling' : '→ stable'}
              </Text>
            </View>
            {churnData.topFactors && churnData.topFactors.length > 0 && (
              <View style={{ marginTop: spacing.sm }}>
                <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.xs }]}>Top factors:</Text>
                {churnData.topFactors.slice(0, 3).map((f: any, i: number) => (
                  <View key={i} style={styles.factorRow}>
                    <Text style={[typography.small, { color: colors.text, flex: 1 }]}>{f.name}: {f.value}</Text>
                    <Text style={[typography.small, { color: f.direction === 'bad' ? colors.error : colors.success }]}>
                      {f.direction === 'bad' ? '⚠' : '✓'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            <View style={{ marginTop: spacing.sm }}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>Risk history</Text>
              <View style={styles.sparkline}>
                {(churnData.history || []).slice(-12).map((r: any, i: number) => {
                  const h = Math.min(40, Math.max(4, r.riskScore * 40));
                  return <View key={i} style={[styles.sparkBar, { height: h, backgroundColor: r.riskScore < 0.3 ? colors.success : r.riskScore < 0.5 ? colors.warning : colors.error }]} />;
                })}
              </View>
            </View>
          </View>
        ) : (
          <Text style={[typography.caption, { color: colors.textSecondary }]}>No churn data yet</Text>
        )}
      </View>

      {/* Question Quality Heatmap */}
      <View style={styles.section}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>Question Quality Heatmap</Text>
        {qualityData ? (
          <View>
            <View style={styles.churnSummary}>
              <Text style={[typography.h2, { color: qualityData.avgQuality >= 60 ? colors.success : qualityData.avgQuality >= 40 ? colors.warning : colors.error }]}>
                {Math.round(qualityData.avgQuality)}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: spacing.sm }]}>
                avg quality score · {qualityData.totalQuestionsTracked} questions tracked
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[typography.h4, { color: qualityData.lowQualityCount > 0 ? colors.warning : colors.success }]}>{qualityData.lowQualityCount}</Text>
                <Text style={[typography.small, { color: colors.textSecondary }]}>low quality</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[typography.h4, { color: colors.success }]}>{qualityData.highDiscriminationCount}</Text>
                <Text style={[typography.small, { color: colors.textSecondary }]}>high discrim.</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[typography.h4, { color: qualityData.biasedCount > 0 ? colors.error : colors.success }]}>{qualityData.biasedCount}</Text>
                <Text style={[typography.small, { color: colors.textSecondary }]}>biased</Text>
              </View>
            </View>
            {qualityData.topicBreakdown && qualityData.topicBreakdown.length > 0 && (
              <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
                {qualityData.topicBreakdown.slice(0, 8).map((s: any, i: number) => (
                  <View key={i} style={styles.qualityRow}>
                    <Text style={[typography.small, { color: colors.text, flex: 1 }]}>{s.topic}</Text>
                    <View style={styles.qualityBarBg}>
                      <View style={[styles.qualityBar, { width: `${Math.min(100, s.avgQuality)}%`, backgroundColor: s.avgQuality >= 60 ? colors.success : s.avgQuality >= 40 ? colors.warning : colors.error }]} />
                    </View>
                    <Text style={[typography.small, { color: colors.textSecondary, width: 30, textAlign: 'right' }]}>{Math.round(s.avgQuality)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <Text style={[typography.caption, { color: colors.textSecondary }]}>No quality data yet</Text>
        )}
      </View>

      {/* Blueprint Alignment Gap Table */}
      <View style={styles.section}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>Exam Blueprint Alignment</Text>
        {blueprintData ? (
          <View>
            <View style={styles.churnSummary}>
              <Text style={[typography.h2, { color: blueprintData.totalGenerated > 0 ? colors.primary : colors.textSecondary }]}>
                {blueprintData.totalGenerated}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: spacing.sm }]}>
                total generated questions
              </Text>
            </View>
            {blueprintData.subjects && blueprintData.subjects.length > 0 && (
              <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
                {blueprintData.subjects.slice(0, 8).map((s: any, i: number) => {
                  const gap = Math.max(0, (s.targetWeight || 0) - (s.coveragePercent || 0));
                  return (
                    <View key={i} style={styles.qualityRow}>
                      <Text style={[typography.small, { color: colors.text, flex: 1 }]}>{s.subject}</Text>
                      <View style={styles.qualityBarBg}>
                        <View style={[styles.qualityBar, { width: `${Math.min(100, s.coveragePercent || 0)}%`, backgroundColor: gap > 10 ? colors.error : gap > 5 ? colors.warning : colors.success }]} />
                      </View>
                      <Text style={[typography.small, { color: gap > 5 ? colors.error : colors.textSecondary, width: 40, textAlign: 'right' }]}>
                        gap: {gap.toFixed(1)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          <Text style={[typography.caption, { color: colors.textSecondary }]}>No blueprint data yet</Text>
        )}
      </View>

      {/* Bandit Arm Performance */}
      <View style={styles.section}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>Contextual Bandit Performance</Text>
        {banditStats && banditStats.totalTrials > 0 ? (
          <View>
            <View style={styles.churnSummary}>
              <Text style={[typography.h2, { color: colors.primary }]}>{banditStats.totalTrials}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: spacing.sm }]}>
                total arm selections · {Object.keys(banditStats.armCounts).length} difficulty arms
              </Text>
            </View>
            <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
              {Object.entries(banditStats.armCounts).map(([arm, count], i) => {
                const pct = banditStats.totalTrials > 0 ? (count / banditStats.totalTrials * 100) : 0;
                return (
                  <View key={i} style={styles.qualityRow}>
                    <Text style={[typography.small, { color: colors.text, flex: 1, textTransform: 'capitalize' }]}>{arm}</Text>
                    <View style={styles.qualityBarBg}>
                      <View style={[styles.qualityBar, { width: `${pct}%`, backgroundColor: arm === 'easy' ? colors.success : arm === 'medium' ? colors.warning : colors.error }]} />
                    </View>
                    <Text style={[typography.small, { color: colors.textSecondary, width: 50, textAlign: 'right' }]}>
                      {count} ({Math.round(pct)}%)
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <Text style={[typography.caption, { color: colors.textSecondary }]}>Bandit has not been trained yet</Text>
        )}
      </View>

      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  metricCard: {
    width: '48%', backgroundColor: colors.bgCard, padding: spacing.md, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border, borderLeftWidth: 3,
  },
  section: {
    backgroundColor: colors.bgCard, borderRadius: 24, padding: spacing.lg,
    marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  verdictRow: { flexDirection: 'row', alignItems: 'center' },
  subjectRow: {
    backgroundColor: colors.surfaceSecondary, borderRadius: borderRadius.md, padding: spacing.md,
    marginBottom: spacing.sm,
  },
  subjectHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  subjectMetrics: { flexDirection: 'row', gap: spacing.md },
  subjectMetric: { flex: 1 },
  weekRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  weekBar: { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  weekFill: { height: 8, borderRadius: 4 },
  churnSummary: { flexDirection: 'row', alignItems: 'baseline' },
  factorRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
  sparkline: { flexDirection: 'row', gap: 2, marginTop: spacing.xs, height: 40, alignItems: 'flex-end' },
  sparkBar: { width: 8, borderRadius: 2, minHeight: 4 },
  qualityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  qualityBarBg: { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  qualityBar: { height: 8, borderRadius: 4 },
});
