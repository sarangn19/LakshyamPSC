import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { typography } from '../theme/typography';
import { useFlashcardStore, useMCQStore, usePerformanceStore, useKnowledgeStore } from '../store';
import { Badge, ProgressBar } from '../components/common/StyledComponents';
import { refreshProfile } from '../services/profileBuilder';
import { orchestrateSession, logOrchestratedSessionStart } from '../services/sessionOrchestrator';

const SUBJECTS = ['Kerala History', 'Renaissance', 'Constitution', 'Geography', 'Science', 'Current Affairs', 'Quantitative Aptitude', 'Mental Ability', 'Malayalam'];

export function RevisionHubScreen({ navigation }: any) {
  const getDueCount = useFlashcardStore((s) => s.getDueCount);
  const mistakes = useMCQStore((s) => s.mistakes);
  const flashcards = useFlashcardStore((s) => s.flashcards);
  const profile = usePerformanceStore((s) => s.profile);
  const notes = useKnowledgeStore((s) => s.notes);
  const startSprint = usePerformanceStore((s) => s.startSprint);
  const completeSprintDay = usePerformanceStore((s) => s.completeSprintDay);
  const getSprintProgress = usePerformanceStore((s) => s.getSprintProgress);
  const abandonSprint = usePerformanceStore((s) => s.abandonSprint);
  const sprint = usePerformanceStore((s) => s.sprint);

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

  const spr = useMemo(() => getSprintProgress(), [sprint]);

  const capsuleSubjects = useMemo(() => {
    const profileWeak = (profile?.weakSubjects ?? []).slice(0, 4);
    const mistakeSorted = Object.entries(subjectMistakes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([s]) => s);
    const combined = [...new Set([...profileWeak, ...mistakeSorted])].slice(0, 4);
    while (combined.length < 4) {
      const remaining = SUBJECTS.filter((s) => !combined.includes(s));
      if (remaining.length === 0) break;
      combined.push(remaining[Math.floor(Math.random() * remaining.length)]);
    }
    return combined.map((subject) => {
      const subMistakes = subjectMistakes[subject] || 0;
      const subNotes = notes.filter((n) => n.subject === subject).length;
      return { subject, mistakeCount: subMistakes, noteCount: subNotes };
    });
  }, [profile, subjectMistakes, notes]);

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
    startSprint();
    executeSprintDay(1);
  };

  const handleContinueSprint = () => {
    executeSprintDay(spr.currentDay);
  };

  const executeSprintDay = (day: number) => {
    const p = refreshProfile();
    const sprintPlan = spr.dayPlans.find((d) => d.day === day);
    const sessionType = sprintPlan?.sessionType ?? 'exam_simulation';

    if (sessionType === 'flashcard_review') {
      if (dueCount > 0) {
        useFlashcardStore.getState().loadDueCards();
        navigation.navigate('Learn');
      } else if (totalCards > 0) {
        navigation.navigate('Learn');
      }
      completeSprintDay();
    } else if (sessionType === 'exam_simulation') {
      useMCQStore.getState().startOrchestratedSession({
        subjects: p.weakSubjects.length > 0 ? p.weakSubjects : undefined,
        difficulty: 'hard',
        count: 20,
        sessionType: 'exam_simulation',
      });
      completeSprintDay();
      navigation.navigate('MCQ');
    } else if (sessionType === 'knowledge_revisit' || sessionType === 'confusion_repair') {
      const targetSubject = sprintPlan?.sessionType === 'knowledge_revisit'
        ? (p.weakSubjects[0] ?? 'Constitution')
        : (p.weakSubjects[1] ?? 'Kerala History');
      useKnowledgeStore.getState().setSelectedSubject(targetSubject);
      navigation.navigate('Knowledge');
      completeSprintDay();
    } else {
      useMCQStore.getState().startOrchestratedSession({
        subjects: p.weakSubjects.length > 0 ? p.weakSubjects : undefined,
        difficulty: sessionType === 'weakness_practice' ? 'medium' : 'hard',
        count: 12,
        sessionType,
      });
      completeSprintDay();
      navigation.navigate('MCQ');
    }
  };

  const handleOpenCapsule = (capsule: { subject: string }) => {
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
          {spr.isActive
            ? `${spr.completedCount}/7 days done`
            : 'Intensive revision plan — daily missions over 7 days'}
        </Text>

        {spr.isActive ? (
          <>
            <View style={styles.sprintProgressBar}>
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <View
                  key={d}
                  style={[
                    styles.sprintDot,
                    sprint.completedDays.includes(d) && styles.sprintDotDone,
                    d === spr.currentDay && !sprint.completedDays.includes(d) && styles.sprintDotActive,
                  ]}
                />
              ))}
            </View>
            <View style={styles.sprintMissionCard}>
              <Text style={[typography.h4, { color: colors.primary }]}>Day {spr.currentDay}</Text>
              <Text style={[typography.bodyBold, { color: colors.text, marginTop: spacing.xs }]}>
                {sprint.dayPlans[spr.currentDay - 1]?.title ?? 'Mission'}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                {sprint.dayPlans[spr.currentDay - 1]?.description ?? ''}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
              <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: colors.primary }]} onPress={handleContinueSprint}>
                <Text style={[typography.bodyBold, { color: colors.white }]}>Continue →</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: colors.bgInput }]} onPress={abandonSprint}>
                <Text style={[typography.bodyBold, { color: colors.textMuted }]}>Cancel Sprint</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.sprintPreview}>
              {[
                { day: 1, title: 'Foundation Check' },
                { day: 2, title: 'Memory Reinforcement' },
                { day: 3, title: 'Mixed Practice' },
                { day: 4, title: 'Concept Deep-Dive' },
                { day: 5, title: 'Gap Closure' },
                { day: 6, title: 'Full Mock' },
                { day: 7, title: 'Consolidation' },
              ].map((item) => (
                <View key={item.day} style={styles.sprintPreviewRow}>
                  <Text style={[typography.small, { color: colors.textMuted, width: 24 }]}>{item.day}</Text>
                  <Text style={[typography.caption, { color: colors.text }]}>{item.title}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.warning, marginTop: spacing.md }]} onPress={handleStartSprint}>
              <Text style={[typography.bodyBold, { color: colors.black }]}>Start 7-Day Sprint</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.capsuleSection}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>💊 Last Minute Capsule</Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.md }]}>
          Your weakest subjects — tap to review notes or practice
        </Text>

        {capsuleSubjects.map((cs) => {
          const subtitle = cs.mistakeCount > 0 && cs.noteCount > 0
            ? `${cs.mistakeCount} mistakes · ${cs.noteCount} notes`
            : cs.mistakeCount > 0
              ? `${cs.mistakeCount} mistakes to review`
              : cs.noteCount > 0
                ? `${cs.noteCount} notes available`
                : 'No data yet — start a session';
          return (
            <TouchableOpacity key={cs.subject} style={styles.capsuleCard} onPress={() => handleOpenCapsule(cs)}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, { color: colors.text }]}>{cs.subject}</Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
                  <Badge label={cs.subject} color={cs.mistakeCount > 0 ? colors.warning : colors.primaryLight} />
                  <Text style={[typography.small, { color: colors.textMuted }]}>{subtitle}</Text>
                </View>
              </View>
              <Text style={{ color: colors.textMuted, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          );
        })}
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
  sprintProgressBar: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md, justifyContent: 'center' },
  sprintDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.bgInput, borderWidth: 2, borderColor: colors.border },
  sprintDotDone: { backgroundColor: colors.success, borderColor: colors.success },
  sprintDotActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  sprintMissionCard: {
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  sprintPreview: { gap: spacing.xs },
  sprintPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
