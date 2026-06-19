import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { typography } from '../../theme/typography';
import { useTranslation } from '../../i18n/useTranslation';
import { fetchSystemHealth } from '../../services/adminDataService';

export function SystemMonitoringScreen() {
  const { t } = useTranslation();
  const [health, setHealth] = useState<any>(null);

  const loadHealth = () => fetchSystemHealth().then(setHealth);

  useEffect(() => {
    loadHealth();
  }, []);

  const sections = [
    {
      title: t('superadmin.syncHealth'),
      icon: '🔄',
      items: [
        { label: t('superadmin.syncFailures'), value: health?.syncFailures ?? '--', status: health ? (health.syncFailures <= 2 ? 'good' : health.syncFailures <= 5 ? 'warn' : 'bad') : 'warn' },
        { label: t('superadmin.queueFailures'), value: health?.queueFailures ?? '--', status: health ? (health.queueFailures === 0 ? 'good' : 'bad') : 'warn' },
        { label: t('superadmin.apiFailures'), value: health?.apiFailures ?? '--', status: health ? (health.apiFailures <= 1 ? 'good' : health.apiFailures <= 3 ? 'warn' : 'bad') : 'warn' },
      ],
    },
    {
      title: t('superadmin.databaseHealth'),
      icon: '🗄️',
      items: [
        { label: t('superadmin.dbStatus'), value: health?.dbHealth ?? '--', status: health ? (health.dbHealth === 'healthy' ? 'good' : health.dbHealth === 'degraded' ? 'warn' : 'bad') : 'warn' },
        { label: t('superadmin.storageUsage'), value: health ? `${health.storageUsedMb} MB` : '--', status: health ? (health.storageUsedMb < 500 ? 'good' : health.storageUsedMb < 1000 ? 'warn' : 'bad') : 'warn' },
        { label: t('superadmin.connections'), value: '--', status: 'warn' },
      ],
    },
    {
      title: t('superadmin.edgeFunctions'),
      icon: '⚡',
      items: [
        { label: 'generate-question', value: '--', status: 'warn' },
        { label: t('superadmin.weeklyInvocations'), value: '--', status: 'warn' },
        { label: t('superadmin.errorRate'), value: '--', status: 'warn' },
      ],
    },
  ];

  const statusColor = (s: string) =>
    s === 'good' ? colors.success : s === 'warn' ? colors.warning : colors.error;

  const statusIcon = (s: string) =>
    s === 'good' ? '✅' : s === 'warn' ? '⚠️' : '❌';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[typography.h2, { color: colors.text, flex: 1 }]}>
          {t('superadmin.systemMonitoring')}
        </Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadHealth}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>↻ {t('superadmin.refresh')}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
        {t('superadmin.lastChecked')}: {health ? new Date(health.lastChecked).toLocaleString() : '--'}
      </Text>

      <View style={styles.overallRow}>
        {sections.map((s) => {
          const good = s.items.filter((i) => i.status === 'good').length;
          const total = s.items.length;
          return (
            <View key={s.title} style={styles.overallCard}>
              <Text style={{ fontSize: 24 }}>{s.icon}</Text>
              <Text style={[typography.h3, { color: good === total ? colors.success : good >= total / 2 ? colors.warning : colors.error }]}>
                {good}/{total}
              </Text>
              <Text style={[typography.small, { color: colors.textSecondary }]}>{s.title}</Text>
            </View>
          );
        })}
      </View>

      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>
            {section.icon} {section.title}
          </Text>
          {section.items.map((item) => (
            <View key={item.label} style={styles.itemRow}>
              <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{item.label}</Text>
              <Text style={{ fontSize: 16, marginRight: spacing.sm }}>{statusIcon(item.status)}</Text>
              <Text style={[
                typography.bodyBold,
                { color: statusColor(item.status) },
              ]}>{item.value}</Text>
            </View>
          ))}
        </View>
      ))}

      <View style={styles.section}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>
          ⚙️ {t('superadmin.recentErrors')}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {t('superadmin.noErrors') || 'No recent errors'}
        </Text>
      </View>

      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  refreshBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: colors.primary, borderRadius: borderRadius.sm },
  overallRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  overallCard: {
    flex: 1, backgroundColor: colors.bgCard, padding: spacing.md, borderRadius: borderRadius.md,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  section: {
    backgroundColor: colors.bgCard, borderRadius: borderRadius.lg, padding: spacing.xl,
    marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
});
