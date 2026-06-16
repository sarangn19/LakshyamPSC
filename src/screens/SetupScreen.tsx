import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { typography } from '../theme/typography';
import { useUserStore } from '../store';
import { examTypes } from '../data/questions';

const EXAM_ICONS: Record<string, string> = {
  'LDC': '📋',
  'Secretariat Assistant': '🏛️',
  'University Assistant': '🎓',
  'Police Constable': '🛡️',
  'Degree Level': '📚',
};

const EXAM_DESCRIPTIONS: Record<string, string> = {
  'LDC': '10th Level • Easy',
  'Secretariat Assistant': '12th Level • Easy-Medium',
  'University Assistant': 'Degree Level • All Difficulties',
  'Police Constable': '10th Level + Law • Easy-Medium',
  'Degree Level': 'Deep Conceptual • All Difficulties',
};

export function SetupScreen({ onComplete }: { onComplete: () => void }) {
  const { targetExams, primaryExam, examDate, toggleTargetExam, setPrimaryExam, setExamDate, completeSetup, setUserName } = useUserStore();
  const [name, setName] = useState('');
  const [step, setStep] = useState<'welcome' | 'exams' | 'primary' | 'date'>('welcome');

  const canContinueExams = targetExams.length > 0;
  const canContinuePrimary = primaryExam !== '';
  const allDone = targetExams.length > 0 && primaryExam !== '';

  const handleFinish = () => {
    if (!allDone) return;
    if (name.trim()) setUserName(name.trim());
    if (examDate) setExamDate(examDate);
    completeSetup();
    onComplete();
  };

  if (step === 'welcome') {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={{ fontSize: 64, textAlign: 'center' }}>🎯</Text>
          <Text style={[typography.h1, { color: colors.text, textAlign: 'center', marginTop: spacing.xl }]}>Lakshyam</Text>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md, paddingHorizontal: spacing.xl }]}>
            Your personal AI-powered learning assistant for Kerala PSC exams.
            Let's set up your study plan in 3 steps.
          </Text>
          <TouchableOpacity style={[styles.primaryBtn, { marginTop: spacing.huge }]} onPress={() => setStep('exams')}>
            <Text style={[typography.bodyBold, { color: '#fff' }]}>Get Started →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={{ fontSize: 32 }}>🎯</Text>
        <Text style={[typography.h2, { color: colors.text, marginTop: spacing.sm }]}>Set Up Lakshyam</Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
          Step {step === 'exams' ? '1' : step === 'primary' ? '2' : '3'} of 3
        </Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: step === 'exams' ? '33%' : step === 'primary' ? '66%' : '100%' }]} />
      </View>

      {step === 'exams' && (
        <>
          <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.sm }]}>What exams are you preparing for?</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.lg }]}>Select one or more target posts</Text>

          {examTypes.map((exam) => {
            const selected = targetExams.includes(exam.name);
            return (
              <TouchableOpacity
                key={exam.id}
                style={[styles.examCard, selected && styles.examCardSelected]}
                onPress={() => toggleTargetExam(exam.name)}
                activeOpacity={0.8}
              >
                <View style={styles.checkbox}>
                  {selected && <View style={styles.checkboxFill} />}
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={[typography.body, { color: colors.text }]}>
                    {EXAM_ICONS[exam.name] || '📌'} {exam.name}
                  </Text>
                  <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                    {EXAM_DESCRIPTIONS[exam.name] || 'Mixed difficulty'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={styles.stepActions}>
            <TouchableOpacity
              style={[styles.primaryBtn, !canContinueExams && styles.btnDisabled]}
              disabled={!canContinueExams}
              onPress={() => {
                if (!primaryExam || !targetExams.includes(primaryExam)) {
                  setPrimaryExam(targetExams[0]);
                }
                setStep('primary');
              }}
            >
              <Text style={[typography.bodyBold, { color: '#fff' }]}>Continue →</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {step === 'primary' && (
        <>
          <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.sm }]}>Which is your primary exam?</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.lg }]}>This will set the default difficulty tier</Text>

          {targetExams.map((exam) => (
            <TouchableOpacity
              key={exam}
              style={[styles.primaryCard, primaryExam === exam && styles.primaryCardSelected]}
              onPress={() => setPrimaryExam(exam)}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 24 }}>{EXAM_ICONS[exam] || '📌'}</Text>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={[typography.body, { color: colors.text }]}>{exam}</Text>
                <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                  {EXAM_DESCRIPTIONS[exam] || ''}
                </Text>
              </View>
              {primaryExam === exam && (
                <Text style={{ fontSize: 20, color: colors.primary }}>✓</Text>
              )}
            </TouchableOpacity>
          ))}

          <View style={styles.stepActions}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep('exams')}>
              <Text style={[typography.body, { color: colors.textSecondary }]}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, !canContinuePrimary && styles.btnDisabled]}
              disabled={!canContinuePrimary}
              onPress={() => setStep('date')}
            >
              <Text style={[typography.bodyBold, { color: '#fff' }]}>Continue →</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {step === 'date' && (
        <>
          <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.sm }]}>Almost done!</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.lg }]}>Set your preferences</Text>

          <Text style={[typography.captionBold, { color: colors.text, marginBottom: spacing.sm }]}>Your name (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />

          <Text style={[typography.captionBold, { color: colors.text, marginBottom: spacing.sm, marginTop: spacing.lg }]}>Target exam date (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD (e.g. 2026-09-15)"
            placeholderTextColor={colors.textMuted}
            value={examDate}
            onChangeText={setExamDate}
          />
          <Text style={[typography.tiny, { color: colors.textMuted, marginTop: spacing.xs }]}>
            Used to calculate study timeline and practice intensity
          </Text>

          <View style={styles.summaryCard}>
            <Text style={[typography.captionBold, { color: colors.text, marginBottom: spacing.sm }]}>Your Setup</Text>
            <View style={styles.summaryRow}>
              <Text style={[typography.small, { color: colors.textMuted }]}>Target exams:</Text>
              <Text style={[typography.small, { color: colors.primaryLight }]}>{targetExams.join(', ')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[typography.small, { color: colors.textMuted }]}>Primary exam:</Text>
              <Text style={[typography.small, { color: colors.primaryLight }]}>{primaryExam}</Text>
            </View>
            {examDate && (
              <View style={styles.summaryRow}>
                <Text style={[typography.small, { color: colors.textMuted }]}>Exam date:</Text>
                <Text style={[typography.small, { color: colors.primaryLight }]}>{examDate}</Text>
              </View>
            )}
          </View>

          <View style={styles.stepActions}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep('primary')}>
              <Text style={[typography.body, { color: colors.textSecondary }]}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, !allDone && styles.btnDisabled]}
              disabled={!allDone}
              onPress={handleFinish}
            >
              <Text style={[typography.bodyBold, { color: '#fff' }]}>Start Learning 🚀</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: spacing.huge * 2 },
  header: { paddingTop: spacing.huge, alignItems: 'center', marginBottom: spacing.lg },
  progressBar: {
    height: 4,
    backgroundColor: colors.bgCard,
    borderRadius: 2,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  examCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  examCardSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxFill: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  primaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  primaryCardSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  input: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    color: colors.text,
    fontSize: 16,
  },
  summaryCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  stepActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    minWidth: 140,
  },
  btnDisabled: { opacity: 0.4 },
  secondaryBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
