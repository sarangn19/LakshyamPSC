import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { colors, spacing, borderRadius, fontFamily } from '../../theme';
import { typography } from '../../theme/typography';
import { useTranslation } from '../../i18n/useTranslation';
import { AuditEntry } from '../../store';
import { fetchAuditLogs } from '../../services/adminDataService';

export function AuditLogsScreen() {
  const { t } = useTranslation();
  const [filterResource, setFilterResource] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState<AuditEntry[]>([]);

  useEffect(() => {
    fetchAuditLogs().then(setLogs);
  }, []);

  const resources = ['all', ...new Set(logs.map((l) => l.resource))];

  const filtered = logs.filter((l) => {
    if (filterResource !== 'all' && l.resource !== filterResource) return false;
    if (search && !JSON.stringify(l).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const actionColor = (a: string) =>
    a === 'INSERT' ? colors.success : a === 'UPDATE' ? colors.warning : a === 'DELETE' ? colors.error : colors.primary;

  return (
    <ScrollView style={styles.container}>
      <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.xs }]}>
        {t('superadmin.auditLogs')}
      </Text>
      <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.md }]}>
        {t('superadmin.auditSubtitle')}
      </Text>

      <TextInput
        style={styles.searchInput}
        placeholder={t('superadmin.searchAudit')}
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator style={styles.filterScroll}>
        <View style={styles.filterRow}>
          {resources.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.filterBtn, filterResource === r && styles.filterBtnActive]}
              onPress={() => setFilterResource(r)}
            >
              <Text style={[typography.small, { color: filterResource === r ? '#fff' : colors.textSecondary }]}>
                {r === 'all' ? t('superadmin.all') : r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {filtered.map((log) => {
        const details = log.details;
        const before = details.before as Record<string, unknown> | undefined;
        const after = details.after as Record<string, unknown> | undefined;

        return (
          <View key={log.id} style={styles.logCard}>
            <View style={styles.logHeader}>
              <View style={[styles.logAction, { backgroundColor: actionColor(log.action) + '20' }]}>
                <Text style={[typography.small, { color: actionColor(log.action), fontWeight: '700', fontFamily: fontFamily.bodyBold }]}>
                  {log.action}
                </Text>
              </View>
              <Text style={[typography.body, { color: colors.text, flex: 1, marginLeft: spacing.sm }]}>
                {log.resource}
              </Text>
              <Text style={[typography.small, { color: colors.textMuted }]}>
                {log.authUserId ? `by ${log.authUserId.slice(0, 8)}` : 'system'}
              </Text>
            </View>
            <View style={styles.logMeta}>
              <Text style={[typography.small, { color: colors.textMuted }]}>
                {new Date(log.createdAt).toLocaleString()}
              </Text>
              {log.resourceId && (
                <Text style={[typography.small, { color: colors.textMuted }]}>
                  ID: {log.resourceId}
                </Text>
              )}
            </View>
            {(before || after) && (
              <View style={styles.logDiff}>
                {before && Object.keys(before).length > 0 && (
                  <View style={styles.diffColumn}>
                    <Text style={[typography.small, { color: colors.error, marginBottom: 2 }]}>{t('superadmin.before')}</Text>
                    {Object.entries(before).slice(0, 3).map(([k, v]) => (
                      <Text key={k} style={[typography.small, { color: colors.textSecondary }]}>
                        {k}: {String(v).slice(0, 30)}
                      </Text>
                    ))}
                  </View>
                )}
                {after && Object.keys(after).length > 0 && (
                  <View style={styles.diffColumn}>
                    <Text style={[typography.small, { color: colors.success, marginBottom: 2 }]}>{t('superadmin.after')}</Text>
                    {Object.entries(after).slice(0, 3).map(([k, v]) => (
                      <Text key={k} style={[typography.small, { color: colors.textSecondary }]}>
                        {k}: {String(v).slice(0, 30)}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })}

      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  searchInput: { backgroundColor: colors.bgCard, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border, color: colors.text, fontSize: 14 },
  filterScroll: { marginBottom: spacing.md },
  filterRow: { flexDirection: 'row', gap: spacing.sm },
  filterBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.round, borderWidth: 1, borderColor: colors.border },
  filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  logCard: {
    backgroundColor: colors.bgCard, borderRadius: 24, padding: spacing.md,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  logHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  logAction: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  logMeta: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  logDiff: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.surfaceSecondary, padding: spacing.sm, borderRadius: borderRadius.sm },
  diffColumn: { flex: 1 },
});
