import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, fontFamily } from '../theme';
import { typography } from '../theme/typography';
import { useMCQStore } from '../store';

export function BookmarkedQuestionsScreen({ navigation }: any) {
  const bookmarkedData = useMCQStore((s) => s.bookmarkedQuestionData);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {Object.keys(bookmarkedData).length === 0 ? (
        <View style={styles.empty}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.sm }]}>No bookmarks yet</Text>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>Tap the bookmark icon on any question during practice to save it here.</Text>
        </View>
      ) : (
        Object.entries(bookmarkedData).map(([id, q]) => (
          <View key={id} style={styles.card}>
            <Text style={[typography.bodySmall, { color: colors.text }]} numberOfLines={2}>{q.text}</Text>
            <Text style={[typography.tiny, { color: colors.textMuted, marginTop: 4 }]}>{q.subject} › {q.topic}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  card: { backgroundColor: colors.cardBg, borderRadius: 16, padding: spacing.md, marginBottom: spacing.sm },
});
