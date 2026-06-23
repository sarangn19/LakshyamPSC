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
  reason: string;
  sortKey: [number, number, number, number];
};

function daysSince(isoOrEpoch: string | number | null | undefined): number {
  if (!isoOrEpoch) return Infinity;
  const ts = typeof isoOrEpoch === 'string' ? new Date(isoOrEpoch).getTime() : isoOrEpoch;
  if (!ts) return Infinity;
  return Math.floor((Date.now() - ts) / 86400000);
}

function generateReason(
  pMastered: number | null,
  totalAttempts: number | null,
  lastCorrect: boolean | null,
  consecutiveCorrect: number | null,
  accuracy: number | null,
  trend: string | null,
  hesitationScore: number | null,
  lastAttempted: string | number | null,
): string {
  if (totalAttempts !== null && totalAttempts === 0) {
    return 'No questions attempted yet';
  }
  if (lastCorrect === false && consecutiveCorrect === 0) {
    return 'Incorrect on last attempt';
  }
  if (accuracy !== null && accuracy < 30 && (totalAttempts ?? 0) >= 2) {
    return `Accuracy below ${accuracy}%`;
  }
  if (trend === 'declining') {
    return 'Accuracy dropping — review needed';
  }
  if (hesitationScore !== null && hesitationScore > 0.6) {
    return 'High uncertainty on this topic';
  }
  if (pMastered !== null && pMastered < 0.1 && (totalAttempts ?? 0) >= 2) {
    return 'Critical — needs immediate practice';
  }
  if (lastAttempted !== null) {
    const d = daysSince(lastAttempted);
    if (d >= 14) return `Not practiced in ${d} days`;
    if (d >= 7) return `Not practiced in ${d} days`;
  }
  return 'Frequently missed topic';
}

function enrichArea(
  area: { subject: string; topic?: string; reason: string; score: number; name: string; isTopic: boolean },
  topicMap: Record<string, any>,
  masteryMap: Record<string, any>,
): EnrichedArea {
  let pMastered: number | null = null;
  let totalAttempts: number | null = null;
  let lastCorrect: boolean | null = null;
  let consecutiveCorrect: number | null = null;
  let lastAttempted: string | number | null = null;

  // Look up BKT data
  const bktKey = getKey(area.subject, area.topic || area.name);
  const bkt = topicMap[bktKey];
  if (bkt) {
    pMastered = bkt.pMastered ?? null;
    totalAttempts = bkt.totalAttempts ?? null;
    lastCorrect = bkt.lastCorrect ?? null;
    consecutiveCorrect = bkt.consecutiveCorrect ?? null;
    lastAttempted = bkt.lastAttempted ?? null;
  }

  // Look up cognitive twin data
  let accuracy: number | null = null;
  let trend: string | null = null;
  let hesitationScore: number | null = null;
  const ctNode = getNodeByName(area.topic || area.name, 'topic');
  if (ctNode) {
    const mastery = masteryMap[ctNode.id];
    if (mastery) {
      accuracy = mastery.accuracy ?? null;
      trend = mastery.trend ?? null;
      hesitationScore = mastery.hesitationScore ?? null;
      if (!lastAttempted && mastery.lastPracticed) {
        lastAttempted = mastery.lastPracticed;
      }
      if (totalAttempts === null || totalAttempts === 0) {
        totalAttempts = mastery.attempts ?? null;
      }
    }
  }

  const reason = generateReason(
    pMastered, totalAttempts, lastCorrect, consecutiveCorrect,
    accuracy, trend, hesitationScore, lastAttempted,
  );

  // Sort key: lower proficiency first, then fewer attempts, then older lastAttempted, then alpha
  const pScore = pMastered !== null ? Math.round(pMastered * 100) : area.score;
  const attScore = totalAttempts ?? 0;
  const recencyScore = lastAttempted ? -daysSince(lastAttempted) : -999;
  const tieBreaker = area.name.charCodeAt(0) || 0;

  return {
    subject: area.subject,
    name: area.name,
    score: area.score,
    isTopic: area.isTopic,
    reason,
    sortKey: [pScore, attScore, recencyScore, tieBreaker],
  };
}

export function WeakAreasCard({ onPracticeSubject }: Props) {
  const topicMap = useBKTStore(s => s.topicMap);
  const masteryMap = useCognitiveTwinStore(s => s.masteryMap);
  usePerformanceStore(s => s.interactionSignals?.length);

  const outlook = computeExamOutlook();
  const weakSubjects = outlook.weakestSubjects;
  const blockingTopics = outlook.blockingTopics;

  const rawAreas: { subject: string; name: string; score: number; isTopic: boolean; topic?: string; reason: string }[] =
    blockingTopics.length > 0
      ? blockingTopics.map(t => ({ name: t.topic, subject: t.subject, topic: t.topic, score: t.score, isTopic: true, reason: t.reason }))
      : weakSubjects.map(s => ({ name: s.name, subject: s.name, score: s.score, isTopic: false, reason: 'Weak subject' }));

  const enriched = rawAreas
    .map(a => enrichArea(a, topicMap, masteryMap))
    .sort((a, b) => {
      for (let i = 0; i < 4; i++) {
        if (a.sortKey[i] !== b.sortKey[i]) return a.sortKey[i] - b.sortKey[i];
      }
      return 0;
    });

  if (enriched.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.overline}>Top Weak Areas</Text>
        <Text style={styles.emptyText}>Keep practicing — your weak areas will appear here as you learn.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.overline}>Top Weak Areas</Text>
      <Text style={styles.subtitle}>Focus on these to improve your score</Text>

      {enriched.map((area) => (
        <View key={`${area.subject}::${area.name}`} style={styles.weakItem}>
          <View style={styles.weakContent}>
            <Text style={styles.weakName}>{area.name}</Text>
            {area.isTopic && <Text style={styles.subjectLabel}>{area.subject}</Text>}
            <Text style={styles.reasonText}>{area.reason}</Text>
            <View style={styles.scoreRow}>
              <View style={[styles.scoreBar, { width: `${area.score}%`, backgroundColor: area.score < 30 ? colors.error : colors.warning }]} />
            </View>
            <Text style={styles.weakScore}>{area.score}% proficiency</Text>
          </View>
          <TouchableOpacity
            style={styles.practiceBtn}
            onPress={() => onPracticeSubject(area.subject, area.isTopic ? area.name : undefined)}
            activeOpacity={0.7}
          >
            <Text style={styles.practiceBtnText}>Practice</Text>
          </TouchableOpacity>
        </View>
      ))}
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
  reasonText: {
    fontSize: 11,
    color: colors.warning,
    marginTop: 2,
    fontFamily: typography.caption.fontFamily,
  },
  scoreRow: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  scoreBar: { height: '100%', borderRadius: 2 },
  weakScore: {
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 1,
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
