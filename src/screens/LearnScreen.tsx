import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { typography } from '../theme/typography';
import { useUserStore, useFlashcardStore, useKnowledgeStore } from '../store';

export function LearnScreen({ navigation }: any) {
  const getDueCount = useFlashcardStore((s) => s.getDueCount);
  const notes = useKnowledgeStore((s) => s.notes);
  const { streak } = useUserStore();

  const dueCount = getDueCount();
  const recentNotes = notes.slice(0, 5);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={[typography.caption, { color: colors.primaryLight }]}>Ready to learn</Text>
          <Text style={[typography.h1, { color: colors.text, marginTop: spacing.xs }]}>Study</Text>
        </View>
        {streak.current > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {streak.current}d</Text>
          </View>
        )}
      </View>

      <Text style={[typography.captionBold, { color: colors.textSecondary, marginBottom: spacing.sm }]}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('MCQ')}>
          <Text style={{ fontSize: 24 }}>🎯</Text>
          <Text style={[typography.captionBold, { color: colors.text, marginTop: spacing.xs }]}>MCQs</Text>
          <Text style={[typography.tiny, { color: colors.textMuted }]}>Practice questions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Flashcards')}>
          <Text style={{ fontSize: 24 }}>🃏</Text>
          <Text style={[typography.captionBold, { color: colors.text, marginTop: spacing.xs }]}>Flashcards</Text>
          <Text style={[typography.tiny, { color: colors.textMuted }]}>{dueCount > 0 ? `${dueCount} due` : 'All done'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('AITutor')}>
          <Text style={{ fontSize: 24 }}>🤖</Text>
          <Text style={[typography.captionBold, { color: colors.text, marginTop: spacing.xs }]}>AI Tutor</Text>
          <Text style={[typography.tiny, { color: colors.textMuted }]}>Ask anything</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Knowledge')}>
          <Text style={{ fontSize: 24 }}>📝</Text>
          <Text style={[typography.captionBold, { color: colors.text, marginTop: spacing.xs }]}>Notes</Text>
          <Text style={[typography.tiny, { color: colors.textMuted }]}>{notes.length} saved</Text>
        </TouchableOpacity>
      </View>

      <Text style={[typography.captionBold, { color: colors.textSecondary, marginBottom: spacing.sm }]}>Recent Notes</Text>
      {recentNotes.length === 0 ? (
        <View style={styles.emptyNotes}>
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            No notes yet. Ask the AI Tutor to explain a topic, then save the response as a note.
          </Text>
        </View>
      ) : (
        recentNotes.map((note) => (
          <TouchableOpacity key={note.id} style={styles.noteCard} onPress={() => navigation.navigate('NoteDetail', { noteId: note.id })}>
            <View style={styles.noteDot} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.captionBold, { color: colors.text }]} numberOfLines={1}>{note.title}</Text>
              <Text style={[typography.tiny, { color: colors.textMuted }]} numberOfLines={2}>{note.content}</Text>
            </View>
            <Text style={[typography.tiny, { color: colors.textSecondary }]}>{note.subject}</Text>
          </TouchableOpacity>
        ))
      )}

      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: spacing.huge,
    paddingBottom: spacing.xl,
  },
  streakBadge: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakText: { fontSize: 12, color: colors.textSecondary },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionCard: {
    width: '48%',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  emptyNotes: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  noteDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: spacing.md,
  },
});
