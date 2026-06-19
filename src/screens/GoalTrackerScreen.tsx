import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from '../i18n/useTranslation';
import { colors, spacing, borderRadius } from '../theme';
import { typography } from '../theme/typography';
import { useUserStore, useFlashcardStore } from '../store';
import { Badge, ProgressBar, StatCard } from '../components/common/StyledComponents';
import { examTypes } from '../data/questions';

const EXAM_ICONS: Record<string, string> = {
  'LDC': '📋',
  'Secretariat Assistant': '🏛️',
  'University Assistant': '🎓',
  'Police Constable': '🛡️',
  'Degree Level': '📚',
};

const EXAM_DESCRIPTIONS: Record<string, string> = {
  'LDC': '10th level • High volume, fast recall • Easy questions',
  'Secretariat Assistant': '12th level • Deeper GK, English grammar, reasoning',
  'University Assistant': 'Degree level • University-specific paper style',
  'Police Constable': '10th level + Law basics • Physical test tracking',
  'Degree Level': 'KPSC toughest • Deep conceptual • Essay mains',
};

const ROADMAP_BY_EXAM: Record<string, { phase: string; duration: string; topics: string; color: string }[]> = {
  'LDC': [
    { phase: 'Foundation', duration: 'Days 1-20', topics: 'Kerala History, Renaissance, Constitution basics', color: colors.info },
    { phase: 'Building', duration: 'Days 21-40', topics: 'Geography, Science, Malayalam, Basic Maths', color: colors.primary },
    { phase: 'Speed', duration: 'Days 41-60', topics: 'Daily drills, speed practice, current affairs', color: colors.accentTeal },
    { phase: 'Revision', duration: 'Days 60+', topics: 'Full mocks, error review, flashcards', color: colors.accentGreen },
  ],
  'Secretariat Assistant': [
    { phase: 'Foundation', duration: 'Days 1-25', topics: 'Renaissance, Constitution, History, English Grammar', color: colors.info },
    { phase: 'Building', duration: 'Days 26-50', topics: 'Geography, Science, Reasoning, Current Affairs', color: colors.primary },
    { phase: 'Advanced', duration: 'Days 51-75', topics: 'Deep GK, mental ability, essay practice', color: colors.accentTeal },
    { phase: 'Revision', duration: 'Days 75+', topics: 'Mock tests, error notebooks, weakness fix', color: colors.accentGreen },
  ],
  'Degree Level': [
    { phase: 'Foundation', duration: 'Days 1-40', topics: 'Renaissance, Constitution, Kerala History (deep)', color: colors.info },
    { phase: 'Building', duration: 'Days 41-80', topics: 'Geography, Science, Economics, Current Affairs depth', color: colors.primary },
    { phase: 'Advanced', duration: 'Days 81-120', topics: 'Essay writing, conceptual clarity, mains prep', color: colors.accentTeal },
    { phase: 'Mains Focus', duration: 'Days 120+', topics: 'Full mocks, answer writing, deep analysis', color: colors.secondary },
    { phase: 'Revision', duration: 'Days 150+', topics: 'All subjects, previous year questions, final sprint', color: colors.accentGreen },
  ],
  'Police Constable': [
    { phase: 'Foundation', duration: 'Days 1-20', topics: 'Kerala History, Renaissance, Constitution basics', color: colors.info },
    { phase: 'Building', duration: 'Days 21-40', topics: 'Geography, Science, Law basics, Police Act', color: colors.primary },
    { phase: 'Physical + Written', duration: 'Days 41-60', topics: 'Physical training + GK, Crime GK', color: colors.accentTeal },
    { phase: 'Revision', duration: 'Days 60+', topics: 'Mocks, physical test prep, current affairs', color: colors.accentGreen },
  ],
  'University Assistant': [
    { phase: 'Foundation', duration: 'Days 1-30', topics: 'Renaissance, Constitution, University-specific GK', color: colors.info },
    { phase: 'Building', duration: 'Days 31-60', topics: 'Geography, Science, Reasoning, English', color: colors.primary },
    { phase: 'Advanced', duration: 'Days 61-90', topics: 'Deep GK, mental ability, essay', color: colors.accentTeal },
    { phase: 'Revision', duration: 'Days 90+', topics: 'Mock tests, error review, university question banks', color: colors.accentGreen },
  ],
};

export function GoalTrackerScreen() {
  const { t } = useTranslation();
  const phaseLabels: Record<string, string> = {
    Foundation: t('goals.foundation'),
    Building: t('goals.building'),
    Speed: t('goals.speed'),
    Advanced: t('goals.advanced'),
    'Mains Focus': t('goals.mainsFocus'),
    Revision: t('goals.revision'),
  };
  const {
    targetExams, primaryExam, examDate, streak, masteredTopics,
    accuracyImprovement, dailyTargetMCQs, dailyTargetFlashcards, examReadiness,
    toggleTargetExam, setPrimaryExam, updateStreak,
  } = useUserStore();
  const getMasteredCount = useFlashcardStore((s) => s.getMasteredCount);

  const daysUntilExam = Math.max(0, Math.round((new Date(examDate).getTime() - Date.now()) / 86400000));
  const activeReadiness = examReadiness.filter((r) => targetExams.includes(r.examName));

  return (
    <ScrollView style={styles.container}>
      <Text style={[typography.h2, { color: colors.text, paddingTop: spacing.lg }]}>{t('goals.title')}</Text>
      <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>{t('goals.subtitle')}</Text>

      <View style={styles.targetCard}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>{t('goals.selectPosts')}</Text>
        <Text style={[typography.small, { color: colors.textMuted, marginBottom: spacing.md }]}>
          {t('goals.postsHint')}
        </Text>
        <View style={styles.examGrid}>
          {examTypes.map((exam) => {
            const isActive = targetExams.includes(exam.name);
            const isPrimary = primaryExam === exam.name;
            const readiness = examReadiness.find((r) => r.examName === exam.name);
            return (
              <TouchableOpacity
                key={exam.id}
                style={[styles.examCard, isActive && styles.examCardActive, isPrimary && styles.examCardPrimary]}
                onPress={() => {
                  if (isActive) setPrimaryExam(exam.name);
                  else toggleTargetExam(exam.name);
                }}
                onLongPress={() => toggleTargetExam(exam.name)}
              >
                <View style={styles.examCardHeader}>
                  <Text style={{ fontSize: 24 }}>{EXAM_ICONS[exam.name] || '📌'}</Text>
                  {isActive && <Text style={{ color: colors.accentGreen, fontSize: 14 }}>✓</Text>}
                </View>
                <Text style={[typography.captionBold, { color: colors.text, marginTop: spacing.xs }]}>{exam.name}</Text>
                <Text style={[typography.tiny, { color: colors.textMuted, marginVertical: spacing.xs }]}>{EXAM_DESCRIPTIONS[exam.name]}</Text>
                {readiness && isActive && (
                  <View style={styles.examReadinessRow}>
                    <Text style={[typography.small, { color: readiness.readinessPercent > 70 ? colors.accentGreen : readiness.readinessPercent > 50 ? colors.warning : colors.error }]}>
                      {t('goals.percentReady', { pct: readiness.readinessPercent })}
                    </Text>
                    <Text style={[typography.tiny, { color: colors.textMuted }]}>{readiness.predictedDate}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={[typography.tiny, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.md }]}>
          {t('goals.tapToSetPrimary')}
        </Text>
        {targetExams.length > 1 && (
          <View style={styles.primaryBadge}>
            <Badge label={t('goals.primary', { exam: primaryExam })} color={colors.primary} />
          </View>
        )}
      </View>

      {activeReadiness.length > 1 && (
        <View style={styles.comparisonCard}>
          <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>{t('goals.readinessComparison')}</Text>
          {activeReadiness
            .sort((a, b) => b.readinessPercent - a.readinessPercent)
            .map((r, i) => {
              const barColor = r.readinessPercent > 70 ? colors.accentGreen : r.readinessPercent > 50 ? colors.warning : colors.error;
              return (
                <View key={r.examName} style={styles.compRow}>
                  <View style={styles.compLabel}>
                    <Text style={{ fontSize: 14 }}>{EXAM_ICONS[r.examName] || '📌'}</Text>
                    <Text style={[typography.caption, { color: colors.text, marginLeft: spacing.xs }]}>{r.examName}</Text>
                    {r.examName === primaryExam && <Text style={{ color: colors.primary, fontSize: 10, marginLeft: 4 }}>★</Text>}
                  </View>
                  <View style={styles.compBar}>
                    <View style={[styles.compFill, { width: `${r.readinessPercent}%`, backgroundColor: barColor }]} />
                  </View>
                  <View style={styles.compStats}>
                    <Text style={[typography.captionBold, { color: barColor }]}>{r.readinessPercent}%</Text>
                    <Text style={[typography.tiny, { color: colors.textMuted }]}>{r.accuracyPercent}% acc</Text>
                  </View>
                </View>
              );
            })}
        </View>
      )}

      <View style={styles.streakCard}>
        <View style={styles.streakHeader}>
          <View>
            <Text style={[typography.caption, { color: colors.textMuted }]}>{t('goals.studyStreak')}</Text>
            <Text style={[typography.h1, { color: colors.accent, fontSize: 48 }]}>{streak.current}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>days 🔥</Text>
          </View>
          <View style={styles.streakStats}>
            <StatCard label={t('goals.bestStreak')} value={`${streak.longest}d`} color={colors.accent} />
            <StatCard label={t('goals.posts')} value={`${targetExams.length}`} color={colors.primary} />
            <StatCard label={t('goals.mastered')} value={`${masteredTopics.length}`} color={colors.accentGreen} />
            <StatCard label={t('goals.cards')} value={`${getMasteredCount()}`} color={colors.info} />
          </View>
        </View>
      </View>

      <View style={styles.roadmapCard}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>
          {t('goals.studyRoadmap', { exam: '' })}<Text style={{ color: colors.primary }}>{primaryExam}</Text>
        </Text>
        {(ROADMAP_BY_EXAM[primaryExam] || ROADMAP_BY_EXAM['Secretariat Assistant']).map((phase) => (
          <View key={phase.phase} style={[styles.phaseRow, { borderLeftColor: phase.color }]}>
            <View style={styles.phaseInfo}>
              <Text style={[typography.bodyBold, { color: colors.text }]}>{phaseLabels[phase.phase] || phase.phase}</Text>
              <Text style={[typography.small, { color: colors.textMuted }]}>{phase.duration}</Text>
            </View>
            <Text style={[typography.small, { color: colors.textSecondary }]}>{phase.topics}</Text>
          </View>
        ))}
      </View>

      <View style={styles.dailyCard}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>{t('goals.dailyTargets')}</Text>
        <View style={styles.targetRow}>
          <View style={styles.targetItem}>
            <Text style={[typography.small, { color: colors.textMuted }]}>{t('goals.mcqs')}</Text>
            <Text style={[typography.h2, { color: colors.primary }]}>{dailyTargetMCQs}</Text>
          </View>
          <View style={styles.targetItem}>
            <Text style={[typography.small, { color: colors.textMuted }]}>{t('goals.flashcardsShort')}</Text>
            <Text style={[typography.h2, { color: colors.accent }]}>{dailyTargetFlashcards}</Text>
          </View>
          <View style={styles.targetItem}>
            <Text style={[typography.small, { color: colors.textMuted }]}>{t('goals.accuracyUp')}</Text>
            <Text style={[typography.h2, { color: colors.accentGreen }]}>+{accuracyImprovement}%</Text>
          </View>
        </View>
      </View>

      <View style={styles.masteredCard}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>{t('goals.masteredTopics')}</Text>
        {masteredTopics.length === 0 ? (
          <Text style={[typography.caption, { color: colors.textMuted }]}>{t('goals.noMasteredTopics')}</Text>
        ) : (
          masteredTopics.map((topic) => (
            <View key={topic} style={styles.masteredRow}>
              <Text style={{ color: colors.accentGreen, fontSize: 16 }}>✓</Text>
              <Text style={[typography.body, { color: colors.text, marginLeft: spacing.sm }]}>{topic}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  targetCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  examGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  examCard: {
    width: '48%',
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  examCardActive: { borderColor: colors.primary, backgroundColor: colors.primary + '08' },
  examCardPrimary: { borderColor: colors.accentGreen, borderWidth: 2 },
  examCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  examReadinessRow: { marginTop: spacing.xs },
  primaryBadge: { alignItems: 'center', marginTop: spacing.md },
  comparisonCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
  compLabel: { flexDirection: 'row', alignItems: 'center', width: 120 },
  compBar: { flex: 1, height: 12, backgroundColor: colors.bgInput, borderRadius: 6 },
  compFill: { height: 12, borderRadius: 6 },
  compStats: { alignItems: 'flex-end', width: 60 },
  streakCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  streakStats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'flex-end' },
  roadmapCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  phaseRow: {
    borderLeftWidth: 3,
    paddingLeft: spacing.md,
    marginBottom: spacing.md,
  },
  phaseInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dailyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  targetRow: { flexDirection: 'row', justifyContent: 'space-around' },
  targetItem: { alignItems: 'center' },
  masteredCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.huge,
    borderWidth: 1,
    borderColor: colors.border,
  },
  masteredRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
});
