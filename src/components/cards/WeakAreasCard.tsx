import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { typography } from '../../theme/typography';
import { computeExamOutlook } from '../../services/examOutlookEngine';
import { useBKTStore, getKey } from '../../store/bktStore';
import { useCognitiveTwinStore } from '../../store/cognitiveTwinStore';
import { usePerformanceStore } from '../../store/performanceStore';
import { getNodeByName } from '../../data/knowledgeTree';

type Props = {
  onPracticeSubject: (subject: string, topic?: string) => void;
};

type EnrichedArea = {
  subject: string;
  name: string;
  score: number;
  isTopic: boolean;
  weaknessScore: number;
  reason: string;
  impact: string;
  detailMastery: number | null;
  detailAccuracy: number | null;
  detailRetention: number | null;
};

function daysSince(isoOrEpoch: string | number | null | undefined): number {
  if (!isoOrEpoch) return Infinity;
  const ts = typeof isoOrEpoch === 'string' ? new Date(isoOrEpoch).getTime() : isoOrEpoch;
  if (!ts) return Infinity;
  return Math.floor((Date.now() - ts) / 86400000);
}

type TopicFactors = {
  mastery: number | null;
  accuracy: number | null;
  retention: number | null;
  totalAttempts: number | null;
  lastCorrect: boolean | null;
  consecutiveCorrect: number | null;
  trend: string | null;
  hesitationScore: number | null;
  lastAttempted: string | number | null;
};

function collectFactors(
  area: { subject: string; topic?: string; score: number; name: string },
  topicMap: Record<string, any>,
  masteryMap: Record<string, any>,
  retentionRecords: { subject: string; topic: string; retentionRate: number }[],
): TopicFactors {
  let mastery: number | null = null;
  let totalAttempts: number | null = null;
  let lastCorrect: boolean | null = null;
  let consecutiveCorrect: number | null = null;
  let lastAttempted: string | number | null = null;
  let accuracy: number | null = null;
  let trend: string | null = null;
  let hesitationScore: number | null = null;
  let retention: number | null = null;

  const bktKey = getKey(area.subject, area.topic || area.name);
  const bkt = topicMap[bktKey];
  if (bkt) {
    mastery = bkt.pMastered ?? null;
    totalAttempts = bkt.totalAttempts ?? null;
    lastCorrect = bkt.lastCorrect ?? null;
    consecutiveCorrect = bkt.consecutiveCorrect ?? null;
    lastAttempted = bkt.lastAttempted ?? null;
  }

  const ctNode = getNodeByName(area.topic || area.name, 'topic');
  if (ctNode) {
    const m = masteryMap[ctNode.id];
    if (m) {
      accuracy = m.accuracy ?? null;
      trend = m.trend ?? null;
      hesitationScore = m.hesitationScore ?? null;
      if (!lastAttempted && m.lastPracticed) lastAttempted = m.lastPracticed;
      if (totalAttempts === null || totalAttempts === 0) totalAttempts = m.attempts ?? null;
    }
  }

  const matching = retentionRecords.filter(
    r => r.topic === area.name || r.subject === area.name,
  );
  if (matching.length > 0) {
    retention = Math.round(matching.reduce((sum, r) => sum + r.retentionRate, 0) / matching.length);
  }

  return { mastery, accuracy, retention, totalAttempts, lastCorrect, consecutiveCorrect, trend, hesitationScore, lastAttempted };
}

function computeWeaknessScore(factors: TopicFactors): number {
  const m = factors.mastery !== null ? factors.mastery : 0.3;
  const a = factors.accuracy !== null ? factors.accuracy / 100 : 0.4;
  const r = factors.retention !== null ? factors.retention / 100 : 0.5;
  return Math.round(((1 - m) * 0.5 + (1 - a) * 0.3 + (1 - r) * 0.2) * 100);
}

function topFactorLabel(factors: TopicFactors): string {
  const m = factors.mastery !== null ? (1 - factors.mastery) * 0.5 : 0.35;
  const a = factors.accuracy !== null ? (1 - factors.accuracy / 100) * 0.3 : 0.18;
  const r = factors.retention !== null ? (1 - factors.retention / 100) * 0.2 : 0.1;
  if (m >= a && m >= r) return 'Weak mastery';
  if (a >= m && a >= r) return 'Low accuracy';
  return 'Low retention';
}

function generateReason(factors: TopicFactors): string {
  const { totalAttempts, lastCorrect, consecutiveCorrect, accuracy, trend, hesitationScore, lastAttempted } = factors;

  if (totalAttempts !== null && totalAttempts === 0) return 'No questions attempted yet';
  if (lastCorrect === false && consecutiveCorrect === 0) return 'Incorrect on last attempt';
  if (accuracy !== null && accuracy < 30 && (totalAttempts ?? 0) >= 2) return `Accuracy below ${accuracy}%`;
  if (trend === 'declining') return 'Accuracy dropping — review needed';
  if (hesitationScore !== null && hesitationScore > 0.6) return 'High uncertainty on this topic';
  if (totalAttempts !== null && totalAttempts >= 4) {
    const wrong = factors.accuracy !== null ? Math.round(totalAttempts * (1 - factors.accuracy / 100)) : 0;
    if (wrong >= 3) return `Missed ${wrong} of ${totalAttempts} questions`;
  }
  if (lastAttempted !== null) {
    const d = daysSince(lastAttempted);
    if (d >= 14) return `Not practiced in ${d} days`;
    if (d >= 7) return `Not practiced in ${d} days`;
  }
  return topFactorLabel(factors);
}

function impactLabel(weaknessScore: number): string {
  if (weaknessScore >= 70) return 'Could improve score by 3–5 marks';
  if (weaknessScore >= 50) return 'Could improve score by 2–3 marks';
  if (weaknessScore >= 30) return 'Could improve score by 1–2 marks';
  return 'Small improvement possible';
}

function enrichArea(
  area: { subject: string; topic?: string; reason: string; score: number; name: string; isTopic: boolean },
  topicMap: Record<string, any>,
  masteryMap: Record<string, any>,
  retentionRecords: { subject: string; topic: string; retentionRate: number }[],
): EnrichedArea {
  const factors = collectFactors(area, topicMap, masteryMap, retentionRecords);
  const weaknessScore = computeWeaknessScore(factors);
  const reason = generateReason(factors);
  const impact = impactLabel(weaknessScore);

  const effectiveScore = factors.mastery !== null ? Math.round(factors.mastery * 100) : area.score;

  return {
    subject: area.subject,
    name: area.name,
    score: effectiveScore,
    isTopic: area.isTopic,
    weaknessScore,
    reason,
    impact,
    detailMastery: effectiveScore,
    detailAccuracy: factors.accuracy,
    detailRetention: factors.retention,
  };
}

export function WeakAreasCard({ onPracticeSubject }: Props) {
  const topicMap = useBKTStore(s => s.topicMap);
  const masteryMap = useCognitiveTwinStore(s => s.masteryMap);
  const retentionRecords = useCognitiveTwinStore(s => s.retentionRecords);
  usePerformanceStore(s => s.interactionSignals?.length);

  const outlook = computeExamOutlook();
  const weakSubjects = outlook.weakestSubjects;
  const blockingTopics = outlook.blockingTopics;

  const rawAreas: { subject: string; name: string; score: number; isTopic: boolean; topic?: string; reason: string }[] =
    blockingTopics.length > 0
      ? blockingTopics.map(t => ({ name: t.topic, subject: t.subject, topic: t.topic, score: t.score, isTopic: true, reason: t.reason }))
      : weakSubjects.map(s => ({ name: s.name, subject: s.name, score: s.score, isTopic: false, reason: 'Weak subject' }));

  const enriched = rawAreas
    .map(a => enrichArea(a, topicMap, masteryMap, retentionRecords))
    .sort((a, b) => b.weaknessScore - a.weaknessScore || a.name.localeCompare(b.name));

  if (enriched.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.overline}>Priority Topics</Text>
        <Text style={styles.emptyText}>Keep practicing — your priority topics will appear here as you learn.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.overline}>Priority Topics</Text>
      <Text style={styles.subtitle}>Focus on these to improve your PSC score</Text>

      {enriched.map((area) => {
        const barColor =
          area.score < 10 ? colors.error :
          area.score < 30 ? colors.warning :
          colors.success;

        return (
          <View key={`${area.subject}::${area.name}`} style={styles.weakItem}>
            <View style={styles.weakContent}>
              <Text style={styles.weakName}>{area.name}</Text>
              {area.isTopic && <Text style={styles.subjectLabel}>{area.subject}</Text>}

              <View style={styles.metaRow}>
                <View style={styles.scoreRow}>
                  <View style={[styles.scoreBar, { width: `${area.score}%`, backgroundColor: barColor }]} />
                </View>
                <Text style={styles.weakScore}>{area.score}%</Text>
              </View>

              <View style={styles.detailRow}>
                {area.detailMastery !== null && (
                  <Text style={styles.detailChip}>Mastery {area.detailMastery}%</Text>
                )}
                {area.detailAccuracy !== null && (
                  <Text style={styles.detailChip}>Acc {area.detailAccuracy}%</Text>
                )}
                {area.detailRetention !== null && (
                  <Text style={styles.detailChip}>Retention {area.detailRetention}%</Text>
                )}
              </View>

              <Text style={styles.reasonText}>{area.reason}</Text>
              <Text style={styles.impactText}>{area.impact}</Text>
            </View>
            <TouchableOpacity
              style={styles.practiceBtn}
              onPress={() => onPracticeSubject(area.subject, area.isTopic ? area.name : undefined)}
              activeOpacity={0.7}
            >
              <Text style={styles.practiceBtnText}>Practice</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  overline: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: typography.overline.fontFamily,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
    fontFamily: typography.caption.fontFamily,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginVertical: spacing.md,
    fontFamily: typography.bodySmall.fontFamily,
  },
  weakItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  weakContent: { flex: 1, marginRight: spacing.sm },
  weakName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    fontFamily: typography.bodySmall.fontFamily,
  },
  subjectLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 1,
    fontFamily: typography.tiny.fontFamily,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  detailChip: {
    fontSize: 9,
    color: colors.textTertiary,
    backgroundColor: colors.border + '40',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
    fontFamily: typography.tiny.fontFamily,
  },
  reasonText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
    fontFamily: typography.caption.fontFamily,
  },
  impactText: {
    fontSize: 9,
    color: colors.success,
    marginTop: 1,
    fontFamily: typography.tiny.fontFamily,
  },
  scoreRow: {
    height: 3,
    flex: 1,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  scoreBar: { height: '100%', borderRadius: 2 },
  weakScore: {
    fontSize: 10,
    color: colors.textTertiary,
    fontFamily: typography.tiny.fontFamily,
  },
  practiceBtn: {
    backgroundColor: colors.primary + '08',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  practiceBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
    fontFamily: typography.captionBold.fontFamily,
  },
});
