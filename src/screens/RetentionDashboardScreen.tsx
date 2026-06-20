import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors, spacing, fontFamily } from '../theme';
import { typography } from '../theme/typography';
import { useCognitiveTwinStore } from '../store/cognitiveTwinStore';
import { usePerformanceStore } from '../store/performanceStore';
import { getDueSummary, getDueSubtopics } from '../services/spacedRepetition';
import { computeCalibrationMetrics } from '../services/confidenceCalibration';

function HeatCell({ value, maxValue, label }: { value: number; maxValue: number; label: string }) {
  const intensity = maxValue > 0 ? Math.min(1, value / maxValue) : 0;
  const color = value >= 80 ? '#22C55E' : value >= 60 ? '#EAB308' : value >= 40 ? '#F97316' : '#EF4444';
  const opacity = 0.2 + intensity * 0.6;
  return (
    <View style={[styles.heatCell, { backgroundColor: color + Math.round(opacity * 255).toString(16).padStart(2, '0') }]}>
      <Text style={[styles.heatCellText, { color: intensity > 0.6 ? '#fff' : colors.text }]}>{label}</Text>
    </View>
  );
}

function Sparkline({ data, height = 24, width = 60, color = colors.primary }: { data: number[]; height?: number; width?: number; color?: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(' ');
  return (
    <Svg width={width} height={height}>
      <Path d={`M${points}`} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function RetentionDashboardScreen({ navigation }: any) {
  const masteryMap = useCognitiveTwinStore((s) => s.masteryMap);
  const gapRecords = useCognitiveTwinStore((s) => s.gapRecords);
  const retentionRecords = useCognitiveTwinStore((s) => s.retentionRecords);
  const dueSummary = getDueSummary();
  const dueSubtopics = useMemo(() => getDueSubtopics().slice(0, 10), []);
  const calMetrics = useMemo(() => computeCalibrationMetrics(usePerformanceStore.getState().confidenceRecords), []);

  const subjectRetention = useMemo(() => {
    const map: Record<string, { mastery7: number[]; mastery30: number[]; mastery90: number[]; current: number[] }> = {};
    for (const r of retentionRecords) {
      if (!map[r.subject]) map[r.subject] = { mastery7: [], mastery30: [], mastery90: [], current: [] };
      if (r.mastery7Day !== null) map[r.subject].mastery7.push(r.mastery7Day);
      if (r.mastery30Day !== null) map[r.subject].mastery30.push(r.mastery30Day);
      if (r.mastery90Day !== null) map[r.subject].mastery90.push(r.mastery90Day);
    }
    for (const [sub, data] of Object.entries(masteryMap)) {
      const node = data;
      if (node.attempts >= 2) {
        const ancestors = []; // simplified: just use nodeId as proxy
        let s = '';
        if (sub.startsWith('subj_')) s = node.nodeId.replace('subj_', '').replace(/_/g, ' ');
        else continue;
        if (!map[s]) map[s] = { mastery7: [], mastery30: [], mastery90: [], current: [] };
        map[s].current.push(node.masteryScore);
      }
    }
    const result: { subject: string; avg7: number; avg30: number; avg90: number; currentAvg: number; trend: number[] }[] = [];
    for (const [subject, data] of Object.entries(map)) {
      const avg7 = data.mastery7.length ? Math.round(data.mastery7.reduce((a, b) => a + b) / data.mastery7.length) : 0;
      const avg30 = data.mastery30.length ? Math.round(data.mastery30.reduce((a, b) => a + b) / data.mastery30.length) : 0;
      const avg90 = data.mastery90.length ? Math.round(data.mastery90.reduce((a, b) => a + b) / data.mastery90.length) : 0;
      const currentAvg = data.current.length ? Math.round(data.current.reduce((a, b) => a + b) / data.current.length) : 0;
      const trend = [avg90 || avg30 || avg7, avg30 || avg7, avg7, currentAvg].filter((v) => v > 0);
      result.push({ subject, avg7, avg30, avg90, currentAvg, trend });
    }
    return result.sort((a, b) => a.currentAvg - b.currentAvg);
  }, [retentionRecords, masteryMap]);

  const atRiskTopics = useMemo(() => {
    return retentionRecords
      .filter((r) => r.retentionRate < 60 && r.daysSinceClosure > 7)
      .slice(0, 8);
  }, [retentionRecords]);

  const maxAll = Math.max(...subjectRetention.map((s) => Math.max(s.avg7, s.avg30, s.avg90, s.currentAvg)), 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={[typography.tiny, { color: colors.textSecondary }]}>Due for Review</Text>
          <Text style={[typography.h2, { color: colors.text }]}>{dueSummary.count}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[typography.tiny, { color: colors.textSecondary }]}>At Risk</Text>
          <Text style={[typography.h2, { color: colors.status.weakArea }]}>{atRiskTopics.length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[typography.tiny, { color: colors.textSecondary }]}>Calibration</Text>
          <Text style={[typography.h2, { color: calMetrics.calibrationScore >= 70 ? colors.status.strong : colors.status.weakArea }]}>{calMetrics.totalRecords > 0 ? `${calMetrics.calibrationScore}%` : '—'}</Text>
        </View>
      </View>

      {/* Retention Heat Map */}
      <View style={styles.section}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.sm }]}>Retention Heat Map</Text>
        <View style={styles.heatTable}>
          <View style={styles.heatHeader}>
            <Text style={[styles.heatHeaderText, { flex: 1.5 }]}>Subject</Text>
            <Text style={styles.heatHeaderText}>7d</Text>
            <Text style={styles.heatHeaderText}>30d</Text>
            <Text style={styles.heatHeaderText}>90d</Text>
            <Text style={styles.heatHeaderText}>Now</Text>
            <Text style={[styles.heatHeaderText, { flex: 0.8 }]}>Trend</Text>
          </View>
          {subjectRetention.map((s) => (
            <View key={s.subject} style={styles.heatRow}>
              <Text style={[styles.heatSubject, { flex: 1.5 }]} numberOfLines={1}>{s.subject}</Text>
              <HeatCell value={s.avg7} maxValue={maxAll} label={s.avg7 > 0 ? `${s.avg7}%` : '—'} />
              <HeatCell value={s.avg30} maxValue={maxAll} label={s.avg30 > 0 ? `${s.avg30}%` : '—'} />
              <HeatCell value={s.avg90} maxValue={maxAll} label={s.avg90 > 0 ? `${s.avg90}%` : '—'} />
              <HeatCell value={s.currentAvg} maxValue={maxAll} label={`${s.currentAvg}%`} />
              <View style={{ flex: 0.8, alignItems: 'center' }}>
                <Sparkline data={s.trend} color={s.trend.length >= 2 && s.trend[s.trend.length - 1] >= s.trend[0] ? '#22C55E' : '#EF4444'} />
              </View>
            </View>
          ))}
          {subjectRetention.length === 0 && (
            <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', padding: spacing.lg }]}>Complete more sessions to see retention data.</Text>
          )}
        </View>
      </View>

      {/* Due Subtopics */}
      {dueSubtopics.length > 0 && (
        <View style={styles.section}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.sm }]}>Due for Review</Text>
          {dueSubtopics.map((item) => (
            <View key={item.nodeId} style={styles.dueRow}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodySmall, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[typography.tiny, { color: colors.textMuted }]}>{item.path.join(' › ')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[typography.caption, { color: item.daysOverdue > 0 ? colors.status.weakArea : colors.textSecondary }]}>{item.daysOverdue > 0 ? `${item.daysOverdue}d overdue` : 'Due today'}</Text>
                <Text style={[typography.tiny, { color: colors.textMuted }]}>Mastery: {item.masteryScore}%</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* At-Risk Topics */}
      {atRiskTopics.length > 0 && (
        <View style={styles.section}>
          <Text style={[typography.h3, { color: colors.status.weakArea, marginBottom: spacing.sm }]}>At Risk Topics</Text>
          {atRiskTopics.map((r) => (
            <View key={r.gapId} style={styles.riskRow}>
              <Text style={[typography.bodySmall, { color: colors.text, flex: 1 }]} numberOfLines={1}>{r.nodeName || r.topic}</Text>
              <Text style={[typography.tiny, { color: colors.status.weakArea }]}>{r.retentionRate}% retention</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  summaryCard: { flex: 1, backgroundColor: colors.bgCard, borderRadius: 16, padding: spacing.md, alignItems: 'center' },
  section: { marginBottom: spacing.lg },
  heatTable: { backgroundColor: colors.bgCard, borderRadius: 16, overflow: 'hidden' },
  heatHeader: { flexDirection: 'row', paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, backgroundColor: colors.surfaceSecondary },
  heatHeaderText: { flex: 1, fontSize: 10, fontWeight: '700', color: colors.textTertiary, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
  heatRow: { flexDirection: 'row', paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border + '40', alignItems: 'center' },
  heatSubject: { fontSize: 11, fontWeight: '600', color: colors.text, fontFamily: fontFamily.bodyMedium, paddingRight: spacing.xs },
  heatCell: { flex: 1, borderRadius: 6, paddingVertical: 4, marginHorizontal: 2, alignItems: 'center' as const },
  heatCellText: { fontSize: 10, fontWeight: '600', fontFamily: fontFamily.bodyMedium },
  dueRow: { flexDirection: 'row', backgroundColor: colors.bgCard, borderRadius: 12, padding: spacing.md, marginBottom: spacing.xs, alignItems: 'center' },
  riskRow: { flexDirection: 'row', backgroundColor: colors.bgCard, borderRadius: 12, padding: spacing.md, marginBottom: spacing.xs, alignItems: 'center', borderLeftWidth: 3, borderLeftColor: colors.status.weakArea },
});
