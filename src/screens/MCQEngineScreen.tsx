import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { typography } from '../theme/typography';
import { useMCQStore, useUserStore } from '../store';
import { Badge, ProgressBar } from '../components/common/StyledComponents';
import { examTypes } from '../data/questions';

const EXAM_ICONS: Record<string, string> = {
  'LDC': '📋',
  'Secretariat Assistant': '🏛️',
  'University Assistant': '🎓',
  'Police Constable': '🛡️',
  'Degree Level': '📚',
};

const DIFFICULTY_MAP: Record<string, string> = {
  'LDC': '10th Level • Easy',
  'Secretariat Assistant': '12th Level • Easy-Medium',
  'University Assistant': 'Degree Level • All Difficulties',
  'Police Constable': '10th Level + Law • Easy-Medium',
  'Degree Level': 'Deep Conceptual • All Difficulties',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  'LDC': colors.accentGreen,
  'Secretariat Assistant': colors.info,
  'University Assistant': colors.accentTeal,
  'Police Constable': colors.warning,
  'Degree Level': colors.secondary,
};

export function MCQEngineScreen({ route, navigation }: any) {
  const {
    currentQuestions, currentIndex, selectedAnswer, isAnswered, score,
    drillMode, sessionActive, selectedExam, lastSessionOutcome,
    startDailyDrill, startWeaknessPractice, startExamMode, selectAnswer,
    nextQuestion, resetSession, setSelectedExam, mistakes, subjectProgress,
    reportQuestion, generatorPoolSize,
  } = useMCQStore();
  const { targetExams } = useUserStore();

  const mode = route?.params?.mode || 'daily';

  useEffect(() => {
    if (mode === 'daily') startDailyDrill(targetExams);
    else if (mode === 'weakness') startWeaknessPractice(targetExams);
    else if (mode === 'exam') startExamMode(selectedExam);
  }, [mode]);

  useEffect(() => {
    if (!sessionActive && score.total > 0 && lastSessionOutcome) {
      navigation.navigate('PostSession');
    }
  }, [sessionActive, score.total, lastSessionOutcome, navigation]);

  const current = currentQuestions[currentIndex];
  const weakSubjects = subjectProgress.filter((s) => s.confidenceScore < 60);

  if (!sessionActive && score.total > 0) {
    const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    return (
      <View style={styles.container}>
        <View style={styles.resultCard}>
          <Text style={{ fontSize: 48, textAlign: 'center' }}>{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</Text>
          <Text style={[typography.h2, { color: colors.text, textAlign: 'center', marginTop: spacing.md }]}>Session Complete!</Text>
          <Text style={[typography.h1, { color: colors.primary, textAlign: 'center', marginVertical: spacing.lg }]}>{score.correct}/{score.total}</Text>
          <ProgressBar percent={pct} color={pct >= 80 ? colors.accentGreen : pct >= 50 ? colors.warning : colors.error} height={10} />
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md }]}>{pct}% Accuracy</Text>
          <View style={styles.resultActions}>
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => {
              if (drillMode === 'daily') startDailyDrill(targetExams);
              else if (drillMode === 'weakness') startWeaknessPractice(targetExams);
              else startExamMode(selectedExam);
            }}>
              <Text style={[typography.bodyBold, { color: colors.white }]}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.bgCard }]} onPress={resetSession}>
              <Text style={[typography.bodyBold, { color: colors.text }]}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (!sessionActive) {
    const weakCount = weakSubjects.map((s) => s.subjectName);
    return (
      <ScrollView style={styles.container}>
        <Text style={[typography.h2, { color: colors.text, paddingTop: spacing.lg }]}>MCQ Practice</Text>
        {targetExams.length > 1 && (
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
            Questions tailored for: {targetExams.join(', ')}
          </Text>
        )}

        <View style={styles.section}>
          <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>⚡ Daily Drill</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.sm }]}>10 questions across your active posts</Text>
          {targetExams.map((exam) => (
            <View key={exam} style={styles.tierBadge}>
              <Text style={{ fontSize: 12 }}>{EXAM_ICONS[exam] || '📌'}</Text>
              <Text style={[typography.small, { color: DIFFICULTY_MAP[exam] ? DIFFICULTY_COLORS[exam] : colors.textSecondary, marginLeft: spacing.xs }]}>
                {exam}: {DIFFICULTY_MAP[exam] || 'Mixed'}
              </Text>
            </View>
          ))}
          <TouchableOpacity style={[styles.primaryBtn, { marginTop: spacing.md }]} onPress={() => startDailyDrill(targetExams)}>
            <Text style={[typography.bodyBold, { color: colors.white }]}>Start Daily Drill</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>🎯 Weakness Practice</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.md }]}>
            Focus on: {weakCount.length > 0 ? weakCount.join(', ') : 'All subjects looking good!'}
          </Text>
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.secondary }]} onPress={() => startWeaknessPractice(targetExams)}>
            <Text style={[typography.bodyBold, { color: colors.white }]}>Practice Weak Areas</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>📝 Exam Mode</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
            {examTypes.map((exam) => (
              <TouchableOpacity
                key={exam.id}
                style={[styles.examChip, selectedExam === exam.name && styles.examChipActive]}
                onPress={() => setSelectedExam(exam.name)}
              >
                <Text style={{ fontSize: 14 }}>{EXAM_ICONS[exam.name] || '📌'}</Text>
                <Text style={[typography.small, { color: selectedExam === exam.name ? colors.primary : colors.textSecondary, marginLeft: 4 }]}>{exam.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.tierBadge}>
            <Text style={[typography.small, { color: colors.textMuted }]}>
              Tier: {DIFFICULTY_MAP[selectedExam] || 'Mixed'}
            </Text>
          </View>
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.accentTeal, marginTop: spacing.md }]} onPress={() => startExamMode(selectedExam)}>
            <Text style={[typography.bodyBold, { color: colors.white }]}>Start {selectedExam} Mock</Text>
          </TouchableOpacity>
        </View>

        {mistakes.length > 0 && (
          <View style={styles.section}>
            <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>📓 Error Notebook ({mistakes.filter(m => !m.reviewed).length})</Text>
            {mistakes.filter(m => !m.reviewed).slice(0, 3).map((m) => (
              <View key={m.id} style={styles.mistakeCard}>
                <Text style={[typography.caption, { color: colors.text }]} numberOfLines={2}>{m.questionText}</Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
                  <Badge label={m.subject} color={colors.secondary} />
                  <Badge label="Pending Review" color={colors.warning} />
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  }

  if (!current) return null;

  const isCorrect = selectedAnswer === current.correctAnswer;

  return (
    <View style={styles.container}>
      <View style={styles.progressHeader}>
        <View style={styles.progressInfo}>
          <Text style={[typography.caption, { color: colors.textMuted }]}>Question {currentIndex + 1}/{currentQuestions.length}</Text>
          <Text style={[typography.small, { color: colors.textMuted }]}>Score: {score.correct}/{score.total}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Badge label={current.subject} color={colors.primaryLight} />
          <Badge label={current.difficulty} color={current.difficulty === 'easy' ? colors.accentGreen : current.difficulty === 'medium' ? colors.warning : colors.error} />
          {current.confidence && (
            <Badge
              label={`${current.confidence}%`}
              color={current.confidence >= 90 ? colors.success : current.confidence >= 75 ? colors.info : colors.warning}
            />
          )}
          {current.source && current.source !== 'syllabus' && (
            <Badge label={current.source === 'notes' ? 'From your notes' : current.source === 'current_affairs' ? 'News → MCQ' : 'AI'} color={colors.accentTeal} />
          )}
        </View>
      </View>
      <ProgressBar percent={((currentIndex + 1) / currentQuestions.length) * 100} color={colors.primary} />
      <Text style={[typography.h4, { color: colors.text, marginTop: spacing.xl, marginBottom: spacing.lg }]}>{current.text}</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {current.options.map((opt, i) => {
          let bgColor = colors.bgCard;
          let textColor = colors.text;
          let border = colors.border;
          if (isAnswered) {
            if (i === current.correctAnswer) { bgColor = colors.success + '20'; border = colors.success; textColor = colors.success; }
            else if (i === selectedAnswer && !isCorrect) { bgColor = colors.error + '20'; border = colors.error; textColor = colors.error; }
          } else if (selectedAnswer === i) {
            bgColor = colors.primary + '20'; border = colors.primary; textColor = colors.primary;
          }

          return (
            <TouchableOpacity
              key={i}
              style={[styles.option, { backgroundColor: bgColor, borderColor: border }]}
              onPress={() => selectAnswer(i)}
              disabled={isAnswered}
            >
              <Text style={[styles.optionText, { color: textColor }]}>{String.fromCharCode(65 + i)}. {opt}</Text>
            </TouchableOpacity>
          );
        })}

        {isAnswered && (
          <View style={[styles.explanation, { backgroundColor: isCorrect ? colors.success + '10' : colors.error + '10', borderColor: isCorrect ? colors.success + '30' : colors.error + '30' }]}>
            <Text style={[typography.bodyBold, { color: isCorrect ? colors.success : colors.error }]}>
              {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.sm }]}>{current.explanation}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md }}>
              {current.confidence && current.confidence < 80 && (
                <Text style={[typography.tiny, { color: colors.warning }]}>
                  ⚠ This question has {current.confidence}% confidence score. Verify with source material.
                </Text>
              )}
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
                onPress={() => reportQuestion(current.id)}
              >
                <Text style={{ fontSize: 12 }}>🚩</Text>
                <Text style={[typography.tiny, { color: colors.textMuted }]}>Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isAnswered && (
          <TouchableOpacity style={[styles.primaryBtn, { marginTop: spacing.lg, marginBottom: spacing.huge }]} onPress={nextQuestion}>
            <Text style={[typography.bodyBold, { color: colors.white }]}>
              {currentIndex < currentQuestions.length - 1 ? 'Next Question →' : 'See Results'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.huge, marginBottom: spacing.sm },
  progressInfo: {},
  option: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  optionText: { fontSize: 16, lineHeight: 24 },
  explanation: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  primaryBtn: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  section: {
    backgroundColor: colors.bgCard,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bgInput,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  examChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.bgInput,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  examChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '20' },
  mistakeCard: {
    backgroundColor: colors.bgInput,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  resultCard: {
    backgroundColor: colors.bgCard,
    padding: spacing.xxl,
    borderRadius: borderRadius.lg,
    marginTop: spacing.huge * 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
});
