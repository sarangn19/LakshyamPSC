import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from '../i18n/useTranslation';
import { colors, spacing, borderRadius, fontFamily } from '../theme';
import { typography } from '../theme/typography';
import { useCognitiveTwinStore } from '../store/cognitiveTwinStore';
import { useMCQStore } from '../store';
import { usePerformanceStore } from '../store/performanceStore';
import { getDueSummary, getDueSubtopics } from '../services/spacedRepetition';
import { computeCalibrationMetrics } from '../services/confidenceCalibration';
import { getNodePath, getNodesByLevel } from '../data/knowledgeTree';
import { syllabus } from '../data/syllabus';
import { Badge } from '../components/common/StyledComponents';
import { computeExamOutlook } from '../services/examOutlookEngine';
import { computeRecommendationImpact } from '../services/recommendationMetrics';

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

function HeatCell({ value, maxValue, label }: { value: number; maxValue: number; label: string }) {
  const intensity = maxValue > 0 ? Math.min(1, value / maxValue) : 0;
  const color = value >= 80 ? '#22C55E' : value >= 60 ? '#EAB308' : value >= 40 ? '#F97316' : '#EF4444';
  return (
    <View style={[styles.heatCell, { backgroundColor: color + Math.round((0.2 + intensity * 0.6) * 255).toString(16).padStart(2, '0') }]}>
      <Text style={[styles.heatCellText, { color: intensity > 0.6 ? '#fff' : colors.text }]}>{label}</Text>
    </View>
  );
}

export function ProgressScreen({ navigation }: any) {
  const { t, typography: tx } = useTranslation();
  const metrics = useCognitiveTwinStore((s) => s.getMetrics());
  const gapRecords = useCognitiveTwinStore((s) => s.gapRecords);
  const masteryMap = useCognitiveTwinStore((s) => s.masteryMap);
  const retentionRecords = useCognitiveTwinStore((s) => s.retentionRecords);
  const healthScoreData = useCognitiveTwinStore((s) => s.getAdaptiveHealthScore());
  const subjectProgress = useMCQStore((s) => s.subjectProgress);
  const getSubjectAccuracy = usePerformanceStore((s) => s.getSubjectAccuracy);
  const dueSummary = getDueSummary();
  const dueSubtopics = useMemo(() => getDueSubtopics().slice(0, 10), []);
  const calMetrics = useMemo(() => computeCalibrationMetrics(usePerformanceStore.getState().confidenceRecords), []);

  const stats = useMemo(() => {
    const totalAttempts = Object.values(masteryMap).reduce((sum, m) => sum + m.attempts, 0);
    const totalCorrect = Object.values(masteryMap).reduce((sum, m) => sum + m.correct, 0);
    const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
    return { totalAttempts, totalCorrect, overallAccuracy };
  }, [masteryMap]);

  const subjects = useMemo(() => {
    try {
      return syllabus.map((subj) => {
        const acc = getSubjectAccuracy(subj.name);
        return {
          subject: subj.name,
          percent: acc.total > 0 ? Math.round((acc.correct / acc.total) * 100) : 0,
        };
      });
    } catch { return []; }
  }, [getSubjectAccuracy]);

  const weakestSubjectData = useMemo(() => {
    let weakest = { name: '', mastery: 999 };
    for (const subjNode of getNodesByLevel('subject')) {
      const m = masteryMap[subjNode.id];
      if (m && m.attempts >= 2 && m.masteryScore < weakest.mastery) {
        weakest = { name: subjNode.name, mastery: m.masteryScore };
      }
    }
    return weakest;
  }, [masteryMap]);

  const weakestTopicData = useMemo(() => {
    let weakest = { name: '', mastery: 999, subject: '' };
    for (const topicNode of getNodesByLevel('topic')) {
      const m = masteryMap[topicNode.id];
      if (m && m.attempts >= 2 && m.masteryScore < weakest.mastery) {
        const ancestors = getNodePath(topicNode.id);
        weakest = { name: topicNode.name, mastery: m.masteryScore, subject: ancestors[0] || '' };
      }
    }
    return weakest;
  }, [masteryMap]);

  const outlook = useMemo(() => computeExamOutlook(), []);
  const strongSubjects = useMemo(() => subjects.filter((s) => s.percent >= 70).slice(0, 3), [subjects]);
  const weakSubjects = useMemo(() => subjects.filter((s) => s.percent < 50).slice(0, 3), [subjects]);
  const recImpact = useMemo(() => computeRecommendationImpact(), []);

  const mockScores = useMemo(() => {
    const mocks = usePerformanceStore.getState().sessionOutcomes
      .filter((o) => o.sessionType === 'exam_simulation' && o.totalQuestions > 0)
      .slice(-5);
    return mocks.map((o) => ({ accuracy: o.accuracy, date: o.endTime }));
  }, []);

  const totalRecsCompleted = usePerformanceStore.getState().recommendations.filter((r) => r.sessionCompleted).length;

  const subjectRetention = useMemo(() => {
    const map: Record<string, { mastery7: number[]; mastery30: number[]; mastery90: number[]; current: number[] }> = {};
    for (const r of retentionRecords) {
      if (!map[r.subject]) map[r.subject] = { mastery7: [], mastery30: [], mastery90: [], current: [] };
      if (r.mastery7Day !== null) map[r.subject].mastery7.push(r.mastery7Day);
      if (r.mastery30Day !== null) map[r.subject].mastery30.push(r.mastery30Day);
      if (r.mastery90Day !== null) map[r.subject].mastery90.push(r.mastery90Day);
    }
    for (const [sub, data] of Object.entries(masteryMap)) {
      if (data.attempts >= 2) {
        let s = '';
        if (sub.startsWith('subj_')) s = data.nodeId.replace('subj_', '').replace(/_/g, ' ');
        else continue;
        if (!map[s]) map[s] = { mastery7: [], mastery30: [], mastery90: [], current: [] };
        map[s].current.push(data.masteryScore);
      }
    }
    return Object.entries(map).map(([subject, data]) => {
      const avg7 = data.mastery7.length ? Math.round(data.mastery7.reduce((a, b) => a + b) / data.mastery7.length) : 0;
      const avg30 = data.mastery30.length ? Math.round(data.mastery30.reduce((a, b) => a + b) / data.mastery30.length) : 0;
      const avg90 = data.mastery90.length ? Math.round(data.mastery90.reduce((a, b) => a + b) / data.mastery90.length) : 0;
      const currentAvg = data.current.length ? Math.round(data.current.reduce((a, b) => a + b) / data.current.length) : 0;
      const trend = [avg90 || avg30 || avg7, avg30 || avg7, avg7, currentAvg].filter((v) => v > 0);
      return { subject, avg7, avg30, avg90, currentAvg, trend };
    }).sort((a, b) => a.currentAvg - b.currentAvg);
  }, [retentionRecords, masteryMap]);

  const atRiskTopics = useMemo(() => {
    return retentionRecords
      .filter((r) => r.retentionRate < 60 && r.daysSinceClosure > 7)
      .slice(0, 8);
  }, [retentionRecords]);

  const maxAll = Math.max(...subjectRetention.map((s) => Math.max(s.avg7, s.avg30, s.avg90, s.currentAvg)), 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Coaching Header */}
      <View style={styles.coachHeader}>
        <Text style={[typography.h2, { color: colors.text }]}>
          {outlook.outlookStatus === 'Exam Ready' ? 'You\'re on track' :
           outlook.outlookStatus === 'Competitive' ? 'Keep pushing' :
           'You\'re building momentum'}
        </Text>
        <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.xs }]}>
          {outlook.expectedScoreRange.min}–{outlook.expectedScoreRange.max} marks expected · {outlook.outlookStatus}
        </Text>
        {mockScores.length >= 2 && (
          <Text style={[typography.tiny, { color: mockScores[mockScores.length - 1].accuracy >= mockScores[0].accuracy ? colors.status.strong : colors.status.weakArea, marginTop: spacing.xs }]}>
            {mockScores[mockScores.length - 1].accuracy >= mockScores[0].accuracy ? '↑' : '↓'} Last {mockScores.length} mocks: {mockScores.map((m) => m.accuracy).join(', ')}
          </Text>
        )}
      </View>

      {/* Strong vs Weak */}
      <View style={styles.splitRow}>
        <View style={[styles.splitCard, { flex: 1, marginRight: spacing.xs }]}>
          <Text style={[typography.caption, { color: colors.status.strong, fontWeight: '700', marginBottom: spacing.xs }]}>Strong Areas</Text>
          {strongSubjects.length > 0
            ? strongSubjects.map((s) => (
                <Text key={s.subject} style={[typography.bodySmall, { color: colors.text }]}>✓ {s.subject}</Text>
              ))
            : <Text style={[typography.tiny, { color: colors.textMuted }]}>Keep practicing</Text>}
        </View>
        <View style={[styles.splitCard, { flex: 1, marginLeft: spacing.xs }]}>
          <Text style={[typography.caption, { color: colors.status.weakArea, fontWeight: '700', marginBottom: spacing.xs }]}>Holding You Back</Text>
          {outlook.blockingTopics.slice(0, 2).map((b) => (
            <Text key={b.topic} style={[typography.bodySmall, { color: colors.text }]}>⚠ {b.topic}</Text>
          ))}
          {outlook.blockingTopics.length === 0 && weakSubjects.length > 0 &&
            weakSubjects.map((s) => (
              <Text key={s.subject} style={[typography.bodySmall, { color: colors.text }]}>⚠ {s.subject}</Text>
            ))}
          {outlook.blockingTopics.length === 0 && weakSubjects.length === 0 &&
            <Text style={[typography.tiny, { color: colors.textMuted }]}>None identified</Text>}
        </View>
      </View>

      {/* Recommendation Impact */}
      {totalRecsCompleted > 0 && recImpact.length > 0 && (
        <View style={styles.section}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.sm }]}>Your Recommendation Impact</Text>
          <View style={styles.impactCard}>
            <Text style={[typography.tiny, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
              You followed {totalRecsCompleted} recommendation{totalRecsCompleted !== 1 ? 's' : ''}
            </Text>
            {recImpact.slice(0, 4).map((r) => (
              <View key={r.subject} style={styles.impactRow}>
                <Text style={[typography.bodySmall, { color: colors.text, flex: 1 }]}>{r.subject}</Text>
                <Text style={[typography.bodySmall, {
                  color: r.averageLift > 0 ? colors.status.strong : r.averageLift < 0 ? colors.status.weakArea : colors.textSecondary,
                  fontWeight: '700',
                }]}>
                  {r.averageLift > 0 ? '+' : ''}{r.averageLift}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Recommended This Week */}
      {outlook.blockingTopics.length > 0 && (
        <View style={styles.section}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.sm }]}>Recommended This Week</Text>
          {outlook.blockingTopics.slice(0, 3).map((b) => (
            <TouchableOpacity
              key={b.topic}
              style={styles.recCard}
              onPress={() => {
                useMCQStore.getState().startOrchestratedSession({
                  subjects: [b.subject], difficulty: 'medium', sessionType: 'orchestrated',
                });
                navigation.navigate('MCQ');
              }}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodySmall, { color: colors.text }]}>{b.topic}</Text>
                <Text style={[typography.tiny, { color: colors.textSecondary }]}>{b.subject} · {b.reason}</Text>
              </View>
              <Badge label="Start" color={colors.primary} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Retention by Subject */}
      {subjectRetention.length > 0 && (
        <View style={styles.section}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.sm }]}>Retention by Subject</Text>
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
          </View>
        </View>
      )}

      {/* Due for Revision */}
      {dueSubtopics.length > 0 && (
        <View style={styles.section}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.sm }]}>Due for Revision</Text>
          {dueSubtopics.map((item) => (
            <View key={item.nodeId} style={styles.dueRow}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodySmall, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[typography.tiny, { color: colors.textMuted }]}>{item.path.join(' › ')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[typography.caption, { color: item.daysOverdue > 0 ? colors.status.weakArea : colors.textSecondary }]}>
                  {item.daysOverdue > 0 ? `${item.daysOverdue}d overdue` : 'Due today'}
                </Text>
                <Text style={[typography.tiny, { color: colors.textMuted }]}>{item.masteryScore}%</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Confidence Calibration */}
      {calMetrics.totalRecords > 0 && (
        <View style={styles.section}>
          <View style={styles.calCard}>
            <Text style={[typography.bodySmall, { color: colors.text, fontWeight: '600' }]}>Confidence Calibration</Text>
            <Text style={[typography.tiny, { color: colors.textSecondary, marginTop: 2 }]}>
              You are {calMetrics.calibrationScore >= 70 ? 'well calibrated' : calMetrics.calibrationScore >= 50 ? 'moderately calibrated' : 'overconfident'}
            </Text>
            <View style={styles.calBar}>
              <View style={[styles.calFill, { width: `${calMetrics.calibrationScore}%`, backgroundColor: calMetrics.calibrationScore >= 70 ? colors.status.strong : colors.warning }]} />
            </View>
          </View>
        </View>
      )}

      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 40 },
  coachHeader: { marginBottom: spacing.lg },
  splitRow: { flexDirection: 'row', marginBottom: spacing.lg },
  splitCard: { backgroundColor: colors.bgCard, borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  impactCard: { backgroundColor: colors.bgCard, borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  impactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  recCard: { flexDirection: 'row', backgroundColor: colors.bgCard, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.xs, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  section: { marginBottom: spacing.lg },
  weakCard: {
    backgroundColor: colors.bgCard, borderRadius: borderRadius.md,
    padding: spacing.md, marginBottom: spacing.xs, borderWidth: 1, borderColor: colors.border,
  },
  weakRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  weakIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  subjectRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  subjectBar: { flex: 1, height: 8, backgroundColor: colors.bgInput, borderRadius: 4, overflow: 'hidden' },
  subjectFill: { height: 8, borderRadius: 4 },
  heatTable: { backgroundColor: colors.bgCard, borderRadius: 16, overflow: 'hidden' },
  heatHeader: { flexDirection: 'row', paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, backgroundColor: colors.surfaceSecondary },
  heatHeaderText: { flex: 1, fontSize: 10, fontWeight: '700', color: colors.textTertiary, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
  heatRow: { flexDirection: 'row', paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border + '40', alignItems: 'center' },
  heatSubject: { fontSize: 11, fontWeight: '600', color: colors.text, fontFamily: fontFamily.bodyMedium, paddingRight: spacing.xs },
  heatCell: { flex: 1, borderRadius: 6, paddingVertical: 4, marginHorizontal: 2, alignItems: 'center' },
  heatCellText: { fontSize: 10, fontWeight: '600', fontFamily: fontFamily.bodyMedium },
  dueRow: { flexDirection: 'row', backgroundColor: colors.bgCard, borderRadius: 12, padding: spacing.md, marginBottom: spacing.xs, alignItems: 'center' },
  riskRow: { flexDirection: 'row', backgroundColor: colors.bgCard, borderRadius: 12, padding: spacing.md, marginBottom: spacing.xs, alignItems: 'center', borderLeftWidth: 3, borderLeftColor: colors.status.weakArea },
  calCard: { backgroundColor: colors.bgCard, borderRadius: borderRadius.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  calBar: { height: 6, backgroundColor: colors.bgInput, borderRadius: 3, marginTop: spacing.sm, overflow: 'hidden' },
  calFill: { height: 6, borderRadius: 3 },
});
