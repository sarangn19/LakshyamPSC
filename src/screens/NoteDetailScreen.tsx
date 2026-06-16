import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { typography } from '../theme/typography';
import { useKnowledgeStore, useMCQStore, useFlashcardStore } from '../store';
import { generateFlashcardsFromNote } from '../services/aiFlashcardGenerator';

export function NoteDetailScreen({ route, navigation }: any) {
  const { noteId } = route.params;
  const note = useKnowledgeStore((s) => s.notes.find((n) => n.id === noteId));

  if (!note) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[typography.caption, { color: colors.textMuted }]}>Note not found</Text>
      </View>
    );
  }

  const handleGenerateMCQs = () => {
    useMCQStore.getState().startOrchestratedSession({
      subjects: [note.subject],
      difficulty: 'medium',
      count: 10,
      sessionType: 'weakness_practice',
    });
    navigation.navigate('MCQ');
  };

  const handleGenerateFlashcards = () => {
    const cards = generateFlashcardsFromNote(note, 5);
    if (cards.length === 0) {
      Alert.alert('No flashcards', 'Could not extract flashcards from this note. Try a longer note.');
      return;
    }
    useFlashcardStore.getState().addFlashcards(cards);
    navigation.navigate('Flashcards');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.subjectRow}>
        <View style={[styles.subjectBadge, { backgroundColor: (colors as any)[note.subject] ? (colors as any)[note.subject] + '20' : colors.primary + '20' }]}>
          <Text style={[typography.small, { color: colors.primary }]}>{note.subject}</Text>
        </View>
        <Text style={[typography.small, { color: colors.textMuted }]}>
          {new Date(note.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <Text style={[typography.h2, { color: colors.text, marginTop: spacing.md }]}>{note.title}</Text>

      <View style={styles.divider} />

      <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 24 }]}>{note.content}</Text>

      {note.tags.length > 0 && (
        <View style={styles.tags}>
          {note.tags.map((tag) => (
            <Text key={tag} style={[typography.small, { color: colors.textMuted, marginRight: spacing.sm }]}>#{tag}</Text>
          ))}
        </View>
      )}

      <View style={styles.divider} />

      <Text style={[typography.captionBold, { color: colors.textSecondary, marginBottom: spacing.md }]}>Generate from this note</Text>

      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.accentGreen + '20', borderColor: colors.accentGreen }]} onPress={handleGenerateMCQs}>
        <Text style={{ fontSize: 20, marginRight: spacing.sm }}>🎯</Text>
        <View style={{ flex: 1 }}>
          <Text style={[typography.captionBold, { color: colors.accentGreen }]}>Generate MCQs</Text>
          <Text style={[typography.tiny, { color: colors.textMuted }]}>10 questions on {note.subject}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.accentTeal + '20', borderColor: colors.accentTeal, marginTop: spacing.sm }]} onPress={handleGenerateFlashcards}>
        <Text style={{ fontSize: 20, marginRight: spacing.sm }}>🃏</Text>
        <View style={{ flex: 1 }}>
          <Text style={[typography.captionBold, { color: colors.accentTeal }]}>Generate Flashcards</Text>
          <Text style={[typography.tiny, { color: colors.textMuted }]}>5 cards from this note</Text>
        </View>
      </TouchableOpacity>

      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  subjectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  subjectBadge: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: borderRadius.sm },
  divider: { height: 1, backgroundColor: colors.border + '40', marginVertical: spacing.lg },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
  },
});
