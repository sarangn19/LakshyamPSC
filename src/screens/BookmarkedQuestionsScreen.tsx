import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, fontFamily } from '../theme';
import { typography } from '../theme/typography';
import { useMCQStore, useUserStore } from '../store';

export function BookmarkedQuestionsScreen({ navigation }: any) {
  const bookmarkedData = useMCQStore((s) => s.bookmarkedQuestionData);
  const bookmarkedIds = useMCQStore((s) => s.bookmarkedQuestions);
  const primaryExam = useUserStore((s) => s.primaryExam);

  const startBookmarkSession = (startId?: string) => {
    const ids = startId ? [startId] : bookmarkedIds;
    const questions = ids
      .map((id) => {
        const d = bookmarkedData[id];
        if (!d) return null;
        return {
          id,
          text: d.text,
          options: d.options,
          correctAnswer: d.correctAnswer,
          subject: d.subject,
          topic: d.topic,
          subtopic: d.subtopic,
          difficulty: 'medium' as const,
          explanation: d.explanation || '',
          examType: [primaryExam || 'LDC'],
          source: 'ai_generated' as const,
        };
      })
      .filter((q): q is NonNullable<typeof q> => q !== null);

    if (questions.length === 0) return;

    useMCQStore.getState().startCustomSession(questions, startId ? 0 : undefined);
    navigation.navigate('MCQ');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {Object.keys(bookmarkedData).length === 0 ? (
        <View style={styles.empty}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.sm }]}>No bookmarks yet</Text>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>Tap the bookmark icon on any question during practice to save it here.</Text>
        </View>
      ) : (
        <>
          {bookmarkedIds.length > 1 && (
            <TouchableOpacity style={styles.practiceAllBtn} onPress={() => startBookmarkSession()}>
              <Text style={styles.practiceAllText}>▶ Practice All ({bookmarkedIds.length})</Text>
            </TouchableOpacity>
          )}
          {bookmarkedIds.map((id) => {
            const q = bookmarkedData[id];
            if (!q) return null;
            return (
              <TouchableOpacity key={id} style={styles.card} onPress={() => startBookmarkSession(id)} activeOpacity={0.7}>
                <Text style={[typography.bodySmall, { color: colors.text }]} numberOfLines={3}>{q.text}</Text>
                <Text style={[typography.tiny, { color: colors.textMuted, marginTop: 4 }]}>{q.subject} › {q.topic}</Text>
                <Text style={[typography.tiny, { color: colors.primary, marginTop: 8 }]}>Tap to attempt →</Text>
              </TouchableOpacity>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  practiceAllBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  practiceAllText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
});
