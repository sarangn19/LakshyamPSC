import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { typography } from '../../theme/typography';
import { useTranslation } from '../../i18n/useTranslation';
import { fetchSuggestions, updateSuggestionStatus } from '../../services/adminDataService';

export function SuggestionManagementScreen() {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('new');
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestions().then(setSuggestions);
  }, []);

  const filtered = filter === 'all'
    ? suggestions
    : suggestions.filter((s: any) => s.status === filter);

  const item = selected ? suggestions.find((s: any) => s.id === selected) : null;

  const statusColor = (s: string) =>
    s === 'new' ? colors.warning : s === 'read' ? colors.info : colors.success;

  return (
    <ScrollView style={styles.container}>
      <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.md }]}>
        Suggestions
      </Text>

      <View style={styles.summaryRow}>
        {(['all', 'new', 'read', 'resolved'] as const).map((s) => {
          const count = s === 'all' ? suggestions.length : suggestions.filter((x: any) => x.status === s).length;
          return (
            <TouchableOpacity
              key={s}
              style={[styles.summaryCard, filter === s && styles.summaryCardActive]}
              onPress={() => setFilter(s)}
            >
              <Text style={[typography.h4, { color: filter === s ? colors.primary : colors.text }]}>{count}</Text>
              <Text style={[typography.small, { color: filter === s ? colors.primary : colors.textSecondary }]}>{s}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {item ? (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <Text style={[typography.h4, { color: colors.text, flex: 1 }]}>{item.subject || 'No subject'}</Text>
            <TouchableOpacity onPress={() => setSelected(null)}>
              <Text style={[typography.bodyBold, { color: colors.primary }]}>Back</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.metaRow}>
            <Text style={[typography.small, { color: colors.textSecondary }]}>From: {item.userName}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '20' }]}>
              <Text style={[typography.small, { color: statusColor(item.status) }]}>{item.status}</Text>
            </View>
            <Text style={[typography.small, { color: colors.textMuted }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
          <Text style={[typography.body, { color: colors.text, marginVertical: spacing.md }]}>
            {item.message}
          </Text>
          <View style={styles.detailActions}>
            {item.status === 'new' && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.info }]}
                onPress={async () => { await updateSuggestionStatus(item.id, 'read'); const u = await fetchSuggestions(); setSuggestions(u); }}
              >
                <Text style={[typography.small, { color: '#fff' }]}>Mark as Read</Text>
              </TouchableOpacity>
            )}
            {item.status !== 'resolved' && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.success }]}
                onPress={async () => { await updateSuggestionStatus(item.id, 'resolved'); const u = await fetchSuggestions(); setSuggestions(u); setSelected(null); }}
              >
                <Text style={[typography.small, { color: '#fff' }]}>Resolve</Text>
              </TouchableOpacity>
            )}
            {item.status !== 'new' && item.status !== 'resolved' && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.warning }]}
                onPress={async () => { await updateSuggestionStatus(item.id, 'new'); const u = await fetchSuggestions(); setSuggestions(u); }}
              >
                <Text style={[typography.small, { color: '#fff' }]}>Reopen</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        filtered.map((s) => (
          <TouchableOpacity key={s.id} style={styles.card} onPress={() => setSelected(s.id)}>
            <View style={styles.cardHeader}>
              <Text style={[typography.bodyBold, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                {s.subject || 'No subject'}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor(s.status) + '20' }]}>
                <Text style={[typography.small, { color: statusColor(s.status) }]}>{s.status}</Text>
              </View>
            </View>
            <View style={styles.cardMeta}>
              <Text style={[typography.small, { color: colors.textMuted }]}>
                {s.userName} · {new Date(s.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={2}>
              {s.message}
            </Text>
          </TouchableOpacity>
        ))
      )}

      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg, flexWrap: 'wrap' },
  summaryCard: { backgroundColor: colors.bgCard, padding: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center', minWidth: 60, flex: 1, borderWidth: 1, borderColor: colors.border },
  summaryCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  detailCard: { backgroundColor: colors.bgCard, borderRadius: 24, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  metaRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.sm },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  detailActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.sm, alignItems: 'center' },
  card: { backgroundColor: colors.bgCard, borderRadius: 24, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  cardMeta: { marginBottom: spacing.sm },
});
