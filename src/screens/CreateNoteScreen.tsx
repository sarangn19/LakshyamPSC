import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from '../i18n/useTranslation';
import { colors, spacing, radius, fontFamily } from '../theme';
import { useKnowledgeStore } from '../store/knowledgeStore';
import { subjectColors } from '../theme/colors';
import { syllabus } from '../data/syllabus';

export function CreateNoteScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const addNote = useKnowledgeStore((s) => s.addNote);
  const updateNote = useKnowledgeStore((s) => s.updateNote);
  const existingNote = route?.params?.note;
  const [title, setTitle] = useState(existingNote?.title || '');
  const [content, setContent] = useState(existingNote?.content || '');
  const [selectedSubject, setSelectedSubject] = useState(existingNote?.subject || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(existingNote?.tags || []);

  const subjects = syllabus.map((s) => s.name);

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = () => {
    if (!title.trim() || !selectedSubject) return;
    if (existingNote) {
      updateNote(existingNote.id, {
        title: title.trim(),
        content: content.trim(),
        subject: selectedSubject,
        tags: tags,
        updatedAt: new Date().toISOString(),
      });
    } else {
      addNote({
        id: `note-${Date.now()}`,
        title: title.trim(),
        content: content.trim(),
        type: 'text',
        subject: selectedSubject,
        topicIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: tags,
      });
    }
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{existingNote ? 'Edit Note' : 'New Note'}</Text>
        <TouchableOpacity
          style={[styles.saveBtn, (!title.trim() || !selectedSubject) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!title.trim() || !selectedSubject}
        >
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.titleInput}
          placeholder="Note title"
          placeholderTextColor={colors.textTertiary}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Subject</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectRow}>
          {subjects.map((subject) => {
            const active = subject === selectedSubject;
            const subjColor = subjectColors[subject] || colors.primary;
            return (
              <TouchableOpacity
                key={subject}
                style={[styles.subjectChip, active && { backgroundColor: subjColor + '20', borderColor: subjColor }]}
                onPress={() => setSelectedSubject(subject)}
              >
                <View style={[styles.dot, { backgroundColor: subjColor }]} />
                <Text style={[styles.subjectChipText, active && { color: subjColor }]}>{subject}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TextInput
          style={styles.contentInput}
          placeholder="Write your note here..."
          placeholderTextColor={colors.textTertiary}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.label}>Tags</Text>
        <View style={styles.tagRow}>
          <TextInput
            style={styles.tagInput}
            placeholder="Add a tag"
            placeholderTextColor={colors.textTertiary}
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={addTag}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.tagAddBtn} onPress={addTag}>
            <Text style={styles.tagAddBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        {tags.length > 0 && (
          <View style={styles.tagsList}>
            {tags.map((tag) => (
              <TouchableOpacity key={tag} style={styles.tagChip} onPress={() => removeTag(tag)}>
                <Text style={styles.tagChipText}>#{tag} ✕</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: radius.full, backgroundColor: colors.bgCard2, justifyContent: 'center', alignItems: 'center' },
  backBtnText: { fontSize: 16, color: colors.text, fontFamily: fontFamily.bodyMedium },
  headerTitle: { fontSize: 18, fontWeight: '600', fontFamily: fontFamily.bodySemiBold, color: colors.text },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.primary, borderRadius: radius.md },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: colors.white, fontSize: 14, fontWeight: '600', fontFamily: fontFamily.bodyMedium },
  scrollContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: 120 },
  titleInput: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', fontFamily: fontFamily.bodyMedium, letterSpacing: 0.5 },
  subjectRow: { flexDirection: 'row', marginBottom: spacing.sm },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    gap: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  subjectChipText: { fontSize: 13, color: colors.text, fontFamily: fontFamily.bodyMedium },
  contentInput: {
    fontSize: 16,
    fontFamily: fontFamily.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 200,
    lineHeight: 24,
  },
  tagRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  tagInput: {
    flex: 1,
    height: 44,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    fontFamily: fontFamily.body,
    color: colors.text,
  },
  tagAddBtn: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  tagAddBtnText: { fontSize: 22, color: colors.white, fontFamily: fontFamily.bodyMedium },
  tagsList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tagChip: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.surfaceSecondary, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  tagChipText: { fontSize: 12, color: colors.textSecondary, fontFamily: fontFamily.bodyMedium },
});
