import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { typography } from '../theme/typography';
import { StudySessionPlan, SessionType } from '../services/sessionOrchestrator';
import { useMCQStore, useFlashcardStore, useKnowledgeStore } from '../store';

const SESSION_ICONS: Record<SessionType, string> = {
  confusion_repair: '🔀',
  revision_reinforcement: '🔄',
  flashcard_review: '🃏',
  weakness_practice: '🧠',
  exam_simulation: '🎯',
  knowledge_revisit: '📖',
};

const SESSION_COLORS: Record<SessionType, string> = {
  confusion_repair: '#A66CFF',
  revision_reinforcement: '#4D96FF',
  flashcard_review: '#FFD93D',
  weakness_practice: '#6BCB77',
  exam_simulation: '#FF6B6B',
  knowledge_revisit: '#FF9F43',
};

const SESSION_ACTIONS: Record<SessionType, { showNotes: boolean; showAI: boolean; showMCQ: boolean; showFlashcard: boolean; label?: string }> = {
  weakness_practice: { showNotes: true, showAI: true, showMCQ: true, showFlashcard: false },
  confusion_repair: { showNotes: true, showAI: true, showMCQ: true, showFlashcard: false },
  knowledge_revisit: { showNotes: true, showAI: true, showMCQ: false, showFlashcard: false },
  revision_reinforcement: { showNotes: true, showAI: true, showMCQ: true, showFlashcard: false },
  flashcard_review: { showNotes: false, showAI: false, showMCQ: false, showFlashcard: true },
  exam_simulation: { showNotes: false, showAI: false, showMCQ: true, showFlashcard: false, label: '🎯 Start Mock Exam' },
};

function getDifficultyFromMix(mix: { easy: number; medium: number; hard: number }): 'easy' | 'medium' | 'hard' {
  if (mix.hard >= 40) return 'hard';
  if (mix.medium >= 40) return 'medium';
  return 'easy';
}

interface Props {
  plan: StudySessionPlan;
  navigation: any;
  onSessionStart?: () => void;
}

export function RecommendationCard({ plan, navigation, onSessionStart }: Props) {
  const actions = SESSION_ACTIONS[plan.sessionType];

  const handleReviewNotes = () => {
    if (plan.focusSubjects.length > 0) {
      useKnowledgeStore.getState().setSelectedSubject(plan.focusSubjects[0]);
    }
    navigation.navigate('Knowledge');
  };

  const handleAskAITutor = () => {
    navigation.navigate('AITutor');
  };

  const handlePracticeMCQs = () => {
    useMCQStore.getState().startOrchestratedSession({
      subjects: plan.focusSubjects.length > 0 ? plan.focusSubjects : undefined,
      difficulty: getDifficultyFromMix(plan.difficultyMix),
      count: Math.max(5, Math.round(plan.estimatedDuration / 2)),
      sessionType: plan.sessionType,
    });
    navigation.navigate('MCQ');
    onSessionStart?.();
  };

  const handleReviewFlashcards = () => {
    useFlashcardStore.getState().loadDueCards();
    navigation.navigate('Flashcards');
    onSessionStart?.();
  };

  const handleMockExam = () => {
    useMCQStore.getState().startOrchestratedSession({
      subjects: undefined,
      difficulty: 'hard',
      count: Math.max(10, Math.round(plan.estimatedDuration / 2)),
      sessionType: 'exam_simulation',
    });
    navigation.navigate('MCQ');
    onSessionStart?.();
  };

  const color = SESSION_COLORS[plan.sessionType];
  const isFlashcard = plan.sessionType === 'flashcard_review';
  const isExam = plan.sessionType === 'exam_simulation';

  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.header}>
        <Text style={{ fontSize: 28 }}>{SESSION_ICONS[plan.sessionType]}</Text>
        <View style={{ marginLeft: spacing.md, flex: 1 }}>
          <Text style={[typography.h3, { color: colors.text }]}>{plan.title}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
            {plan.estimatedDuration} min
            {plan.focusSubjects.length > 0 ? ` \u00B7 ${plan.focusSubjects.slice(0, 2).join(', ')}` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.reasoningSection}>
        <Text style={[typography.captionBold, { color: color, marginBottom: spacing.xs }]}>Why this?</Text>
        {plan.reasoning.map((r, i) => (
          <Text key={i} style={[typography.small, { color: colors.textMuted, lineHeight: 18, marginBottom: 2 }]}>
            {i + 1}. {r}
          </Text>
        ))}
      </View>

      {isExam ? (
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: color }]} onPress={handleMockExam}>
          <Text style={[typography.bodyBold, { color: '#fff' }]}>🎯 Start Mock Exam</Text>
        </TouchableOpacity>
      ) : isFlashcard ? (
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: color }]} onPress={handleReviewFlashcards}>
          <Text style={[typography.bodyBold, { color: '#fff' }]}>🃏 Review Due Cards</Text>
        </TouchableOpacity>
      ) : (
        <>
          <Text style={[typography.captionBold, { color: colors.textSecondary, marginBottom: spacing.sm, marginTop: spacing.xs }]}>
            How to study this:
          </Text>
          <View style={styles.actionRow}>
            {actions.showNotes && (
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleReviewNotes}>
                <Text style={{ fontSize: 18 }}>📖</Text>
                <Text style={[typography.captionBold, { color: colors.text, marginTop: 2 }]}>Read Notes</Text>
              </TouchableOpacity>
            )}
            {actions.showAI && (
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleAskAITutor}>
                <Text style={{ fontSize: 18 }}>🤖</Text>
                <Text style={[typography.captionBold, { color: colors.text, marginTop: 2 }]}>Ask AI</Text>
              </TouchableOpacity>
            )}
          </View>
          {actions.showMCQ && (
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: color + '30', borderWidth: 1, borderColor: color }]} onPress={handlePracticeMCQs}>
              <Text style={[typography.bodyBold, { color }]}>🎯 Practice MCQs</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  header: { flexDirection: 'row', alignItems: 'center' },
  reasoningSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border + '40',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryBtn: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
});
