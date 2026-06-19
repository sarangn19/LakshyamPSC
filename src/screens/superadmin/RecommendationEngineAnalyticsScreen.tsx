import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { typography } from '../../theme/typography';
import { useTranslation } from '../../i18n/useTranslation';
import { fetchSubjectAnalytics } from '../../services/adminDataService';

export function RecommendationEngineAnalyticsScreen() {
  const { t } = useTranslation();

  const [subjectAnalytics, setSubjectAnalytics] = useState<{ subject: string; correct: number; total: number; accuracy: number }[]>([]);

  useEffect(() => {
    fetchSubjectAnalytics().then(setSubjectAnalytics);
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
    backgroundColor: colors.bgCard, borderRadius: borderRadius.lg, padding: spacing.xl,
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
});
