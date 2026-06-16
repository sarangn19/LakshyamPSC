import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { typography } from '../theme/typography';
import { useFlashcardStore } from '../store';
import { Badge, ProgressBar } from '../components/common/StyledComponents';

export function FlashcardsScreen({ navigation }: any) {
  const {
    dueCards, currentCardIndex, isFlipped, reviewMode,
    loadDueCards, flipCard, rateCard,
    getDueCount, getMasteredCount, flashcards,
  } = useFlashcardStore();

  useEffect(() => { loadDueCards(); }, []);

  const dueCount = getDueCount();
  const masteredCount = getMasteredCount();
  const totalCards = flashcards.length;
  const currentCard = dueCards[currentCardIndex];

  if (!reviewMode || !currentCard) {
    return (
      <View style={styles.container}>
        <Text style={[typography.h2, { color: colors.text, paddingTop: spacing.md }]}>AI Flashcards</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[typography.h2, { color: colors.info }]}>{dueCount}</Text>
            <Text style={[typography.small, { color: colors.textMuted }]}>Due Now</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[typography.h2, { color: colors.accentGreen }]}>{masteredCount}</Text>
            <Text style={[typography.small, { color: colors.textMuted }]}>Mastered</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[typography.h2, { color: colors.primary }]}>{totalCards}</Text>
            <Text style={[typography.small, { color: colors.textMuted }]}>Total</Text>
          </View>
        </View>

        <View style={styles.reviewCard}>
          <Text style={[typography.bodyBold, { color: colors.text, textAlign: 'center' }]}>All caught up! 🎉</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm }]}>
            {masteredCount}/{totalCards} cards mastered
          </Text>
          <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary, marginTop: spacing.xl }]} onPress={loadDueCards}>
            <Text style={[typography.bodyBold, { color: colors.white }]}>Refresh Cards</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[typography.h2, { color: colors.text }]}>Flashcards</Text>
        <Badge label={`${dueCards.length - currentCardIndex} left`} color={colors.primary} />
      </View>
      <ProgressBar percent={((currentCardIndex + 1) / dueCards.length) * 100} color={colors.primary} />

      <TouchableOpacity style={styles.card} onPress={flipCard} activeOpacity={0.9}>
        <View style={styles.cardMeta}>
          <Badge label={currentCard.subject} color={colors.primaryLight} />
          <Text style={[typography.small, { color: colors.textMuted }]}>Tap to flip</Text>
        </View>
        {!isFlipped ? (
          <View style={styles.cardContent}>
            <Text style={[typography.small, { color: colors.textMuted, marginBottom: spacing.md }]}>FRONT</Text>
            <Text style={[typography.h3, { color: colors.text, textAlign: 'center' }]}>{currentCard.front}</Text>
          </View>
        ) : (
          <View style={styles.cardContent}>
            <Text style={[typography.small, { color: colors.accentGreen, marginBottom: spacing.md }]}>BACK</Text>
            <Text style={[typography.h4, { color: colors.text, textAlign: 'center' }]}>{currentCard.back}</Text>
          </View>
        )}
      </TouchableOpacity>

      {isFlipped && (
        <View style={styles.ratingRow}>
          <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.sm }]}>
            How well did you remember?
          </Text>
          <View style={styles.ratingBtns}>
            <TouchableOpacity style={[styles.rateBtn, { backgroundColor: colors.error + '20', borderColor: colors.error }]} onPress={() => rateCard(1)}>
              <Text style={[typography.bodyBold, { color: colors.error }]}>Hard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.rateBtn, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]} onPress={() => rateCard(3)}>
              <Text style={[typography.bodyBold, { color: colors.warning }]}>Good</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.rateBtn, { backgroundColor: colors.accentGreen + '20', borderColor: colors.accentGreen }]} onPress={() => rateCard(5)}>
              <Text style={[typography.bodyBold, { color: colors.accentGreen }]}>Easy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.huge, paddingBottom: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl, marginBottom: spacing.xxl },
  statBox: {
    flex: 1,
    backgroundColor: colors.bgCard,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewCard: {
    backgroundColor: colors.bgCard,
    padding: spacing.xxl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btn: { paddingVertical: spacing.md, paddingHorizontal: spacing.xxl, borderRadius: borderRadius.md, alignItems: 'center' },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    marginTop: spacing.lg,
    minHeight: 280,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  cardContent: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  ratingRow: { marginTop: spacing.xl, marginBottom: spacing.huge },
  ratingBtns: { flexDirection: 'row', gap: spacing.sm },
  rateBtn: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
});
