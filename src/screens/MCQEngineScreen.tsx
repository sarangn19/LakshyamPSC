import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontFamily } from '../theme';
import { useMCQStore, useUserStore } from '../store';
import { LoadingAnimation } from '../components/common/LoadingAnimation';

export function MCQEngineScreen({ route, navigation }: any) {
  const {
    currentQuestions, currentIndex, selectedAnswer, isAnswered, score,
    sessionActive, startDailyDrill, selectAnswer,
    nextQuestion, endSession, recommendedSubject, recommendedTopic,
    reportQuestionWithReason, questionReports, lastSessionOutcome,
    isGenerating, generatingNext,
  } = useMCQStore();
  const { targetExams } = useUserStore();
  const [reported, setReported] = useState<string | null>(null);

  const mode = route?.params?.mode || 'daily';

  useEffect(() => {
    // Don't regenerate if practice session is already active
    if (sessionActive && mode === 'practice') return;

    if (mode === 'daily') startDailyDrill(targetExams);
    else if (mode === 'weakness') useMCQStore.getState().startWeaknessPractice(targetExams);
    else if (mode === 'exam') useMCQStore.getState().startExamMode(route?.params?.exam);
  }, [mode, sessionActive]);

  // Navigate to PostSession when practice session ends
  useEffect(() => {
    if (!sessionActive && lastSessionOutcome && mode === 'practice' && score.total > 0) {
      navigation.navigate('PostSession');
    }
  }, [sessionActive, lastSessionOutcome, mode, score.total]);

  const current = currentQuestions[currentIndex];

  if (isGenerating && !current) {
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
            <Text style={styles.endLink}>End practice</Text>
          </TouchableOpacity>
        </LinearGradient>
        <LoadingAnimation message="Generating question..." subMessage="Please wait while AI prepares your question" />
      </View>
    );
  }

  if (!current) {
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
            <Text style={styles.endLink}>End practice</Text>
          </TouchableOpacity>
        </LinearGradient>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 19, color: colors.textSecondary, fontFamily: fontFamily.body, textAlign: 'center', marginBottom: 8 }}>
            AI service not available
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, fontFamily: fontFamily.body, textAlign: 'center', marginBottom: 24, opacity: 0.7 }}>
            Could not generate questions. Please check your internet connection and try again later.
          </Text>
          <TouchableOpacity
            onPress={() => { endSession(); navigation.goBack(); }}
            style={{ backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 }}
          >
            <Text style={{ color: '#fff', fontFamily: fontFamily.body, fontSize: 15 }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isCorrect = selectedAnswer === current.correctAnswer;

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
        <LoadingAnimation message="Getting next question..." size="small" />
      )}
      <LinearGradient
        colors={['#FFFFFF', 'rgba(255, 255, 255, 0.317308)', 'rgba(255, 255, 255, 0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.topBar}
      >
        <Text style={styles.topBarCounter}>Q{score.total + 1}</Text>
        <TouchableOpacity onPress={handleEnd} activeOpacity={0.7}>
          <Text style={styles.endLink}>End practice</Text>
        </TouchableOpacity>
      </LinearGradient>
      {(recommendedSubject || recommendedTopic) && (
        <View style={styles.focusBanner}>
          <Text style={styles.focusLabel}>Recommended Focus</Text>
          <Text style={styles.focusValue}>{recommendedTopic || recommendedSubject}</Text>
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
              {isCorrect ? 'Correct' : 'Incorrect'}
            </Text>
            <Text style={styles.explanationText}>{current.explanation}</Text>
            <TouchableOpacity
              style={styles.reportBtn}
              onPress={() => {
                if (reported === current.id) return;
                Alert.alert(
                  'Report Incorrect Question',
                  'Is there an issue with this question?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Wrong answer',
                      onPress: () => {
                        reportQuestionWithReason(current.id, 'wrong_answer_key');
                        setReported(current.id);
                      },
                    },
                    {
                      text: 'Bad explanation',
                      onPress: () => {
                        reportQuestionWithReason(current.id, 'bad_explanation');
                        setReported(current.id);
                      },
                    },
                    {
                      text: 'Other issue',
                      onPress: () => {
                        reportQuestionWithReason(current.id, 'other');
                        setReported(current.id);
                      },
                    },
                  ],
                );
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.reportBtnText, reported === current.id && styles.reportBtnDone]}>
                {reported === current.id ? 'Reported' : 'Report Incorrect Question'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {isAnswered && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.nextBtn} onPress={nextQuestion} activeOpacity={0.9}>
            <Text style={styles.nextBtnText}>Next question</Text>
          </TouchableOpacity>
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
});
