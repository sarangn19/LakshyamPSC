import React, { useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, fontFamily } from '../theme';
import { typography } from '../theme/typography';
import { useFlashcardStore } from '../store';

export function FlashcardsScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const mode = route?.params?.mode || 'review';
  const {
    dueCards, currentCardIndex, isFlipped, reviewMode,
    loadDueCards, flipCard, rateCard,
    getDueCount, getMasteredCount, flashcards,
    practiceCards, practiceActive, nextPracticeCard, endPracticeSession,
  } = useFlashcardStore();

  useEffect(() => {
    if (mode === 'review') {
      loadDueCards();
    }
  }, [mode]);

  const dueCount = getDueCount();
  const masteredCount = getMasteredCount();
  const totalCards = flashcards.length;

  // Use practice cards if in practice mode, otherwise use due cards
  const currentCards = mode === 'practice' ? practiceCards : dueCards;
  const currentCard = currentCards[currentCardIndex];
  const isPracticeMode = mode === 'practice';

  if (isPracticeMode) {
    if (!currentCard && practiceCards.length > 0) {
      // Practice complete - all cards reviewed
      return (
        <View style={styles.container}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✓</Text>
            <Text style={styles.emptyTitle}>Practice complete</Text>
            <Text style={styles.emptyDesc}>
              You've reviewed all cards in this session
            </Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={() => { endPracticeSession(); navigation.goBack(); }} activeOpacity={0.8}>
              <Text style={styles.refreshBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    if (practiceCards.length === 0) {
      // No cards were generated
      return (
        <View style={styles.container}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⚠️</Text>
            <Text style={styles.emptyTitle}>No flashcards generated</Text>
            <Text style={styles.emptyDesc}>
              Could not generate flashcards from the content. Please try with different content.
            </Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={() => { endPracticeSession(); navigation.goBack(); }} activeOpacity={0.8}>
              <Text style={styles.refreshBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  } else {
    if (!reviewMode || !currentCard) {
      return (
        <View style={styles.container}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✓</Text>
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptyDesc}>
              {masteredCount}/{totalCards} cards mastered
            </Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={loadDueCards} activeOpacity={0.8}>
              <Text style={styles.refreshBtnText}>Refresh cards</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  }

  const handleNext = () => {
    if (isPracticeMode) {
      nextPracticeCard();
    } else {
      rateCard(5); // Default to easy for review mode
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <LinearGradient
        colors={['#FFFFFF', 'rgba(255, 255, 255, 0.317308)', 'rgba(255, 255, 255, 0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.topBar}
      >
        <Text style={styles.topBarCounter}>{currentCardIndex + 1} of {currentCards.length}</Text>
        {isPracticeMode && (
          <TouchableOpacity onPress={() => { endPracticeSession(); navigation.goBack(); }} activeOpacity={0.7}>
            <Text style={styles.endLink}>End practice</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      <TouchableOpacity style={styles.card} onPress={flipCard} activeOpacity={0.95}>
        {!isFlipped ? (
          <View style={styles.cardInner}>
            <Text style={styles.cardSideLabel}>Question</Text>
            <Text style={styles.cardText}>{currentCard.front}</Text>
            <Text style={styles.cardHint}>Tap to reveal answer</Text>
          </View>
        ) : (
          <View style={styles.cardInner}>
            <Text style={[styles.cardSideLabel, { color: colors.success }]}>Answer</Text>
            <Text style={styles.cardText}>{currentCard.back}</Text>
            <Text style={styles.cardHint}>Tap to flip back</Text>
          </View>
        )}
      </TouchableOpacity>

      {isFlipped && (
        <View style={styles.ratingArea}>
          {isPracticeMode ? (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.8}>
              <Text style={styles.nextBtnText}>Next Card</Text>
            </TouchableOpacity>
          ) : (
            <>
              <Text style={styles.ratingLabel}>How well did you know this?</Text>
              <View style={styles.ratingRow}>
                <TouchableOpacity
                  style={[styles.rateBtn, styles.rateBtnHard]}
                  onPress={() => rateCard(1)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.rateBtnHardText}>Hard</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.rateBtn, styles.rateBtnEasy]}
                  onPress={() => rateCard(5)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.rateBtnEasyText}>Easy</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.xl },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 21,
    paddingBottom: 57,
    paddingHorizontal: 24,
    height: 122,
  },
  topBarCounter: { fontSize: 13, fontWeight: '700', color: colors.textTertiary, fontFamily: fontFamily.bodyBold },
  endLink: { fontSize: 13, fontWeight: '600', color: colors.primary, fontFamily: fontFamily.bodyBold },

  card: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 320,
    justifyContent: 'center',
  },
  cardInner: { alignItems: 'center', padding: spacing.xl },
  cardSideLabel: { fontSize: 11, fontWeight: '700', color: colors.textTertiary, letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: fontFamily.bodyBold },
  cardText: { fontSize: 20, fontWeight: '600', color: colors.text, textAlign: 'center', lineHeight: 28, marginTop: spacing.lg, fontFamily: fontFamily.bodyMedium },
  cardHint: { fontSize: 11, color: colors.textTertiary, marginTop: spacing.xl },

  ratingArea: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  ratingLabel: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  ratingRow: { flexDirection: 'row', gap: spacing.sm },
  rateBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  rateBtnHard: { backgroundColor: colors.surface, borderColor: colors.border },
  rateBtnHardText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, fontFamily: fontFamily.bodyBold },
  rateBtnEasy: { backgroundColor: colors.primary, borderColor: colors.primary },
  rateBtnEasyText: { fontSize: 14, fontWeight: '700', color: colors.white, fontFamily: fontFamily.bodyBold },

  nextBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtnText: { fontSize: 14, fontWeight: '700', color: colors.white, fontFamily: fontFamily.bodyBold },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: { fontSize: 40, color: colors.primary, fontWeight: '300', fontFamily: fontFamily.bodyLight },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: spacing.md, fontFamily: fontFamily.bodyBold },
  emptyDesc: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.xs },
  refreshBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 48,
    paddingHorizontal: spacing.xxl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshBtnText: { fontSize: 14, fontWeight: '700', color: colors.white, fontFamily: fontFamily.bodyBold },
});
