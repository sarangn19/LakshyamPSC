import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from '../i18n/useTranslation';
import { colors, spacing } from '../theme';
import { typography } from '../theme/typography';
import { useMCQStore } from '../store';
import { usePerformanceStore } from '../store/performanceStore';
import { computeExamOutlook } from '../services/examOutlookEngine';
import { getLearnerProfile } from '../services/learnerStage';

function ScoreMeter({ value, size }: { value: number; size?: number }) {
  const dim = size || 140;
  const stroke = 8;
  const radius = (dim - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const progress = (value / 100) * circ;
  const color = value >= 80 ? colors.success : value >= 60 ? colors.primary : value >= 40 ? colors.warning : colors.error;
  return (
    <View style={{ width: dim, height: dim, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute' }}>
        <Text style={[typography.displayL, { color, fontSize: 36, fontWeight: '800' }]}>{value}%</Text>
      </View>
    </View>
  );
}

export function PostSessionScreen({ navigation }: any) {
  const { t } = useTranslation();
  const lastSessionOutcome = useMCQStore((s) => s.lastSessionOutcome);

  const previousOutcome = useMemo(() => {
    const outcomes = usePerformanceStore.getState().sessionOutcomes;
    return outcomes.length >= 2 ? outcomes[outcomes.length - 2] : null;
  }, []);

  const outlook = useMemo(() => {
    try { return computeExamOutlook(); } catch { return null; }
  }, []);

  const blocker = outlook?.blockingTopics?.[0];

  if (!lastSessionOutcome) {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Text style={[typography.h2, { color: colors.text }]}>No session data</Text>
        <TouchableOpacity style={s.primaryAction} onPress={() => navigation.navigate('MainTabs')}>
          <Text style={s.primaryActionText}>Go Home</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const outcome = lastSessionOutcome;
  const accuracyPct = Math.round(outcome.accuracy * 100);
  const isExam = outcome.sessionType === 'exam_simulation';

  // Sort subjects by accuracy
  const subjectEntries = Object.entries(outcome.subjectScores || {})
    .map(([name, data]) => ({ name, ...data, accuracy: data.total > 0 ? data.accuracy : 0 }))
    .sort((a, b) => b.accuracy - a.accuracy);

  const strongSubjects = subjectEntries.filter((s) => s.accuracy >= 0.6);
  const weakSubjects = subjectEntries.filter((s) => s.accuracy < 0.6);

  const diff = outcome.difficultyMix || { easy: 0, medium: 0, hard: 0 };
  const totalDiff = diff.easy + diff.medium + diff.hard;

  const handlePracticeWeakness = () => {
    const weak = outcome.weakestSubject;
    useMCQStore.getState().startOrchestratedSession({
      subjects: weak ? [weak] : undefined,
      difficulty: 'medium',
      sessionType: 'weakness_practice',
    });
    navigation.navigate('MCQ');
  };

  const handlePracticeBlocker = () => {
    if (!blocker) return;
    useMCQStore.getState().startOrchestratedSession({
      subjects: [blocker.subject],
      recommendedTopic: blocker.topic,
      sessionType: 'blocking_topic',
    });
    navigation.navigate('MCQ');
  };

  const handleGoHome = () => navigation.navigate('MainTabs');

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Score Summary */}
      <View style={s.scoreCard}>
        <ScoreMeter value={accuracyPct} />
        <Text style={s.scoreFraction}>
          {outcome.correctAnswers}/{outcome.totalQuestions} correct
        </Text>
        {previousOutcome && (
          <Text style={[s.deltaText, { color: accuracyPct >= Math.round(previousOutcome.accuracy * 100) ? colors.success : colors.error }]}>
            {accuracyPct >= Math.round(previousOutcome.accuracy * 100) ? 'Improved' : 'Decreased'} vs last session
          </Text>
        )}
        {isExam && (
          <View style={s.examBadge}>
            <Text style={s.examBadgeText}>Mock Test</Text>
          </View>
        )}
      </View>

      {/* Stats Row */}
      <View style={s.statsRow}>
        <View style={s.stat}>
          <Text style={s.statValue}>{outcome.durationMinutes}m</Text>
          <Text style={s.statLabel}>Duration</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.statValue}>{outcome.totalQuestions}</Text>
          <Text style={s.statLabel}>Questions</Text>
        </View>
        {totalDiff > 0 && (
          <View style={s.stat}>
            <Text style={s.statValue}>
              {diff.easy}/{diff.medium}/{diff.hard}
            </Text>
            <Text style={s.statLabel}>E/M/H</Text>
          </View>
        )}
      </View>

      {/* Strong Areas */}
      {strongSubjects.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Strong Areas</Text>
          {strongSubjects.map((sub) => (
            <View key={sub.name} style={s.subjectRow}>
              <Text style={s.subjectCheckmark}>✓</Text>
              <Text style={s.subjectName}>{sub.name}</Text>
              <Text style={[s.subjectAccuracy, { color: colors.success }]}>{Math.round(sub.accuracy * 100)}%</Text>
            </View>
          ))}
        </View>
      )}

      {/* Weak Areas */}
      {weakSubjects.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Needs Revision</Text>
          {weakSubjects.map((sub) => (
            <View key={sub.name} style={s.subjectRow}>
              <Text style={s.subjectWeakIcon}>⚠</Text>
              <Text style={s.subjectName}>{sub.name}</Text>
              <Text style={[s.subjectAccuracy, { color: colors.warning }]}>{Math.round(sub.accuracy * 100)}%</Text>
            </View>
          ))}
        </View>
      )}

      {/* Subject Heatmap */}
      {subjectEntries.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Subject Breakdown</Text>
          {subjectEntries.map((sub) => (
            <View key={sub.name} style={s.heatmapRow}>
              <Text style={s.heatmapLabel} numberOfLines={1}>{sub.name}</Text>
              <View style={s.heatmapBarBg}>
                <View style={[s.heatmapBarFill, { width: `${Math.round(sub.accuracy * 100)}%`, backgroundColor: sub.accuracy >= 0.6 ? colors.success : sub.accuracy >= 0.4 ? colors.warning : colors.error }]} />
              </View>
              <Text style={s.heatmapValue}>{Math.round(sub.accuracy * 100)}%</Text>
            </View>
          ))}
        </View>
      )}

      {/* Biggest Blocker */}
      {blocker && (
        <View style={s.blockerCard}>
          <Text style={s.blockerLabel}>Biggest Opportunity</Text>
          <Text style={s.blockerTopic}>⚠ {blocker.topic}</Text>
          <Text style={s.blockerReason}>in {blocker.subject} — {blocker.reason}</Text>
          <TouchableOpacity style={s.blockerAction} onPress={handlePracticeBlocker} activeOpacity={0.8}>
            <Text style={s.blockerActionText}>Practice Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Behind the Scenes */}
      {(() => {
        const lp = getLearnerProfile();
        if (lp.totalQuestions < 5) return null;
        return (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Learning Profile</Text>
            <View style={s.profileRow}>
              <Text style={s.profileLabel}>Stage</Text>
              <Text style={s.profileValue}>{lp.stage}</Text>
            </View>
            <View style={s.profileRow}>
              <Text style={s.profileLabel}>Overall Mastery</Text>
              <Text style={s.profileValue}>{lp.overallMastery}%</Text>
            </View>
            <View style={s.profileRow}>
              <Text style={s.profileLabel}>Gap Closure</Text>
              <Text style={s.profileValue}>{Math.round(lp.gapClosureRate * 100)}%</Text>
            </View>
          </View>
        );
      })()}

      {/* Actions */}
      <View style={s.actionsSection}>
        {weakSubjects.length > 0 && (
          <TouchableOpacity style={s.primaryAction} onPress={handlePracticeWeakness} activeOpacity={0.9}>
            <Text style={s.primaryActionText}>Practice {outcome.weakestSubject}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={s.secondaryAction} onPress={handleGoHome} activeOpacity={0.8}>
          <Text style={s.secondaryActionText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingTop: spacing.huge + spacing.lg, paddingBottom: spacing.huge },

  scoreCard: {
    marginTop: spacing.xl, backgroundColor: colors.surface, borderRadius: 24, padding: spacing.xl,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  scoreFraction: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.xs },
  deltaText: { fontSize: 12, fontWeight: '600', marginTop: spacing.sm },
  examBadge: { marginTop: spacing.sm, backgroundColor: colors.primary + '20', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 20 },
  examBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.lg, backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textTertiary, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3 },

  section: { marginTop: spacing.lg, backgroundColor: colors.surface, borderRadius: 24, padding: spacing.xl, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.textTertiary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: spacing.md },

  subjectRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  subjectCheckmark: { fontSize: 16, color: colors.success, marginRight: spacing.sm },
  subjectWeakIcon: { fontSize: 14, marginRight: spacing.sm },
  subjectName: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  subjectAccuracy: { fontSize: 14, fontWeight: '700' },

  heatmapRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs + 2 },
  heatmapLabel: { width: 90, fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  heatmapBarBg: { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 4, marginHorizontal: spacing.sm, overflow: 'hidden' },
  heatmapBarFill: { height: '100%', borderRadius: 4 },
  heatmapValue: { width: 36, fontSize: 12, fontWeight: '700', color: colors.text, textAlign: 'right' },

  blockerCard: {
    marginTop: spacing.lg, backgroundColor: colors.status.needsRevision + '15', borderRadius: 24,
    padding: spacing.xl, borderWidth: 1, borderColor: colors.status.needsRevision + '30',
  },
  blockerLabel: { fontSize: 11, fontWeight: '700', color: colors.textTertiary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: spacing.xs },
  blockerTopic: { fontSize: 16, fontWeight: '700', color: colors.text },
  blockerReason: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  blockerAction: { marginTop: spacing.md, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: spacing.sm + 2, alignItems: 'center' },
  blockerActionText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  profileRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
  profileLabel: { fontSize: 13, color: colors.textSecondary },
  profileValue: { fontSize: 13, fontWeight: '600', color: colors.text },

  actionsSection: { marginTop: spacing.xl, gap: spacing.sm },
  primaryAction: { backgroundColor: colors.primary, borderRadius: 16, height: 48, justifyContent: 'center', alignItems: 'center' },
  primaryActionText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  secondaryAction: { backgroundColor: colors.surface, borderRadius: 16, height: 48, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  secondaryActionText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
});
