import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { typography } from '../../theme/typography';
import { useTranslation } from '../../i18n/useTranslation';
import { useAdminStore } from '../../store';
import { fetchTotalLearners, fetchActiveLearnersToday, fetchAverageAccuracy, fetchTotalSessions, fetchSessionCompletionRate } from '../../services/adminDataService';

export function ExecutiveDashboardScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { systemHealth, cognitiveTwinConfig } = useAdminStore();

  const [totalLearners, setTotalLearners] = useState<number | null>(null);
  const [dau, setDau] = useState<number | null>(null);
  const [avgAccuracy, setAvgAccuracy] = useState<number | null>(null);
  const [totalSessions, setTotalSessions] = useState<number | null>(null);
  const [completionRate, setCompletionRate] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetchTotalLearners(),
      fetchActiveLearnersToday(),
      fetchAverageAccuracy(),
      fetchTotalSessions(),
      fetchSessionCompletionRate(),
    ]).then(([learners, active, accuracy, sessions, completion]) => {
      setTotalLearners(learners);
      setDau(active);
      setAvgAccuracy(accuracy);
      setTotalSessions(sessions);
      setCompletionRate(completion);
    });
  }, []);

  const fmt = (n: number | null) => n !== null ? n.toLocaleString() : '--';
  const pct = (n: number | null) => n !== null ? `${Math.round(n * 100)}%` : '--';

  const metrics = [
    { label: t('superadmin.totalLearners'), value: fmt(totalLearners), icon: '👥', color: colors.primary, change: '+12%', trend: 'up' },
    { label: t('superadmin.dau'), value: fmt(dau), icon: '📱', color: colors.success, change: '+8%', trend: 'up' },
    { label: t('superadmin.wau'), value: '--', icon: '📊', color: colors.info, change: '+5%', trend: 'up' },
    { label: t('superadmin.retention'), value: pct(completionRate), icon: '🔄', color: colors.warning, change: '-2%', trend: 'down' },
    { label: t('superadmin.recAcceptance'), value: '--', icon: '🎯', color: colors.accent, change: '+15%', trend: 'up' },
    { label: t('superadmin.avgImprovement'), value: pct(avgAccuracy), icon: '📈', color: colors.success, change: '+3%', trend: 'up' },
  ];

  const healthScore = Math.round(
    (systemHealth.dbHealth === 'healthy' ? 30 : systemHealth.dbHealth === 'degraded' ? 15 : 0) +
    (systemHealth.syncFailures <= 2 ? 25 : systemHealth.syncFailures <= 5 ? 15 : 5) +
    (systemHealth.apiFailures <= 1 ? 25 : systemHealth.apiFailures <= 3 ? 15 : 5) +
    (systemHealth.queueFailures === 0 ? 20 : systemHealth.queueFailures <= 2 ? 10 : 0)
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[typography.h2, { color: colors.text }]}>{t('superadmin.execDashboard')}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {t('superadmin.platformHealth')}
          </Text>
        </View>
        <View style={[styles.healthBadge, {
          backgroundColor: healthScore >= 80 ? colors.success + '20' : healthScore >= 50 ? colors.warning + '20' : colors.error + '20',
        }]}>
          <Text style={[typography.h3, {
            color: healthScore >= 80 ? colors.success : healthScore >= 50 ? colors.warning : colors.error,
          }]}>{healthScore}</Text>
          <Text style={[typography.small, { color: colors.textSecondary }]}>{t('superadmin.healthScore')}</Text>
        </View>
      </View>

      <View style={styles.metricGrid}>
        {metrics.map((m) => (
          <View key={m.label} style={styles.metricCard}>
            <Text style={{ fontSize: 24 }}>{m.icon}</Text>
            <Text style={[typography.h2, { color: m.color, marginTop: spacing.xs }]}>{m.value}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>{m.label}</Text>
            <Text style={[typography.small, { color: m.trend === 'up' ? colors.success : colors.error }]}>
              {m.change}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>
          {t('superadmin.quickActions')}
        </Text>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => navigation.navigate('CognitiveTwinControl')}
        >
          <Text style={{ fontSize: 20 }}>🧠</Text>
          <View style={styles.actionText}>
            <Text style={[typography.body, { color: colors.text }]}>{t('superadmin.tuneCognitiveTwin')}</Text>
            <Text style={[typography.small, { color: colors.textSecondary }]}>
              {t('superadmin.currentWeights')}: W:{cognitiveTwinConfig.weaknessWeight} F:{cognitiveTwinConfig.forgettingWeight} C:{cognitiveTwinConfig.confusionWeight} Cov:{cognitiveTwinConfig.coverageWeight}
            </Text>
          </View>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => navigation.navigate('UserManagement')}
        >
          <Text style={{ fontSize: 20 }}>👥</Text>
          <View style={styles.actionText}>
            <Text style={[typography.body, { color: colors.text }]}>{t('superadmin.manageUsers')}</Text>
            <Text style={[typography.small, { color: colors.textSecondary }]}>
              {t('superadmin.activeUsers')}: {fmt(totalLearners)}
            </Text>
          </View>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => navigation.navigate('Billing')}
        >
          <Text style={{ fontSize: 20 }}>💰</Text>
          <View style={styles.actionText}>
            <Text style={[typography.body, { color: colors.text }]}>Billing & Revenue</Text>
            <Text style={[typography.small, { color: colors.textSecondary }]}>MRR, churn, subscription management</Text>
          </View>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => navigation.navigate('SystemMonitoring')}
        >
          <Text style={{ fontSize: 20 }}>⚙️</Text>
          <View style={styles.actionText}>
            <Text style={[typography.body, { color: colors.text }]}>{t('superadmin.checkSystem')}</Text>
            <Text style={[typography.small, { color: colors.textSecondary }]}>
              {t('superadmin.lastChecked')}: {new Date(systemHealth.lastChecked).toLocaleString()}
            </Text>
          </View>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  healthBadge: { alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, minWidth: 70 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  metricCard: {
    width: '48%', backgroundColor: colors.bgCard, padding: spacing.md, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border,
  },
  section: {
    backgroundColor: colors.bgCard, borderRadius: 24, padding: spacing.lg,
    marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  actionText: { flex: 1, marginLeft: spacing.md },
});
