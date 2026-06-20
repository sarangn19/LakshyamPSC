import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { fetchAuditLogs } from '../../services/adminDataService';
import { useTranslation } from '../../i18n/useTranslation';
import { AuditEntry } from '../../services/questionAudit';

const STATUS_COLORS: Record<string, string> = {
  pending: colors.warning,
  approved: colors.success,
  rejected: colors.error,
  edited: colors.primary,
  disabled: '#6B7280',
  flagged: '#8B5CF6',
};

export function QuestionAuditScreen() {
  const { t, typography: tx } = useTranslation();
  const [auditQueue, setAuditQueue] = useState<AuditEntry[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<AuditEntry['status'] | 'all'>('pending');
  const [editText, setEditText] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchAuditLogs().then((logs) => {
      const filtered = logs.filter((l: any) => l.action === 'INSERT' && l.resource?.includes('mcq'));
      const mapped: AuditEntry[] = filtered.map((l: any) => ({
        id: l.id,
        questionText: l.details?.questionText || l.details?.question || '(no question text)',
        options: l.details?.options || ['A', 'B', 'C', 'D'],
        correctAnswer: l.details?.correctAnswer ?? 0,
        explanation: l.details?.explanation || '',
        topic: l.details?.topic || 'general',
        subject: l.details?.subject || 'General',
        generationSource: l.details?.source || 'system',
        alignmentScore: l.details?.alignmentScore ?? 0,
        confidenceScore: l.details?.confidenceScore ?? 0,
        reportCount: l.details?.reportCount ?? 0,
        status: 'pending',
        createdAt: l.createdAt,
        sourceType: 'ai_generated',
        validationFailures: 0,
        regenerationCount: 0,
      }));
      setAuditQueue(mapped);
    });
  }, []);

  const pending = auditQueue.filter((e) => e.status === 'pending');
  const filtered = auditQueue.filter((e) => filter === 'all' || e.status === filter);
  const current = selected ? auditQueue.find((e) => e.id === selected) : null;

  const metrics = useMemo(() => {
    const total = auditQueue.length;
    const approved = auditQueue.filter((e) => e.status === 'approved').length;
    const rejected = auditQueue.filter((e) => e.status === 'rejected').length;
    const edited = auditQueue.filter((e) => e.status === 'edited').length;
    const disabled = auditQueue.filter((e) => e.status === 'disabled').length;
    const rejectedBySubject: Record<string, number> = {};
    auditQueue.filter((e) => e.status === 'rejected').forEach((e) => {
      rejectedBySubject[e.subject] = (rejectedBySubject[e.subject] || 0) + 1;
    });
    return {
      approvedRate: total > 0 ? Math.round((approved / total) * 100) : 0,
      rejectedRate: total > 0 ? Math.round((rejected / total) * 100) : 0,
      editedRate: total > 0 ? Math.round((edited / total) * 100) : 0,
      disabledRate: total > 0 ? Math.round((disabled / total) * 100) : 0,
      problematicSubjects: Object.entries(rejectedBySubject)
        .map(([subject, rejectCount]) => ({ subject, rejectCount }))
        .sort((a, b) => b.rejectCount - a.rejectCount),
    };
  }, [auditQueue]);

  const updateStatus = (id: string, status: AuditEntry['status']) => {
    setAuditQueue((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status, reviewedAt: new Date().toISOString() } : e)),
    );
    setSelected(null);
    setEditing(false);
  };

  const exportSampled = () => {
    const today = new Date().toISOString().slice(0, 10);
    const bySubject: Record<string, AuditEntry[]> = {};
    auditQueue.forEach((e) => {
      if (!bySubject[e.subject]) bySubject[e.subject] = [];
      bySubject[e.subject].push(e);
    });
    const sample: AuditEntry[] = [];
    Object.entries(bySubject).forEach(([subject, entries]) => {
      const recent = entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);
      sample.push(...recent);
    });
    Alert.alert(t('questionAudit.sampleExportTitle'), t('questionAudit.sampleExportMessage', { count: sample.length, date: today }));
    console.log('[AUDIT] daily sample:', today, sample.map((s) => ({ id: s.id, subject: s.subject, topic: s.topic, status: s.status })));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[tx.h2, { color: colors.text, flex: 1 }]}>{t('questionAudit.title')}</Text>
        <TouchableOpacity style={styles.sampleBtn} onPress={exportSampled}>
          <Text style={[tx.bodyBold, { color: '#fff' }]}>{t('questionAudit.sampleToday')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={[tx.h3, { color: colors.success }]}>{metrics.approvedRate}%</Text>
          <Text style={[tx.small, { color: colors.textSecondary }]}>{t('questionAudit.approved')}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[tx.h3, { color: colors.error }]}>{metrics.rejectedRate}%</Text>
          <Text style={[tx.small, { color: colors.textSecondary }]}>{t('questionAudit.rejected')}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[tx.h3, { color: colors.primary }]}>{metrics.editedRate}%</Text>
          <Text style={[tx.small, { color: colors.textSecondary }]}>{t('questionAudit.edited')}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[tx.h3, { color: '#6B7280' }]}>{metrics.disabledRate}%</Text>
          <Text style={[tx.small, { color: colors.textSecondary }]}>{t('questionAudit.disabled')}</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {(['pending', 'all', 'approved', 'rejected'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {t(`questionAudit.${f === 'all' ? 'all' : f}`)} ({f === 'all' ? auditQueue.length : auditQueue.filter((e) => e.status === f).length})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {metrics.problematicSubjects.length > 0 && (
        <View style={styles.problemSection}>
          <Text style={[tx.small, { color: colors.error, fontWeight: '700' }]}>{t('questionAudit.mostRejectedSubjects')}</Text>
          {metrics.problematicSubjects.map((s) => (
            <Text key={s.subject} style={[tx.small, { color: colors.textSecondary }]}>
              {t('questionAudit.rejectedSubject', { subject: s.subject, count: s.rejectCount })}
            </Text>
          ))}
        </View>
      )}

      {current ? (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <Text style={[tx.h4, { color: colors.text, flex: 1 }]}>{t('questionAudit.reviewQuestion')}</Text>
            <TouchableOpacity onPress={() => { setSelected(null); setEditing(false); }}>
              <Text style={[tx.bodyBold, { color: colors.primary }]}>{t('questionAudit.back')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{current.subject} › {current.topic}</Text>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[current.status] + '20' }]}>
              <Text style={[styles.statusText, { color: STATUS_COLORS[current.status] }]}>{t(`questionAudit.${current.status}`)}</Text>
            </View>
          </View>

          {editing ? (
            <TextInput
              style={styles.editInput}
              value={editText}
              onChangeText={setEditText}
              multiline
            />
          ) : (
            <Text style={[tx.body, { color: colors.text, marginBottom: spacing.md }]}>
              {current.questionText}
            </Text>
          )}

          <View style={styles.optionsCard}>
            {current.options.map((opt, i) => (
              <View
                key={i}
                style={[
                  styles.optionRow,
                  i === current.correctAnswer && styles.optionCorrect,
                ]}
              >
                <Text style={[tx.small, {
                  color: i === current.correctAnswer ? colors.success : colors.text,
                  fontWeight: i === current.correctAnswer ? '700' : '400',
                }]}>
                  {String.fromCharCode(65 + i)}. {opt}
                  {i === current.correctAnswer ? ' ✓' : ''}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('questionAudit.explanation')}</Text>
            <Text style={[tx.small, { color: colors.textSecondary }]}>{current.explanation}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('questionAudit.source', { source: current.generationSource })}</Text>
            <Text style={[tx.small, { color: colors.textMuted }]}>{t('questionAudit.alignmentConfidence', { alignment: current.alignmentScore?.toFixed(2), confidence: current.confidenceScore })}</Text>
          </View>

          {current.reportCount > 0 && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.error }]}>{t('questionAudit.reportCount', { count: current.reportCount })}</Text>
            </View>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.success }]} onPress={() => updateStatus(current.id, 'approved')}>
              <Text style={styles.actionText}>{t('questionAudit.approve')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.error }]} onPress={() => updateStatus(current.id, 'rejected')}>
              <Text style={styles.actionText}>{t('questionAudit.reject')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                if (!editing) {
                  setEditText(current.questionText);
                  setEditing(true);
                } else {
                  setAuditQueue((prev) =>
                    prev.map((e) => (e.id === current.id ? { ...e, questionText: editText, status: 'edited' as const, reviewedAt: new Date().toISOString() } : e)),
                  );
                  setEditing(false);
                  setSelected(null);
                }
              }}
            >
              <Text style={styles.actionText}>{editing ? t('questionAudit.saveEdit') : t('questionAudit.edit')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#6B7280' }]} onPress={() => updateStatus(current.id, 'disabled')}>
              <Text style={styles.actionText}>{t('questionAudit.disable')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#8B5CF6' }]} onPress={() => updateStatus(current.id, 'flagged')}>
              <Text style={styles.actionText}>{t('questionAudit.flag')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          {filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={[tx.body, { color: colors.textSecondary }]}>{t('questionAudit.emptyQueue')}</Text>
            </View>
          ) : (
            filtered.map((entry) => (
              <TouchableOpacity key={entry.id} style={styles.entryCard} onPress={() => { setSelected(entry.id); setEditing(false); }}>
                <View style={styles.entryHeader}>
                  <Text style={[tx.body, { flex: 1, color: colors.text }]} numberOfLines={2}>{entry.questionText}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[entry.status] + '20' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[entry.status] }]}>{t(`questionAudit.${entry.status}`)}</Text>
                  </View>
                </View>
                <Text style={[tx.small, { color: colors.textSecondary, marginTop: 4 }]}>
                  {entry.subject} › {entry.topic} | {entry.generationSource}
                </Text>
                <View style={styles.entryMeta}>
                  <Text style={[tx.small, { color: colors.textMuted }]}>{t('questionAudit.confidence', { score: entry.confidenceScore })}</Text>
                  <Text style={[tx.small, { color: colors.textMuted }]}>{t('questionAudit.alignment', { score: entry.alignmentScore?.toFixed(2) })}</Text>
                  {entry.reportCount > 0 && <Text style={[tx.small, { color: colors.error }]}>{t('questionAudit.reportCount', { count: entry.reportCount })}</Text>}
                  <Text style={[tx.small, { color: colors.textMuted }]}>{entry.createdAt.slice(0, 10)}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  sampleBtn: { backgroundColor: colors.primary, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.sm },
  metricsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, flexWrap: 'wrap' },
  metricCard: { flex: 1, minWidth: 60, backgroundColor: colors.bgCard, padding: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  filterRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, flexWrap: 'wrap' },
  filterTab: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  filterTabActive: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  filterText: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  filterTextActive: { color: colors.primary, fontWeight: '700' },
  problemSection: { backgroundColor: '#FEF2F2', padding: spacing.md, borderRadius: 24, marginBottom: spacing.md },
  emptyCard: { backgroundColor: colors.bgCard, borderRadius: 24, padding: spacing.xxl, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  entryCard: { backgroundColor: colors.bgCard, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  entryHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  entryMeta: { flexDirection: 'row', gap: spacing.md, marginTop: 6, flexWrap: 'wrap' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700' },
  detailCard: { backgroundColor: colors.bgCard, borderRadius: 24, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  metaLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  editInput: { backgroundColor: colors.bgInput, borderRadius: borderRadius.sm, padding: spacing.md, color: colors.text, fontSize: 14, minHeight: 80, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  optionsCard: { backgroundColor: colors.bg, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md },
  optionRow: { paddingVertical: 6 },
  optionCorrect: { backgroundColor: '#F0FDF4', borderRadius: borderRadius.sm, paddingHorizontal: 8 },
  infoRow: { marginBottom: spacing.sm },
  infoLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
  actionBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.sm, minWidth: 60, alignItems: 'center' },
  actionText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});
