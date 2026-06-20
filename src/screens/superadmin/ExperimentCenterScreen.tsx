import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { colors, spacing, borderRadius, fontFamily } from '../../theme';
import { typography } from '../../theme/typography';
import { useTranslation } from '../../i18n/useTranslation';
import { fetchExperiments, createExperiment, updateExperimentStatus } from '../../services/adminDataService';

export function ExperimentCenterScreen() {
  const { t } = useTranslation();
  const [experiments, setExperiments] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchExperiments().then(setExperiments);
  }, []);

  const running = experiments.filter((e: any) => e.status === 'running').length;
  const completed = experiments.filter((e: any) => e.status === 'completed').length;

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createExperiment({ name: name.trim(), description: description.trim(), variantA: { weaknessScore: 30 }, variantB: { weaknessScore: 40 }, metrics: ['completionRate', 'accuracyGain'] });
    const updated = await fetchExperiments();
    setExperiments(updated);
    setName('');
    setDescription('');
    setShowForm(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[typography.h2, { color: colors.text, flex: 1 }]}>
          {t('superadmin.experimentCenter')}
        </Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => setShowForm(!showForm)}>
          <Text style={[typography.bodyBold, { color: '#fff' }]}>+ {t('superadmin.newExperiment')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={[typography.h3, { color: colors.primary }]}>{experiments.length}</Text>
          <Text style={[typography.small, { color: colors.textSecondary }]}>{t('superadmin.totalExp')}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[typography.h3, { color: colors.success }]}>{running}</Text>
          <Text style={[typography.small, { color: colors.textSecondary }]}>{t('superadmin.running')}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[typography.h3, { color: colors.info }]}>{completed}</Text>
          <Text style={[typography.small, { color: colors.textSecondary }]}>{t('superadmin.completed')}</Text>
        </View>
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <TextInput
            style={styles.input}
            placeholder={t('superadmin.expNamePlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[styles.input, { minHeight: 60 }]}
            placeholder={t('superadmin.expDescPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <View style={styles.formHint}>
            <Text style={[typography.small, { color: colors.textSecondary }]}>
              {t('superadmin.expHint')}
            </Text>
          </View>
          <View style={styles.formActions}>
            <TouchableOpacity style={[styles.formBtn, { backgroundColor: colors.primary }]} onPress={handleCreate}>
              <Text style={[typography.bodyBold, { color: '#fff' }]}>{t('superadmin.createDraft')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.formBtn, { backgroundColor: colors.success }]} onPress={handleCreate}>
              <Text style={[typography.bodyBold, { color: '#fff' }]}>{t('superadmin.launchNow')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {experiments.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={{ fontSize: 32, marginBottom: spacing.sm }}>🧪</Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>{t('superadmin.noExperiments')}</Text>
          <Text style={[typography.small, { color: colors.textMuted }]}>{t('superadmin.createFirstExp')}</Text>
        </View>
      ) : (
        experiments.map((exp) => (
          <View key={exp.id} style={styles.expCard}>
            <View style={styles.expHeader}>
              <Text style={[typography.bodyBold, { color: colors.text, flex: 1 }]}>{exp.name}</Text>
              <View style={[
                styles.expStatus,
                { backgroundColor: exp.status === 'running' ? colors.success + '20' : exp.status === 'completed' ? colors.info + '20' : exp.status === 'draft' ? colors.warning + '20' : colors.textMuted + '20' },
              ]}>
                <Text style={[typography.small, {
                  color: exp.status === 'running' ? colors.success : exp.status === 'completed' ? colors.info : colors.warning,
                }]}>{exp.status}</Text>
              </View>
            </View>
            {exp.description && (
              <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
                {exp.description}
              </Text>
            )}
            <View style={styles.expVariants}>
              <View style={styles.variantCard}>
                <Text style={[typography.small, { color: colors.primary, fontWeight: '700', fontFamily: fontFamily.bodyBold }]}>A</Text>
                {Object.entries(exp.variantA).map(([k, v]) => (
                  <Text key={k} style={[typography.small, { color: colors.textSecondary }]}>
                    {k}: {v}
                  </Text>
                ))}
              </View>
              <Text style={{ fontSize: 16, color: colors.textMuted, alignSelf: 'center' }}>vs</Text>
              <View style={styles.variantCard}>
                <Text style={[typography.small, { color: colors.error, fontWeight: '700', fontFamily: fontFamily.bodyBold }]}>B</Text>
                {Object.entries(exp.variantB).map(([k, v]) => (
                  <Text key={k} style={[typography.small, { color: colors.textSecondary }]}>
                    {k}: {v}
                  </Text>
                ))}
              </View>
            </View>
            <View style={styles.expMetrics}>
              <Text style={[typography.small, { color: colors.textMuted }]}>
                {t('superadmin.metrics')}: {exp.metrics.join(', ')}
              </Text>
            </View>
            <View style={styles.expActions}>
              {exp.status === 'draft' && (
                <TouchableOpacity
                  style={[styles.expActionBtn, { backgroundColor: colors.success }]}
                  onPress={async () => { await updateExperimentStatus(exp.id, 'running'); const u = await fetchExperiments(); setExperiments(u); }}
                >
                  <Text style={[typography.small, { color: '#fff' }]}>{t('superadmin.start')}</Text>
                </TouchableOpacity>
              )}
              {exp.status === 'running' && (
                <>
                  <TouchableOpacity
                    style={[styles.expActionBtn, { backgroundColor: colors.warning }]}
                    onPress={async () => { await updateExperimentStatus(exp.id, 'paused'); const u = await fetchExperiments(); setExperiments(u); }}
                  >
                    <Text style={[typography.small, { color: '#fff' }]}>{t('superadmin.pause')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.expActionBtn, { backgroundColor: colors.info }]}
                    onPress={async () => { await updateExperimentStatus(exp.id, 'completed'); const u = await fetchExperiments(); setExperiments(u); }}
                  >
                    <Text style={[typography.small, { color: '#fff' }]}>{t('superadmin.complete')}</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                style={[styles.expActionBtn, { backgroundColor: colors.textMuted }]}
                onPress={async () => { await updateExperimentStatus(exp.id, 'archived'); const u = await fetchExperiments(); setExperiments(u); }}
              >
                <Text style={[typography.small, { color: '#fff' }]}>{t('superadmin.archive')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  createBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  summaryCard: { flex: 1, backgroundColor: colors.bgCard, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  formCard: { backgroundColor: colors.bgCard, padding: spacing.md, borderRadius: 24, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  input: { backgroundColor: colors.bgInput, borderRadius: borderRadius.sm, padding: spacing.md, marginBottom: spacing.sm, color: colors.text, fontSize: 14, borderWidth: 1, borderColor: colors.border },
  formHint: { marginBottom: spacing.sm },
  formActions: { flexDirection: 'row', gap: spacing.sm },
  formBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.sm, alignItems: 'center' },
  emptyCard: { backgroundColor: colors.bgCard, borderRadius: 24, padding: spacing.xxl, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  expCard: { backgroundColor: colors.bgCard, borderRadius: 24, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  expHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  expStatus: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  expVariants: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  variantCard: { flex: 1, backgroundColor: colors.surfaceSecondary, padding: spacing.sm, borderRadius: borderRadius.sm },
  expMetrics: { marginBottom: spacing.sm },
  expActions: { flexDirection: 'row', gap: spacing.sm },
  expActionBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
});
