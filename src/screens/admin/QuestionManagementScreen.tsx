import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { typography } from '../../theme/typography';
import { useTranslation } from '../../i18n/useTranslation';
import { fetchFlaggedQuestions, updateFlaggedStatus } from '../../services/adminDataService';

export function QuestionManagementScreen() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [search, setSearch] = useState('');
  const [flagged, setFlagged] = useState<any[]>([]);

  useEffect(() => {
    fetchFlaggedQuestions().then(setFlagged).catch((err) => {
      console.error('Failed to fetch flagged questions:', err);
    });
  }, []);
  const filtered = flagged.filter((f) => {
    if (filter !== 'all' && f.status !== filter) return false;
    if (search && !f.questionText.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[typography.h2, { color: colors.text, flex: 1 }]}>
          {t('admin.questionManagement')}
        </Text>
        <TouchableOpacity style={styles.createBtn}>
          <Text style={[typography.bodyBold, { color: '#fff' }]}>+ {t('admin.createQuestion')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('admin.searchQuestions')}
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        {(['all', 'pending', 'reviewed'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[typography.caption, { color: filter === f ? '#fff' : colors.textSecondary }]}>
              {f === 'all' ? t('admin.all') : f === 'pending' ? t('admin.pending') : t('admin.reviewed')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={[typography.h3, { color: colors.primary }]}>{flagged.length}</Text>
          <Text style={[typography.small, { color: colors.textSecondary }]}>{t('admin.totalQuestions')}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[typography.h3, { color: colors.error }]}>
            {flagged.filter((f) => f.errorRate > 40).length}
          </Text>
          <Text style={[typography.small, { color: colors.textSecondary }]}>{t('admin.abnormalFailure')}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[typography.h3, { color: colors.warning }]}>
            {flagged.filter((f) => f.status === 'pending').length}
          </Text>
          <Text style={[typography.small, { color: colors.textSecondary }]}>{t('admin.pendingReview')}</Text>
        </View>
      </View>

      {filtered.map((q) => (
        <TouchableOpacity key={q.id} style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <Text style={[typography.body, { color: colors.text, flex: 1 }]} numberOfLines={2}>
              {q.questionText}
            </Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: q.status === 'pending' ? colors.warning + '20' : q.status === 'resolved' ? colors.success + '20' : colors.info + '20' },
            ]}>
              <Text style={[
                typography.small,
                { color: q.status === 'pending' ? colors.warning : q.status === 'resolved' ? colors.success : colors.info },
              ]}>{q.status}</Text>
            </View>
          </View>
          <View style={styles.questionMeta}>
            <Text style={[typography.small, { color: colors.textMuted }]}>
              {t('admin.accuracy')}: <Text style={{ color: q.accuracyRate < 40 ? colors.error : colors.success }}>{q.accuracyRate}%</Text>
            </Text>
            <Text style={[typography.small, { color: colors.textMuted }]}>
              {t('admin.errorRate')}: <Text style={{ color: q.errorRate > 40 ? colors.error : colors.textMuted }}>{q.errorRate}%</Text>
            </Text>
            <Text style={[typography.small, { color: colors.textMuted }]}>
              {t('admin.usageCount')}: {q.usageCount}
            </Text>
            <Text style={[typography.small, { color: colors.textMuted }]}>
              {t('admin.flags')}: {flagged.filter((f) => f.questionId === q.questionId).length}
            </Text>
          </View>
          <View style={styles.questionActions}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
              <Text style={[typography.small, { color: '#fff' }]}>{t('admin.edit')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.success }]}>
              <Text style={[typography.small, { color: '#fff' }]}>{t('admin.approve')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.error }]}>
              <Text style={[typography.small, { color: '#fff' }]}>{t('admin.archive')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}

      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  createBtn: {
    backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  searchRow: { marginBottom: spacing.md },
  searchInput: {
    backgroundColor: colors.bgCard, borderRadius: borderRadius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, color: colors.text, fontSize: 14,
  },
  filterRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  filterBtn: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.round,
    borderWidth: 1, borderColor: colors.border,
  },
  filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  summaryCard: {
    flex: 1, backgroundColor: colors.bgCard, padding: spacing.md, borderRadius: borderRadius.md,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  questionCard: {
    backgroundColor: colors.bgCard, borderRadius: 24, padding: spacing.md,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  questionHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm, marginLeft: spacing.sm },
  questionMeta: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  questionActions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
});
