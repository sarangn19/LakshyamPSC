import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { typography } from '../theme/typography';
import { useFlashcardStore, useMCQStore, usePerformanceStore, useKnowledgeStore } from '../store';
import { Badge, ProgressBar } from '../components/common/StyledComponents';
import { refreshProfile } from '../services/profileBuilder';
import { orchestrateSession, logOrchestratedSessionStart } from '../services/sessionOrchestrator';

export function RevisionHubScreen({ navigation }: any) {
  const getDueCount = useFlashcardStore((s) => s.getDueCount);
  const mistakes = useMCQStore((s) => s.mistakes);
  const flashcards = useFlashcardStore((s) => s.flashcards);
  const profile = usePerformanceStore((s) => s.profile);
  const notes = useKnowledgeStore((s) => s.notes);

  const dueCount = getDueCount();
  const unreviewedMistakes = mistakes.filter((m) => !m.reviewed);

  const subjectMistakes: Record<string, number> = {};
  unreviewedMistakes.forEach((m) => { subjectMistakes[m.subject] = (subjectMistakes[m.subject] || 0) + 1; });
  const weakSubjects = Object.entries(subjectMistakes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);
  const maxMistakeCount = Math.max(1, ...Object.values(subjectMistakes));

  const masteredCount = useFlashcardStore((s) => s.getMasteredCount);
  const totalCards = flashcards.length;

  const now = new Date();
  const intervals = [1, 3, 7, 15, 30];
  const dueDistribution = intervals.map((days) => {
    const cutoff = new Date(now.getTime() + days * 86400000);
    return flashcards.filter(
      (c) => !c.mastered && new Date(c.nextReviewDate) <= cutoff && new Date(c.nextReviewDate) > now,
    ).length;
  });

  const accuracy = profile ? Math.round(profile.averageAccuracy * 100) : 0;

  const handleStartRevision = () => {
    const p = refreshProfile();
    const plan = orchestrateSession({
      profile: p,
      availableMinutes: Math.max(p.averageSessionMinutes, 15),
      lastSessionType: null,
      recentSessionTypes: [],
    });
    logOrchestratedSessionStart(plan);

    usePerformanceStore.getState().addRecommendation({
      sessionType: plan.sessionType,
      title: plan.title,
      reasonFactors: plan.reasoning,
    });

    const mcqActivities = plan.activities.filter((a) => a.type === 'mcq');
    const flashcardActivities = plan.activities.filter((a) => a.type === 'flashcard');

    if (flashcardActivities.length > 0 && dueCount > 0) {
      useFlashcardStore.getState().loadDueCards();
      navigation.navigate('Learn');
    } else if (mcqActivities.length > 0) {
      const mcqCount = mcqActivities.reduce((s, a) => s + a.count, 0);
      useMCQStore.getState().startOrchestratedSession({
        subjects: plan.focusSubjects.length > 0 ? plan.focusSubjects : undefined,
        count: Math.max(5, mcqCount),
        sessionType: plan.sessionType,
      });
      navigation.navigate('MCQ');
    }
  };

  const handleStartSprint = () => {
    const p = refreshProfile();
    const plan = orchestrateSession({
      profile: p,
      availableMinutes: 45,
      lastSessionType: null,
      recentSessionTypes: [],
    });
    logOrchestratedSessionStart(plan);

    useMCQStore.getState().startOrchestratedSession({
      subjects: p.weakSubjects.length > 0 ? p.weakSubjects : undefined,
      difficulty: 'hard',
      count: 20,
      sessionType: 'exam_simulation',
    });
    navigation.navigate('MCQ');
  };

  const handleOpenCapsule = (capsule: { title: string; subject: string }) => {
    const subjectNotes = notes.filter((n) => n.subject === capsule.subject);
    if (subjectNotes.length > 0) {
      useKnowledgeStore.getState().setSelectedSubject(capsule.subject);
      navigation.navigate('Knowledge');
    } else {
      navigation.navigate('AITutor');
    }
  };

  const revisionItems = [
    { label: 'Flashcards Due', value: dueCount, icon: '🃏', color: colors.info },
    { label: 'Mistakes to Review', value: unreviewedMistakes.length, icon: '📓', color: colors.secondary },
    { label: 'Weak Topics', value: weakSubjects.length, icon: '🎯', color: colors.warning },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={[typography.h2, { color: colors.text, paddingTop: spacing.huge }]}>Revision Hub</Text>
      <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>Based on your forgetting curve</Text>

      <View style={styles.todaySection}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>📅 Today's Revision Plan</Text>
        <View style={styles.planRow}>
          {revisionItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.planCard, { borderLeftColor: item.color }]}
              onPress={() => {
                if (item.label === 'Flashcards Due' && dueCount > 0) {
                  useFlashcardStore.getState().loadDueCards();
                  navigation.navigate('Learn');
                } else if (item.label === 'Mistakes to Review' && unreviewedMistakes.length > 0) {
                  navigation.navigate('Analytics');
                } else if (item.label === 'Weak Topics' && weakSubjects.length > 0) {
                  navigation.navigate('Analytics');
                }
              }}
            >
              <Text style={{ fontSize: 28 }}>{item.icon}</Text>
              <Text style={[typography.h2, { color: item.color, marginTop: spacing.sm }]}>{item.value}</Text>
              <Text style={[typography.small, { color: colors.textSecondary, textAlign: 'center' }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={handleStartRevision}>
          <Text style={[typography.bodyBold, { color: colors.white }]}>Start Today's Revision →</Text>
        </TouchableOpacity>
      </View>

      {weakSubjects.length > 0 && (
        <View style={styles.weakSection}>
          <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>🎯 Topics Needing Attention</Text>
          {weakSubjects.map(([subject, count]) => (
            <View key={subject} style={styles.weakRow}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                <Badge label={subject} color={colors.warning} />
                <Text style={[typography.caption, { color: colors.textMuted }]}>{count} mistakes</Text>
              </View>
              <ProgressBar percent={(count / maxMistakeCount) * 100} color={colors.error} height={6} />
            </View>
          ))}
        </View>
      )}

      <View style={styles.sprintSection}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>⚡ 7-Day Sprint</Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.md }]}>
          Intensive revision plan — 45 min sessions, harder difficulty, exam simulation focus
        </Text>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.warning }]} onPress={handleStartSprint}>
          <Text style={[typography.bodyBold, { color: colors.black }]}>Start 7-Day Sprint</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.capsuleSection}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>💊 Last Minute Capsule</Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.md }]}>
          High-frequency topics and expected areas — tap to review
        </Text>

        {[
          { title: 'Kerala Renaissance - Top 20 Facts', subject: 'Renaissance', items: '20 facts' },
          { title: 'Constitution - Key Articles', subject: 'Constitution', items: '15 articles' },
          { title: 'Kerala Districts - Quick Recap', subject: 'Geography', items: '14 districts' },
          { title: 'Current Affairs - Monthly Digest', subject: 'Current Affairs', items: 'Top stories' },
        ].map((capsule) => (
          <TouchableOpacity key={capsule.title} style={styles.capsuleCard} onPress={() => handleOpenCapsule(capsule)}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyBold, { color: colors.text }]}>{capsule.title}</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
                <Badge label={capsule.subject} color={colors.primaryLight} />
                <Text style={[typography.small, { color: colors.textMuted }]}>{capsule.items}</Text>
              </View>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.flashcardPreview}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
          <Text style={[typography.h4, { color: colors.text }]}>🃏 Spaced Repetition</Text>
          <Badge label={`${dueCount} due`} color={colors.info} />
        </View>
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.md }]}>
          {totalCards > 0
            ? `${masteredCount()} of ${totalCards} cards mastered · ${accuracy}% accuracy`
            : 'No cards yet — start a session to generate flashcards'}
        </Text>
        <View style={styles.repRow}>
          {intervals.map((days, i) => (
            <TouchableOpacity
              key={days}
              style={[styles.repDot, dueDistribution[i] > 0 && styles.repDotActive]}
              onPress={() => {
                if (dueCount > 0) {
                  useFlashcardStore.getState().loadDueCards();
                  navigation.navigate('Learn');
                }
              }}
            >
              <Text style={[typography.tiny, { color: dueDistribution[i] > 0 ? colors.primary : colors.textMuted }]}>
                {days}d
              </Text>
              {dueDistribution[i] > 0 && (
                <Text style={[typography.tiny, { color: colors.primary, fontWeight: '700' }]}>
                  {dueDistribution[i]}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primary, marginTop: spacing.md }]}
          onPress={() => {
            if (dueCount > 0) {
              useFlashcardStore.getState().loadDueCards();
              navigation.navigate('Learn');
            } else if (totalCards > 0) {
              useFlashcardStore.getState().loadDueCards();
              navigation.navigate('Learn');
            }
          }}
        >
          <Text style={[typography.bodyBold, { color: colors.white }]}>
            {dueCount > 0 ? `Review ${dueCount} Due Cards →` : totalCards > 0 ? 'All reviewed! View cards →' : 'Generate Flashcards →'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  todaySection: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  planCard: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderLeftWidth: 3,
  },
  actionBtn: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  weakSection: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weakRow: { marginBottom: spacing.md },
  sprintSection: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  capsuleSection: { marginTop: spacing.xl },
  capsuleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  flashcardPreview: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.huge,
    borderWidth: 1,
    borderColor: colors.border,
  },
  repRow: { flexDirection: 'row', justifyContent: 'space-between' },
  repDot: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    minWidth: 48,
  },
  repDotActive: { backgroundColor: colors.primaryLight },
});
