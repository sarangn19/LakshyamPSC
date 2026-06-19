import React, { useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { typography } from '../theme/typography';
import { useKnowledgeStore } from '../store';
import { SectionHeader, Badge, StyledCard, EmptyState } from '../components/common/StyledComponents';

const SUBJECT_FILTERS = ['All', 'Renaissance', 'Kerala History', 'Constitution', 'Geography', 'Science', 'Malayalam'];

export function KnowledgeRepositoryScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { notes, selectedSubject, searchQuery, setSelectedSubject, setSearchQuery } = useKnowledgeStore();
  const [showAddMenu, setShowAddMenu] = useState(false);

  const filteredNotes = notes.filter((n) => {
    const matchSubject = selectedSubject === '' || selectedSubject === 'All' || n.subject === selectedSubject;
    const matchSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSubject && matchSearch;
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddMenu(!showAddMenu)}>
          <Text style={{ fontSize: 24, color: colors.white }}>+</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.search}
        placeholder={t('knowledge.search')}
        placeholderTextColor={colors.textMuted}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {SUBJECT_FILTERS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, (selectedSubject === s || (selectedSubject === '' && s === 'All')) && styles.filterChipActive]}
            onPress={() => setSelectedSubject(s === 'All' ? '' : s)}
          >
            <Text style={[typography.small, { color: (selectedSubject === s || (selectedSubject === '' && s === 'All')) ? colors.primary : colors.textSecondary }]}>
              {s === 'All' ? t('knowledge.all') : s}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {showAddMenu && (
        <View style={styles.addMenu}>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={{ fontSize: 20 }}>📝</Text>
            <Text style={[typography.body, { color: colors.text, marginLeft: spacing.md }]}>{t('knowledge.textNote')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={{ fontSize: 20 }}>🎤</Text>
            <Text style={[typography.body, { color: colors.text, marginLeft: spacing.md }]}>{t('knowledge.voiceNote')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={{ fontSize: 20 }}>📷</Text>
            <Text style={[typography.body, { color: colors.text, marginLeft: spacing.md }]}>{t('knowledge.scanOCR')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {filteredNotes.length === 0 ? (
          <EmptyState message={t('knowledge.empty')} icon="📚" />
        ) : (
          filteredNotes.map((note) => (
            <TouchableOpacity
              key={note.id}
              style={styles.noteCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('NoteDetail', { noteId: note.id })}
            >
              <View style={styles.noteHeader}>
                <Badge label={note.subject} color={
                  note.subject === 'Renaissance' ? '#4D96FF' :
                  note.subject === 'Constitution' ? '#FF6B6B' :
                  note.subject === 'Geography' ? '#FFD93D' :
                  note.subject === 'Kerala History' ? '#6BCB77' : colors.primary
                } />
                <Text style={[typography.small, { color: colors.textMuted }]}>
                  {note.type === 'voice' ? '🎤' : note.type === 'ocr' ? '📷' : '📝'}
                </Text>
              </View>
              <Text style={[typography.bodyBold, { color: colors.text, marginTop: spacing.sm }]}>{note.title}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]} numberOfLines={2}>
                {note.content}
              </Text>
              <View style={styles.tags}>
                {note.tags.map((tag) => (
                  <Text key={tag} style={[typography.small, { color: colors.textMuted, marginRight: spacing.sm }]}>#{tag}</Text>
                ))}
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: spacing.huge }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  headerBar: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingTop: spacing.md, paddingBottom: spacing.md },
  addBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  search: {
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.md,
    height: 48,
    paddingHorizontal: spacing.md,
    color: colors.text,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterRow: { marginBottom: spacing.md },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.bgCard,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  addMenu: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  noteCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
});
