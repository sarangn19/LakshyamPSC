import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from '../i18n/useTranslation';
import { colors, spacing, borderRadius } from '../theme';
import { typography } from '../theme/typography';
import { useKnowledgeStore, useMCQStore, useFlashcardStore } from '../store';
import { generateFlashcardsFromNote } from '../services/aiFlashcardGenerator';

export function NoteDetailScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const { noteId } = route.params;
  const note = useKnowledgeStore((s) => s.notes.find((n) => n.id === noteId));

  if (!note) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[typography.caption, { color: colors.textMuted }]}>{t('noteDetail.notFound')}</Text>
      </View>
    );
  }

  const handleGenerateMCQs = async () => {
    await useMCQStore.getState().startPracticeSession({
      subjects: [note.subject],
      difficulty: 'medium',
      count: 10,
      sourceType: 'note',
      noteId: note.id,
    });
    navigation.navigate('MCQ');
  };

  const handleGenerateFlashcards = async () => {
    const cards = await generateFlashcardsFromNote(note, 5);
    if (cards.length === 0) {
      Alert.alert(t('noteDetail.noFlashcardsTitle'), t('noteDetail.noFlashcardsMsg'));
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

      <Text style={[typography.captionBold, { color: colors.textSecondary, marginBottom: spacing.md }]}>{t('noteDetail.generateFromNote')}</Text>

      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.accentGreen + '20', borderColor: colors.accentGreen }]} onPress={handleGenerateMCQs}>
        <Text style={{ fontSize: 20, marginRight: spacing.sm }}>🎯</Text>
        <View style={{ flex: 1 }}>
          <Text style={[typography.captionBold, { color: colors.accentGreen }]}>{t('noteDetail.generateMCQs')}</Text>
          <Text style={[typography.tiny, { color: colors.textMuted }]}>{t('noteDetail.mcqSubtitle', { subject: note.subject })}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.accentTeal + '20', borderColor: colors.accentTeal, marginTop: spacing.sm }]} onPress={handleGenerateFlashcards}>
        <Text style={{ fontSize: 20, marginRight: spacing.sm }}>🃏</Text>
        <View style={{ flex: 1 }}>
          <Text style={[typography.captionBold, { color: colors.accentTeal }]}>{t('noteDetail.generateFlashcards')}</Text>
          <Text style={[typography.tiny, { color: colors.textMuted }]}>{t('noteDetail.flashcardSubtitle')}</Text>
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
