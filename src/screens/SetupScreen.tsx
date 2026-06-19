import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { typography } from '../theme/typography';
import { useUserStore } from '../store';
import { examTypes } from '../data/questions';
import { useTranslation } from '../i18n/useTranslation';

const EXAM_ICONS: Record<string, string> = {
  'LDC': '📋',
  'Secretariat Assistant': '🏛️',
  'University Assistant': '🎓',
  'Police Constable': '🛡️',
  'Degree Level': '📚',
};

const EXAM_DESC_KEYS: Record<string, string> = {
  'LDC': 'examDescLDC',
  'Secretariat Assistant': 'examDescSecretariat',
  'University Assistant': 'examDescUniversity',
  'Police Constable': 'examDescPolice',
  'Degree Level': 'examDescDegree',
};

export function SetupScreen({ onComplete }: { onComplete: () => void }) {
  const { targetExams, primaryExam, examDate, toggleTargetExam, setPrimaryExam, setExamDate, completeSetup, setUserName } = useUserStore();
  const [name, setName] = useState('');
  const [step, setStep] = useState<'welcome' | 'exams' | 'primary' | 'date'>('welcome');
  const { t } = useTranslation();

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
          <Text style={[typography.h1, { color: colors.text, textAlign: 'center', marginTop: spacing.xl }]}>{t('setup.title')}</Text>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md, paddingHorizontal: spacing.xl }]}>
            {t('setup.subtitle')}
          </Text>
          <TouchableOpacity style={[styles.primaryBtn, { marginTop: spacing.huge }]} onPress={() => setStep('exams')}>
            <Text style={[typography.bodyBold, { color: '#fff' }]}>{t('setup.getStarted')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={{ fontSize: 32 }}>🎯</Text>
        <Text style={[typography.h2, { color: colors.text, marginTop: spacing.sm }]}>{t('setup.setupTitle')}</Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
          {step === 'exams' ? t('setup.step1of3') : step === 'primary' ? t('setup.step2of3') : t('setup.step3of3')}
        </Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: step === 'exams' ? '33%' : step === 'primary' ? '66%' : '100%' }]} />
      </View>

      {step === 'exams' && (
        <>
          <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.sm }]}>{t('setup.examsQuestion')}</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.lg }]}>{t('setup.examsHint')}</Text>

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
                    {t(`setup.${EXAM_DESC_KEYS[exam.name] || 'mixedDifficulty'}`)}
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
              <Text style={[typography.bodyBold, { color: '#fff' }]}>{t('common.continue')}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {step === 'primary' && (
        <>
          <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.sm }]}>{t('setup.primaryQuestion')}</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.lg }]}>{t('setup.primaryHint')}</Text>

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
                  {EXAM_DESC_KEYS[exam] ? t(`setup.${EXAM_DESC_KEYS[exam]}`) : ''}
                </Text>
              </View>
              {primaryExam === exam && (
                <Text style={{ fontSize: 20, color: colors.primary }}>✓</Text>
              )}
            </TouchableOpacity>
          ))}

          <View style={styles.stepActions}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep('exams')}>
              <Text style={[typography.body, { color: colors.textSecondary }]}>{t('common.back')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, !canContinuePrimary && styles.btnDisabled]}
              disabled={!canContinuePrimary}
              onPress={() => setStep('date')}
            >
              <Text style={[typography.bodyBold, { color: '#fff' }]}>{t('common.continue')}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {step === 'date' && (
        <>
          <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.sm }]}>{t('setup.almostDone')}</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.lg }]}>{t('setup.preferencesHint')}</Text>

          <Text style={[typography.captionBold, { color: colors.text, marginBottom: spacing.sm }]}>{t('setup.nameLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('setup.namePlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />

          <Text style={[typography.captionBold, { color: colors.text, marginBottom: spacing.sm, marginTop: spacing.lg }]}>{t('setup.examDateLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('setup.examDatePlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={examDate}
            onChangeText={setExamDate}
          />
          <Text style={[typography.tiny, { color: colors.textMuted, marginTop: spacing.xs }]}>
            {t('setup.dateHint')}
          </Text>

          <View style={styles.summaryCard}>
            <Text style={[typography.captionBold, { color: colors.text, marginBottom: spacing.sm }]}>{t('setup.yourSetup')}</Text>
            <View style={styles.summaryRow}>
              <Text style={[typography.small, { color: colors.textMuted }]}>{t('setup.targetExams')}</Text>
              <Text style={[typography.small, { color: colors.primaryLight }]}>{targetExams.join(', ')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[typography.small, { color: colors.textMuted }]}>{t('setup.primaryExam')}</Text>
              <Text style={[typography.small, { color: colors.primaryLight }]}>{primaryExam}</Text>
            </View>
            {examDate && (
              <View style={styles.summaryRow}>
                <Text style={[typography.small, { color: colors.textMuted }]}>{t('setup.examDate')}</Text>
                <Text style={[typography.small, { color: colors.primaryLight }]}>{examDate}</Text>
              </View>
            )}
          </View>

          <View style={styles.stepActions}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep('primary')}>
              <Text style={[typography.body, { color: colors.textSecondary }]}>{t('common.back')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, !allDone && styles.btnDisabled]}
              disabled={!allDone}
              onPress={handleFinish}
            >
              <Text style={[typography.bodyBold, { color: '#fff' }]}>{t('setup.startLearning')}</Text>
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
    height: 48,
    paddingHorizontal: spacing.lg,
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
    height: 48,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 140,
  },
  btnDisabled: { opacity: 0.4 },
  secondaryBtn: {
    height: 48,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
