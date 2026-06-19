import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { typography } from '../../theme/typography';
import { useTranslation } from '../../i18n/useTranslation';
import { fetchFlaggedQuestions, updateFlaggedStatus } from '../../services/adminDataService';
import { useMCQStore } from '../../store/mcqStore';

export function ContentQualityCenterScreen() {
  const { t } = useTranslation();
  const [flaggedQuestions, setFlaggedQuestions] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [tab, setTab] = useState<'flags' | 'reports' | 'integrity'>('integrity');

  useEffect(() => {
    fetchFlaggedQuestions().then(setFlaggedQuestions).catch((err) => {
      console.error('Failed to fetch flagged questions:', err);
    });
  }, []);

  const pending = flaggedQuestions.filter((f) => f.status === 'pending');
  const resolved = flaggedQuestions.filter((f) => f.status === 'resolved' || f.status === 'dismissed');
  const selectedQ = selected ? flaggedQuestions.find((f) => f.id === selected) : null;

  const questionReports = useMCQStore((s) => s.questionReports);
  const integrityMetrics = useMCQStore((s) => s.integrityMetrics);
  const disabledQuestions = useMCQStore((s) => s.disabledQuestions);

  const reportSummary = useMemo(() => {
    const byId: Record<string, { reports: typeof questionReports; count: number }> = {};
    questionReports.forEach((r) => {
      if (!byId[r.questionId]) byId[r.questionId] = { reports: [], count: 0 };
      byId[r.questionId].reports.push(r);
      byId[r.questionId].count += 1;
    });
    return Object.entries(byId)
      .map(([qId, data]) => ({ questionId: qId, ...data, firstReport: data.reports[0] }))
      .sort((a, b) => b.count - a.count);
  }, [questionReports]);

  const totalValidations = integrityMetrics.passCount + integrityMetrics.failCount;
  const passRate = totalValidations > 0 ? Math.round((integrityMetrics.passCount / totalValidations) * 100) : 0;

  return (
    <ScrollView style={styles.container}>
      <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.xs }]}>
        {t('admin.contentQualityCenter')}
      </Text>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'integrity' && styles.tabActive]} onPress={() => setTab('integrity')}>
          <Text style={[styles.tabText, tab === 'integrity' && styles.tabTextActive]}>Integrity</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'flags' && styles.tabActive]} onPress={() => setTab('flags')}>
          <Text style={[styles.tabText, tab === 'flags' && styles.tabTextActive]}>Flags ({pending.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'reports' && styles.tabActive]} onPress={() => setTab('reports')}>
          <Text style={[styles.tabText, tab === 'reports' && styles.tabTextActive]}>Reports ({reportSummary.length})</Text>
        </TouchableOpacity>
      </View>

      {tab === 'integrity' && (
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={[typography.h3, { color: passRate >= 80 ? colors.success : colors.error }]}>{passRate}%</Text>
            <Text style={[typography.small, { color: colors.textSecondary }]}>Pass Rate</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[typography.h3, { color: colors.error }]}>{integrityMetrics.failCount}</Text>
            <Text style={[typography.small, { color: colors.textSecondary }]}>Failures</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[typography.h3, { color: colors.warning }]}>{integrityMetrics.regenerationCount}</Text>
            <Text style={[typography.small, { color: colors.textSecondary }]}>Regenerations</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[typography.h3, { color: colors.primary }]}>{integrityMetrics.fallbackCount}</Text>
            <Text style={[typography.small, { color: colors.textSecondary }]}>Fallbacks</Text>
          </View>
        </View>
      )}

      {tab === 'integrity' && (
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={[typography.h3, { color: disabledQuestions.length > 0 ? colors.error : colors.success }]}>{disabledQuestions.length}</Text>
            <Text style={[typography.small, { color: colors.textSecondary }]}>Disabled</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[typography.h3, { color: colors.text }]}>{totalValidations}</Text>
            <Text style={[typography.small, { color: colors.textSecondary }]}>Total Validated</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[typography.h3, { color: colors.text }]}>{questionReports.length}</Text>
            <Text style={[typography.small, { color: colors.textSecondary }]}>Reports</Text>
          </View>
        </View>
      )}

      {selectedQ && tab === 'flags' ? (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <Text style={[typography.h4, { color: colors.text, flex: 1 }]}>{t('admin.reviewQuestion')}</Text>
            <TouchableOpacity onPress={() => { setSelected(null); setNote(''); }}>
              <Text style={[typography.bodyBold, { color: colors.primary }]}>{t('admin.back')}</Text>
            </TouchableOpacity>
          </View>
          <Text style={[typography.body, { color: colors.text, marginBottom: spacing.md }]}>
            {selectedQ.questionText}
          </Text>
          <View style={styles.detailRow}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('admin.reason')}:</Text>
            <Text style={[typography.body, { color: colors.text }]}>{selectedQ.reason}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('admin.accuracy')}:</Text>
            <Text style={[typography.body, { color: selectedQ.accuracyRate < 40 ? colors.error : colors.success }]}>{selectedQ.accuracyRate}%</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('admin.errorRate')}:</Text>
            <Text style={[typography.body, { color: selectedQ.errorRate > 40 ? colors.error : colors.text }]}>{selectedQ.errorRate}%</Text>
          </View>
          <TextInput
            style={styles.noteInput}
            placeholder={t('admin.adminNotes')}
            placeholderTextColor={colors.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
          />
          <View style={styles.detailActions}>
            <TouchableOpacity
              style={[styles.detailBtn, { backgroundColor: colors.success }]}
              onPress={async () => { if (selected) { await updateFlaggedStatus(selected, 'resolved', note || undefined); setFlaggedQuestions((prev) => prev.map((f) => f.id === selected ? { ...f, status: 'resolved' } : f)); } setSelected(null); setNote(''); }}
            >
              <Text style={[typography.bodyBold, { color: '#fff' }]}>✓ {t('admin.approve')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.detailBtn, { backgroundColor: colors.warning }]}
              onPress={async () => { if (selected) { await updateFlaggedStatus(selected, 'dismissed', note || undefined); setFlaggedQuestions((prev) => prev.map((f) => f.id === selected ? { ...f, status: 'dismissed' } : f)); } setSelected(null); setNote(''); }}
            >
              <Text style={[typography.bodyBold, { color: '#fff' }]}>✕ {t('admin.dismiss')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.detailBtn, { backgroundColor: colors.primary }]}
              onPress={() => {}}
            >
              <Text style={[typography.bodyBold, { color: '#fff' }]}>{t('admin.edit')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : tab === 'flags' ? (
        <>
          {pending.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={{ fontSize: 32, marginBottom: spacing.sm }}>✅</Text>
              <Text style={[typography.body, { color: colors.textSecondary }]}>{t('admin.noFlags')}</Text>
            </View>
          ) : (
            pending.map((fq) => (
              <TouchableOpacity key={fq.id} style={styles.flagCard} onPress={() => { setSelected(fq.id); setTab('flags'); }}>
                <View style={styles.flagHeader}>
                  <Text style={[typography.body, { flex: 1, color: colors.text }]} numberOfLines={2}>{fq.questionText}</Text>
                  <Text style={{ fontSize: 16 }}>🚩</Text>
                </View>
                <Text style={[typography.small, { color: colors.textSecondary, marginBottom: spacing.xs }]}>
                  {t('admin.reportedReason')}: {fq.reason}
                </Text>
                <View style={styles.flagMetrics}>
                  <Text style={[typography.small, { color: colors.error }]}>
                    {t('admin.errorRate')}: {fq.errorRate}%
                  </Text>
                  <Text style={[typography.small, { color: colors.textMuted }]}>
                    {t('admin.usageCount')}: {fq.usageCount}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </>
      ) : null}

      {tab === 'reports' && (
        <>
          {reportSummary.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={[typography.body, { color: colors.textSecondary }]}>No learner reports yet</Text>
            </View>
          ) : (
            reportSummary.map((item) => {
              const isDisabled = disabledQuestions.includes(item.questionId);
              return (
                <View key={item.questionId} style={[styles.flagCard, isDisabled && { borderColor: colors.error, borderWidth: 2 }]}>
                  <View style={styles.flagHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.body, { color: colors.text }]} numberOfLines={2}>{item.firstReport.questionText}</Text>
                      <Text style={[typography.small, { color: colors.textSecondary, marginTop: 4 }]}>
                        {item.firstReport.subject} › {item.firstReport.topic}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[typography.h3, { color: item.count >= 3 ? colors.error : colors.warning }]}>{item.count}</Text>
                      <Text style={[typography.small, { color: colors.textMuted }]}>reports</Text>
                    </View>
                  </View>
                  <View style={[styles.flagMetrics, { marginTop: 8 }]}>
                    <Text style={[typography.small, { color: colors.textSecondary }]}>
                      Reasons: {[...new Set(item.reports.map((r) => r.reason))].join(', ')}
                    </Text>
                  </View>
                  {isDisabled && (
                    <Text style={[typography.small, { color: colors.error, marginTop: 4, fontWeight: '700' }]}>
                      DISABLED (auto)
                    </Text>
                  )}
                  {!isDisabled && item.count >= 3 && (
                    <TouchableOpacity
                      style={{ marginTop: 8 }}
                      onPress={() => {
                        Alert.alert('Disable Question', 'Disable this question pending review?', [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Disable',
                            style: 'destructive',
                            onPress: () => {
                              const mcqStore = useMCQStore.getState();
                              mcqStore.reportQuestion(item.questionId);
                            },
                          },
                        ]);
                      }}
                    >
                      <Text style={[typography.small, { color: colors.error, textDecorationLine: 'underline' }]}>Disable question</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </>
      )}

      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  summaryCard: { flex: 1, backgroundColor: colors.bgCard, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  detailCard: { backgroundColor: colors.bgCard, borderRadius: borderRadius.lg, padding: spacing.xl, borderWidth: 1, borderColor: colors.border },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  noteInput: { backgroundColor: colors.bgInput, borderRadius: borderRadius.sm, padding: spacing.md, marginTop: spacing.md, color: colors.text, fontSize: 14, minHeight: 60, borderWidth: 1, borderColor: colors.border },
  detailActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  detailBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.sm, alignItems: 'center' },
  emptyCard: { backgroundColor: colors.bgCard, borderRadius: borderRadius.lg, padding: spacing.xxl, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  flagCard: { backgroundColor: colors.bgCard, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  flagHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.xs },
  flagMetrics: { flexDirection: 'row', gap: spacing.md },
  tabRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  tab: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
});
