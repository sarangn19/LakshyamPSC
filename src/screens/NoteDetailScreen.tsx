import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from '../i18n/useTranslation';
import { colors, spacing, borderRadius, fontFamily } from '../theme';
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

  const handleEdit = () => {
    navigation.navigate('CreateNote', { note });
  };

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
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Svg width="9" height="17" viewBox="0 0 9 17" fill="none">
            <Path fillRule="evenodd" clipRule="evenodd" d="M8.99892 15.938L7.95392 17L0.287919 9.21C0.10342 9.0197 0.000244141 8.76505 0.000244141 8.5C0.000244141 8.23495 0.10342 7.9803 0.287919 7.79L7.95392 0L8.99892 1.063L1.68092 8.5L8.99892 15.938Z" fill="black"/>
          </Svg>
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>{note.title}</Text>
          <Text style={styles.headerSub}>{note.subject}</Text>
        </View>
        <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
          <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <Path d="M11.5 1.5L14.5 4.5L5.5 13.5L2 14L2.5 10.5L11.5 1.5Z" stroke={colors.textSecondary} strokeWidth="1.5" strokeLinejoin="round"/>
            <Path d="M9.5 3.5L12.5 6.5" stroke={colors.textSecondary} strokeWidth="1.5"/>
          </Svg>
        </TouchableOpacity>
      </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    borderRadius: 999,
  },
  headerTextWrap: { flex: 1 },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
    lineHeight: 20,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '400',
    fontFamily: fontFamily.body,
    color: colors.textSecondary,
    marginTop: 1,
  },
  editButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 999,
  },
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
