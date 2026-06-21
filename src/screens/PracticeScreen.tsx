import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from '../i18n/useTranslation';
import { colors, spacing, borderRadius } from '../theme';
import { typography } from '../theme/typography';
import { useMCQStore, useFlashcardStore } from '../store';
import { BottomNav } from '../components/BottomNav';

type PracticeCard = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  screen: string;
  count?: number;
  color: string;
};

export function PracticeScreen({ navigation }: any) {
  const { t } = useTranslation();
  const cardCount = useMCQStore((s) => s.score.total);
  const masteredCount = useFlashcardStore((s) => s.getMasteredCount());
  const dueCount = useFlashcardStore((s) => s.getDueCount());

  const cards: PracticeCard[] = [
    {
      id: 'pyq',
      title: 'PYQ Explorer',
      subtitle: 'Browse 17K previous year questions from 114 exams',
      icon: '📜',
      screen: 'PYQExplorer',
      color: colors.warning || '#E67E22',
    },
    {
      id: 'high_yield',
      title: 'High Yield Practice',
      subtitle: '70% weak areas · 30% high-frequency PSC topics',
      icon: '🎯',
      screen: 'HighYieldPractice',
      color: '#FF5722',
    },
    {
      id: 'topic_intel',
      title: 'Topic Intelligence',
      subtitle: 'Yield scores, mastery status, and trends per topic',
      icon: '🧠',
      screen: 'TopicIntelligence',
      color: colors.accent,
    },
    {
      id: 'impact',
      title: 'Impact Dashboard',
      subtitle: 'How recommendations improve your learning outcomes',
      icon: '📊',
      screen: 'ImpactDashboard',
      color: '#9C27B0',
    },
    {
      id: 'corpus_health',
      title: 'Corpus Health',
      subtitle: 'Coverage stats: answers, options, topics, duplicates',
      icon: '💊',
      screen: 'CorpusHealth',
      color: colors.info,
    },
    {
      id: 'mcq',
      title: 'MCQ Practice',
      subtitle: 'Adaptive questions tailored to your weak areas',
      icon: '📝',
      screen: 'MCQ',
      count: cardCount,
      color: colors.primary,
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      subtitle: 'Spaced repetition for long-term retention',
      icon: '🃏',
      screen: 'Flashcards',
      count: dueCount,
      color: colors.accent,
    },
    {
      id: 'bookmarks',
      title: 'Bookmarked Questions',
      subtitle: 'Review questions you saved for later',
      icon: '🔖',
      screen: 'Bookmarks',
      color: colors.info,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={[typography.h2, { color: colors.text, paddingTop: spacing.md }]}>Practice</Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg }]}>
          Strengthen your knowledge with targeted practice
        </Text>

        {cards.map((card) => (
          <TouchableOpacity
            key={card.id}
            style={[styles.card, { borderLeftColor: card.color, borderLeftWidth: 4 }]}
            onPress={() => navigation.navigate(card.screen)}
            activeOpacity={0.7}
          >
            <View style={styles.cardRow}>
              <View style={[styles.cardIcon, { backgroundColor: card.color + '15' }]}>
                <Text style={{ fontSize: 28 }}>{card.icon}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={[typography.bodyBold, { color: colors.text }]}>{card.title}</Text>
                <Text style={[typography.small, { color: colors.textSecondary, marginTop: 2 }]}>{card.subtitle}</Text>
              </View>
              {card.count !== undefined && card.count > 0 && (
                <View style={[styles.countBadge, { backgroundColor: card.color }]}>
                  <Text style={[typography.tiny, { color: '#fff', fontWeight: '700' }]}>{card.count}</Text>
                </View>
              )}
            </View>
            <View style={styles.arrowRow}>
              <Text style={[typography.tiny, { color: card.color, fontWeight: '600' }]}>Start →</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <BottomNav activeTab="Practice" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 100 },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  countBadge: {
    minWidth: 24, height: 24, borderRadius: 12,
    paddingHorizontal: spacing.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  arrowRow: { alignItems: 'flex-end', marginTop: spacing.sm },
});
