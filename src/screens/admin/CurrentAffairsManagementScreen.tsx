import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { typography } from '../../theme/typography';
import { useTranslation } from '../../i18n/useTranslation';
import { fetchCAEntries, createCAEntry, updateCAStatus } from '../../services/adminDataService';

export function CurrentAffairsManagementScreen() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'draft' | 'scheduled' | 'published'>('all');
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('kerala');

  useEffect(() => {
    fetchCAEntries().then(setEntries);
  }, []);

  const filtered = filter === 'all' ? entries : entries.filter((c) => c.status === filter);
  const published = entries.filter((c) => c.status === 'published').length;
  const scheduled = entries.filter((c) => c.status === 'scheduled').length;
  const drafts = entries.filter((c) => c.status === 'draft').length;

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await createCAEntry({ title: newTitle.trim(), content: newContent.trim(), category: newCategory, source: 'Admin', status: 'draft', scheduledFor: null });
    const updated = await fetchCAEntries();
    setEntries(updated);
    setNewTitle('');
    setNewContent('');
    setShowForm(false);
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateCAStatus(id, status);
    const updated = await fetchCAEntries();
    setEntries(updated);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[typography.h2, { color: colors.text, flex: 1 }]}>
          {t('admin.currentAffairsMgmt')}
        </Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => setShowForm(!showForm)}>
          <Text style={[typography.bodyBold, { color: '#fff' }]}>+ {t('admin.createCA')}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <TextInput
            style={styles.input}
            placeholder={t('admin.caTitlePlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={newTitle}
            onChangeText={setNewTitle}
          />
          <TextInput
            style={[styles.input, { minHeight: 80 }]}
            placeholder={t('admin.caContentPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={newContent}
            onChangeText={setNewContent}
            multiline
          />
          <View style={styles.categoryRow}>
            {['kerala', 'national', 'appointments', 'schemes', 'awards'].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catBtn, newCategory === cat && styles.catBtnActive]}
                onPress={() => setNewCategory(cat)}
              >
                <Text style={[typography.small, { color: newCategory === cat ? '#fff' : colors.textSecondary }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.formActions}>
            <TouchableOpacity style={[styles.formBtn, { backgroundColor: colors.primary }]} onPress={handleCreate}>
              <Text style={[typography.bodyBold, { color: '#fff' }]}>{t('admin.saveAsDraft')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.formBtn, { backgroundColor: colors.success }]} onPress={handleCreate}>
              <Text style={[typography.bodyBold, { color: '#fff' }]}>{t('admin.publishNow')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
           <Text style={[typography.h3, { color: colors.primary }]}>{entries.length}</Text>
          <Text style={[typography.small, { color: colors.textSecondary }]}>{t('admin.totalCA')}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[typography.h3, { color: colors.success }]}>{published}</Text>
          <Text style={[typography.small, { color: colors.textSecondary }]}>{t('admin.published')}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[typography.h3, { color: colors.info }]}>{scheduled}</Text>
          <Text style={[typography.small, { color: colors.textSecondary }]}>{t('admin.scheduled')}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[typography.h3, { color: colors.warning }]}>{drafts}</Text>
          <Text style={[typography.small, { color: colors.textSecondary }]}>{t('admin.drafts')}</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'draft', 'scheduled', 'published'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[typography.caption, { color: filter === f ? '#fff' : colors.textSecondary }]}>
              {f === 'all' ? t('admin.all') : f === 'draft' ? t('admin.drafts') : f === 'scheduled' ? t('admin.scheduled') : t('admin.published')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.map((ca) => (
        <TouchableOpacity key={ca.id} style={styles.caCard}>
          <View style={styles.caHeader}>
            <Text style={[typography.bodyBold, { color: colors.text, flex: 1 }]}>{ca.title}</Text>
            <View style={[
              styles.statusDot,
              { backgroundColor: ca.status === 'published' ? colors.success : ca.status === 'scheduled' ? colors.info : colors.warning },
            ]} />
          </View>
          <View style={styles.caMeta}>
            <Text style={[typography.small, { color: colors.textMuted }]}>{ca.category}</Text>
            {ca.scheduledFor && (
              <Text style={[typography.small, { color: colors.textMuted }]}>
                {t('admin.scheduledFor')}: {ca.scheduledFor}
              </Text>
            )}
          </View>
          <View style={styles.caActions}>
            {ca.status === 'draft' && (
              <>
                <TouchableOpacity style={[styles.caActionBtn, { backgroundColor: colors.success }]} onPress={() => handleStatusChange(ca.id, 'published')}>
                  <Text style={[typography.small, { color: '#fff' }]}>{t('admin.publishNow')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.caActionBtn, { backgroundColor: colors.info }]} onPress={() => handleStatusChange(ca.id, 'scheduled')}>
                  <Text style={[typography.small, { color: '#fff' }]}>{t('admin.schedule')}</Text>
                </TouchableOpacity>
              </>
            )}
            {ca.status === 'scheduled' && (
              <TouchableOpacity style={[styles.caActionBtn, { backgroundColor: colors.success }]} onPress={() => handleStatusChange(ca.id, 'published')}>
                <Text style={[typography.small, { color: '#fff' }]}>{t('admin.publishNow')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.caActionBtn, { backgroundColor: colors.textMuted }]} onPress={() => handleStatusChange(ca.id, 'archived')}>
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
  createBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  formCard: { backgroundColor: colors.bgCard, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  input: { backgroundColor: colors.bgInput, borderRadius: borderRadius.sm, padding: spacing.md, marginBottom: spacing.sm, color: colors.text, fontSize: 14, borderWidth: 1, borderColor: colors.border },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  catBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.round, borderWidth: 1, borderColor: colors.border },
  catBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  formActions: { flexDirection: 'row', gap: spacing.sm },
  formBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.sm, alignItems: 'center' },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  summaryCard: { flex: 1, backgroundColor: colors.bgCard, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  filterRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  filterBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.round, borderWidth: 1, borderColor: colors.border },
  filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  caCard: { backgroundColor: colors.bgCard, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  caHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginLeft: spacing.sm },
  caMeta: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  caActions: { flexDirection: 'row', gap: spacing.sm },
  caActionBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
});
