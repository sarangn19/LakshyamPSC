import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontFamily } from '../theme';
import { useMCQStore, useUserStore, usePerformanceStore } from '../store';
import { reportQuestionToBackend } from '../services/adminDataService';
import { LoadingAnimation } from '../components/common/LoadingAnimation';
import { getConfidenceLabel, ConfidenceLevel } from '../services/confidenceCalibration';
import { useTranslation } from '../i18n/useTranslation';

const FlagIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <Path d="M3 14V2M3 2L12 5L3 8" stroke={colors.error} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export function MCQEngineScreen({ route, navigation }: any) {
  const { t, locale, setLocale, typography: tx, fontFamily } = useTranslation();
  const {
    currentQuestions, currentIndex, selectedAnswer, isAnswered, score,
    sessionActive, startDailyDrill, selectAnswer,
    nextQuestion, endSession,
    reportQuestionWithReason, questionReports, lastSessionOutcome,
    isGenerating, generatingNext,
  } = useMCQStore();
  const { targetExams } = useUserStore();
  const [reported, setReported] = useState<string | null>(null);
  const [selectedConfidence, setSelectedConfidence] = useState<ConfidenceLevel | null>(null);

  const handleNext = () => {
    setSelectedConfidence(null);
    nextQuestion();
  };

  const handleConfidenceSelect = (level: ConfidenceLevel) => {
    if (selectedConfidence) return;
    setSelectedConfidence(level);
    const perf = usePerformanceStore.getState();
    perf.addConfidenceRecord({
      questionId: current?.id ?? '',
      subject: current?.subject ?? '',
      topic: current?.topic ?? '',
      confidenceLevel: level,
      wasCorrect: isCorrect,
    });
  };

  const handleReport = (id: string, reason: string) => {
    if (reported === id) return;
    reportQuestionWithReason(id, reason);
    reportQuestionToBackend(id, reason);
    setReported(id);
  };

  const mode = route?.params?.mode || 'daily';

  useEffect(() => {
    if (sessionActive) return;
    if (currentQuestions.length > 0) return;

    if (mode === 'daily') startDailyDrill(targetExams);
    else if (mode === 'weakness') useMCQStore.getState().startWeaknessPractice(targetExams);
    else if (mode === 'exam') useMCQStore.getState().startExamMode(route?.params?.exam);
  }, [mode, sessionActive, currentQuestions.length]);

  // Navigate to PostSession when practice session ends
  useEffect(() => {
    if (!sessionActive && lastSessionOutcome && mode === 'practice' && score.total > 0) {
      navigation.navigate('PostSession');
    }
  }, [sessionActive, lastSessionOutcome, mode, score.total]);

  const current = currentQuestions[currentIndex];
  console.log('[TRACE:6] MCQ screen render', {
    questionId: current?.id || 'none', currentIndex,
    currentQuestionsLen: currentQuestions.length, sessionActive,
    generatingNext, isGenerating, isAnswered, hasCurrent: !!current,
  });

  if (isGenerating && !current) {
    console.log('[TRACE:6b] Render path: initial loading (isGenerating + no current)');
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#FFFFFF', 'rgba(255, 255, 255, 0.317308)', 'rgba(255, 255, 255, 0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.topBar}
        >
          <Text style={styles.topBarCounter}>Q{score.total + 1}</Text>
          <TouchableOpacity onPress={() => { endSession(); navigation.goBack(); }} activeOpacity={0.7}>
            <Text style={styles.endLink}>{t('mcqEngine.endPractice')}</Text>
          </TouchableOpacity>
        </LinearGradient>
        <LoadingAnimation message={t('mcqEngine.generatingQuestion')} subMessage={t('mcqEngine.generatingQuestionSub')} />
      </View>
    );
  }

  if (!current) {
    console.log('[TRACE:6c] Render path: no current — error screen', {
      sessionActive, lastSessionOutcome: !!lastSessionOutcome, mode, scoreTotal: score.total,
    });
    // If practice session ended, don't show error screen
    if (!sessionActive && lastSessionOutcome && mode === 'practice') {
      return null; // Navigation will happen in useEffect
    }
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#FFFFFF', 'rgba(255, 255, 255, 0.317308)', 'rgba(255, 255, 255, 0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.topBar}
        >
          <Text style={styles.topBarCounter}>Q{score.total + 1}</Text>
          <TouchableOpacity onPress={() => { endSession(); navigation.goBack(); }} activeOpacity={0.7}>
            <Text style={styles.endLink}>{t('mcqEngine.endPractice')}</Text>
          </TouchableOpacity>
        </LinearGradient>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 19, color: colors.textSecondary, fontFamily: fontFamily.body, textAlign: 'center', marginBottom: 8 }}>
            {t('mcqEngine.aiNotAvailable')}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, fontFamily: fontFamily.body, textAlign: 'center', marginBottom: 24, opacity: 0.7 }}>
            {t('mcqEngine.couldNotGenerate')}
          </Text>
          <TouchableOpacity
            onPress={() => { endSession(); navigation.goBack(); }}
            style={{ backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 }}
          >
            <Text style={{ color: '#fff', fontFamily: fontFamily.body, fontSize: 15 }}>{t('mcqEngine.goBack')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isCorrect = selectedAnswer === current.correctAnswer;
  console.log('[TRACE:7] Rendered question', {
    questionId: current.id, text: current.text?.slice(0, 50),
    isAnswered, generatingNext, hasOverlay: generatingNext && current !== undefined,
  });

  const handleEnd = () => {
    endSession();
    const s = useMCQStore.getState();
    if (s.score.total > 0) {
      navigation.navigate('PostSession');
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      {generatingNext && (
        <LoadingAnimation message={t('mcqEngine.gettingNextQuestion')} size="small" />
      )}
      <LinearGradient
        colors={['#FFFFFF', 'rgba(255, 255, 255, 0.317308)', 'rgba(255, 255, 255, 0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.topBar}
      >
        <Text style={styles.topBarCounter}>Q{score.total + 1}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {current && (
            <>
              <TouchableOpacity
                onPress={() => useMCQStore.getState().toggleBookmark(current.id)}
                activeOpacity={0.6}
                style={{ padding: 4 }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>{useMCQStore.getState().bookmarkedQuestions.includes(current.id) ? t('mcqEngine.saved') : t('mcqEngine.save')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (reported === current.id) return;
                  Alert.alert(t('mcqEngine.reportQuestion'), t('mcqEngine.whatIsTheIssue'), [
                  { text: t('common.cancel'), style: 'cancel' },
                  { text: t('mcqEngine.wrongAnswer'), onPress: () => handleReport(current.id, 'wrong_answer_key') },
                  { text: t('mcqEngine.badExplanation'), onPress: () => handleReport(current.id, 'bad_explanation') },
                  { text: t('mcqEngine.otherIssue'), onPress: () => handleReport(current.id, 'other') },
                ]);
              }}
              activeOpacity={0.6}
              style={{ padding: 4 }}
            >
              <View style={{ opacity: reported === current?.id ? 0.4 : 1 }}><FlagIcon /></View>
            </TouchableOpacity>
            </>
          )}
          <TouchableOpacity onPress={handleEnd} activeOpacity={0.7}>
            <Text style={styles.endLink}>{t('mcqEngine.endPractice')}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      {current && (
        <View style={styles.focusBanner}>
          <Text style={styles.focusLabel}>{current.subject}</Text>
          <Text style={styles.focusValue}>{current.topic}</Text>
        </View>
      )}

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.question}>{current.text}</Text>

        <View style={styles.optionsList}>
          {current.options.map((opt, i) => {
            let bgStyle = {};
            if (isAnswered) {
              if (i === current.correctAnswer) bgStyle = styles.optionCorrect;
              else if (i === selectedAnswer && !isCorrect) bgStyle = styles.optionWrong;
              else bgStyle = styles.optionMuted;
            } else if (selectedAnswer === i) {
              bgStyle = styles.optionSelected;
            }
            const textColor = isAnswered && i === current.correctAnswer ? colors.success
              : isAnswered && i === selectedAnswer && !isCorrect ? colors.error
              : selectedAnswer === i ? colors.primary
              : colors.textSecondary;

            return (
              <TouchableOpacity
                key={i}
                style={[styles.option, bgStyle]}
                onPress={() => selectAnswer(i)}
                disabled={isAnswered}
                activeOpacity={0.9}
              >
                <Text style={[styles.optionLetter, { color: textColor }]}>{String.fromCharCode(65 + i)}</Text>
                <Text style={[styles.optionText, { color: textColor }]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isAnswered && (
          <View style={styles.explanationCard}>
            <Text style={[styles.explanationStatus, { color: isCorrect ? colors.success : colors.error }]}>
              {isCorrect ? t('mcqEngine.correct') : t('mcqEngine.incorrect')}
            </Text>
            <Text style={styles.explanationText}>{current.explanation}</Text>
            <TouchableOpacity
              style={styles.reportBtn}
              onPress={() => {
                if (reported === current.id) return;
                Alert.alert(t('mcqEngine.reportQuestion'), t('mcqEngine.whatIsTheIssue'), [
                  { text: t('common.cancel'), style: 'cancel' },
                  { text: t('mcqEngine.wrongAnswer'), onPress: () => handleReport(current.id, 'wrong_answer_key') },
                  { text: t('mcqEngine.badExplanation'), onPress: () => handleReport(current.id, 'bad_explanation') },
                  { text: t('mcqEngine.otherIssue'), onPress: () => handleReport(current.id, 'other') },
                ]);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.reportBtnText, reported === current.id && styles.reportBtnDone]}>
                {reported === current.id ? t('mcqEngine.reported') : t('mcqEngine.reportIncorrect')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isAnswered && (
          <View style={styles.confidenceSection}>
            <Text style={styles.confidenceLabel}>{t('mcqEngine.howSure')}</Text>
            <View style={styles.confidenceRow}>
              {([1, 2, 3, 4] as ConfidenceLevel[]).map((level) => {
                const active = selectedConfidence === level;
                return (
                  <TouchableOpacity
                    key={level}
                    style={[styles.confidenceBtn, active && styles.confidenceBtnActive]}
                    onPress={() => handleConfidenceSelect(level)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.confidenceBtnText, active && styles.confidenceBtnTextActive]}>
                      {getConfidenceLabel(level)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {isAnswered && (
        <View style={styles.bottomBar}>
          {currentIndex < currentQuestions.length - 1 ? (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.9}>
              <Text style={styles.nextBtnText}>{t('mcqEngine.nextQuestion')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.9}>
              <Text style={styles.nextBtnText}>{t('mcqEngine.finish')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  topBarCounter: { fontSize: 13, fontWeight: '700', color: colors.textTertiary, fontFamily: fontFamily.bodyBold },
  endLink: { fontSize: 13, fontWeight: '600', color: colors.error, fontFamily: fontFamily.bodyMedium },

  focusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 6,
    backgroundColor: colors.primaryLight + '20',
    gap: 8,
  },
  focusLabel: { fontSize: 11, fontWeight: '700', color: colors.textTertiary, fontFamily: fontFamily.bodyBold, letterSpacing: 0.3, textTransform: 'uppercase' },
  focusValue: { fontSize: 13, fontWeight: '600', color: colors.primary, fontFamily: fontFamily.bodyMedium },

  fallbackBanner: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: '#FFF3CD',
  },
  fallbackText: { fontSize: 12, color: '#856404', fontFamily: fontFamily.body, lineHeight: 16 },

  scrollArea: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 24 },

  question: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: fontFamily.bodyMedium,
    color: colors.text,
    lineHeight: 26,
    marginTop: 20,
    marginBottom: 20,
  },

  optionsList: { gap: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 12,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight + '40' },
  optionCorrect: { borderColor: colors.success, backgroundColor: '#F0FDF4' },
  optionWrong: { borderColor: colors.error, backgroundColor: '#FEF2F2' },
  optionMuted: { opacity: 0.4 },
  optionLetter: { fontSize: 14, fontWeight: '800', fontFamily: fontFamily.bodyBold, width: 20, textAlign: 'center' },
  optionText: { fontSize: 15, fontWeight: '500', fontFamily: fontFamily.body, lineHeight: 22, flex: 1 },

  explanationCard: {
    marginTop: 16,
    padding: 24,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  explanationStatus: { fontSize: 14, fontWeight: '700', fontFamily: fontFamily.bodyBold },
  explanationText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginTop: 8 },

  bottomBar: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    paddingBottom: 32,
    backgroundColor: colors.background,
  },
  nextBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtnText: { fontSize: 14, fontWeight: '700', color: colors.white, fontFamily: fontFamily.bodyBold },

  reportBtn: { marginTop: 16, paddingVertical: 8, alignSelf: 'flex-start' },
  reportBtnText: { fontSize: 12, fontWeight: '500', color: colors.error, fontFamily: fontFamily.body, textDecorationLine: 'underline' },
  reportBtnDone: { color: colors.textTertiary, textDecorationLine: 'none' },

  confidenceSection: {
    marginTop: 16,
    paddingHorizontal: 4,
  },
  confidenceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: fontFamily.bodyMedium,
    marginBottom: 8,
  },
  confidenceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  confidenceBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard,
  },
  confidenceBtnActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  confidenceBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: fontFamily.bodyMedium,
  },
  confidenceBtnTextActive: {
    color: colors.primary,
  },
});
