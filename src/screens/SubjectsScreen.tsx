import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useTranslation } from '../i18n/useTranslation';
import { colors, spacing, borderRadius, fontFamily } from '../theme';
import { typography } from '../theme/typography';
import { useCognitiveTwinStore, KnowledgeMastery } from '../store/cognitiveTwinStore';
import { useKnowledgeStore } from '../store';
import { getNodesByLevel, getChildren, getNodePath, getAncestors, KnowledgeNode, getSiblings, getNode, getPrerequisites, arePrerequisitesMet } from '../data/knowledgeTree';
import { getLearnerProfile } from '../services/learnerStage';
import { ProgressBar, Badge, EmptyState } from '../components/common/StyledComponents';

type MasteryState = 'strong' | 'improving' | 'weak' | 'at_risk' | 'unknown';

function getMasteryState(mastery?: KnowledgeMastery): MasteryState {
  if (!mastery || mastery.attempts === 0) return 'unknown';
  if (mastery.masteryScore >= 75) return 'strong';
  if (mastery.masteryScore >= 50) return 'improving';
  if (mastery.masteryScore >= 30) return 'weak';
  return 'at_risk';
}

function getStateColor(state: MasteryState): string {
  switch (state) {
    case 'strong': return colors.status.strong;
    case 'improving': return colors.status.improving;
    case 'weak': return colors.status.needsRevision;
    case 'at_risk': return colors.status.weakArea;
    default: return colors.status.notPracticed;
  }
}

function getStateLabel(state: MasteryState): string {
  switch (state) {
    case 'strong': return 'Strong';
    case 'improving': return 'Improving';
    case 'weak': return 'Weak';
    case 'at_risk': return 'At Risk';
    default: return 'Not Practiced';
  }
}

const defaultMastery: KnowledgeMastery = {
  nodeId: '', attempts: 0, correct: 0, accuracy: 0,
  hesitationScore: 0, forgettingScore: 0,
  masteryScore: 0, lastPracticed: '', trend: 'unknown',
};

const SUBJECT_FILTERS = ['All', 'Renaissance', 'Kerala History', 'Constitution', 'Geography', 'Science', 'Malayalam'];

function MasteryTab({ navigation }: any) {
  const { t, typography: tx } = useTranslation();
  const masteryMap = useCognitiveTwinStore((s) => s.masteryMap);
  const subjects = getNodesByLevel('subject');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const learnerProfile = getLearnerProfile();
  const isNewUser = learnerProfile.totalQuestions < 5;

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.legendRow}>
        {(['strong', 'improving', 'weak', 'at_risk', 'unknown'] as MasteryState[]).map((s) => (
          <View key={s} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: getStateColor(s) }]} />
            <Text style={[typography.tiny, { color: colors.textSecondary }]}>{getStateLabel(s)}</Text>
          </View>
        ))}
      </View>

      {subjects.map((subject) => {
        const mastery = masteryMap[subject.id] || { ...defaultMastery, nodeId: subject.id };
        const isExpanded = expandedNodes.has(subject.id);
        const childNodes = getChildren(subject.id);
        const state = getMasteryState(mastery);
        const color = getStateColor(state);

        return (
          <View key={subject.id} style={styles.subjectBlock}>
            <TouchableOpacity
              style={[styles.subjectCard, { borderLeftColor: color, borderLeftWidth: 4 }]}
              onPress={() => toggleNode(subject.id)}
              activeOpacity={0.8}
            >
              <View style={styles.subjectCardTop}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.masteryDot, { backgroundColor: color }]} />
                    <Text style={[typography.h3, { color: colors.text }]}>{subject.name}</Text>
                    <Badge label={getStateLabel(state)} color={color} />
                  </View>
                </View>
                {childNodes.length > 0 && (
                  <TouchableOpacity onPress={() => toggleNode(subject.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={{ fontSize: 18, color: colors.textMuted }}>{isExpanded ? '▾' : '▸'}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.subjectCardMeta}>
                {mastery.attempts > 0 && (
                  <>
                    <Text style={{ fontSize: 28, fontWeight: '700', color, fontFamily: fontFamily.bodyBold }}>{mastery.masteryScore}%</Text>
                    <Text style={[typography.tiny, { color: colors.textSecondary, marginLeft: spacing.sm }]}>
                      {mastery.attempts} questions
                    </Text>
                  </>
                )}
                {mastery.attempts === 0 && (
                  <Text style={[typography.caption, { color: colors.textTertiary }]}>No practice data yet</Text>
                )}
                {mastery.attempts >= 2 && (
                  <View style={{ flex: 1, marginLeft: 'auto', maxWidth: 120 }}>
                    <ProgressBar percent={mastery.masteryScore} color={color} height={4} />
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {isExpanded && childNodes.map((child) => {
              const childMastery = masteryMap[child.id] || { ...defaultMastery, nodeId: child.id };
              const childState = getMasteryState(childMastery);
              const childColor = getStateColor(childState);
              const grandchildren = getChildren(child.id);

              return (
                <TouchableOpacity
                  key={child.id}
                  style={[styles.topicCard, { borderLeftColor: childColor, borderLeftWidth: 3 }]}
                  onPress={() => navigation.navigate('Progress')}
                  activeOpacity={0.8}
                >
                  <View style={styles.topicRow}>
                    <View style={[styles.topicDot, { backgroundColor: childColor }]} />
                    <Text style={[typography.bodySmall, { color: colors.text, fontWeight: '600', flex: 1 }]} numberOfLines={1}>
                      {child.name}
                    </Text>
                    {childMastery.attempts > 0 && (
                      <Text style={[typography.tiny, { color: childColor, fontWeight: '700' }]}>
                        {childMastery.masteryScore}%
                      </Text>
                    )}
                  </View>
                  {grandchildren.length > 0 && (
                    <Text style={[typography.tiny, { color: colors.textMuted, marginTop: 2, marginLeft: 16 }]}>
                      {grandchildren.length} subtopics
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}

      {isNewUser && (
        <View style={styles.emptyHint}>
          <Text style={{ fontSize: 28, marginBottom: spacing.sm }}>🗺️</Text>
          <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center' }]}>
            Start practicing to build your mastery map
          </Text>
        </View>
      )}

      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

function NotesTab({ navigation }: any) {
  const { t } = useTranslation();
  const { notes, selectedSubject, searchQuery, setSelectedSubject, setSearchQuery } = useKnowledgeStore();
  const [showAddMenu, setShowAddMenu] = useState(false);

  const filteredNotes = notes.filter((n) => {
    const matchSubject = selectedSubject === '' || selectedSubject === 'All' || n.subject === selectedSubject;
    const matchSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSubject && matchSearch;
  });

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddMenu(!showAddMenu)}>
          <Text style={{ fontSize: 24, color: colors.white }}>+</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search notes..."
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
              {s === 'All' ? 'All' : s}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {showAddMenu && (
        <View style={styles.addMenu}>
          <TouchableOpacity style={styles.menuItem} onPress={() => { setShowAddMenu(false); navigation.navigate('CreateNote'); }}>
            <Text style={{ fontSize: 20 }}>📝</Text>
            <Text style={[typography.body, { color: colors.text, marginLeft: spacing.md }]}>Text Note</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={{ fontSize: 20 }}>🎤</Text>
            <Text style={[typography.body, { color: colors.text, marginLeft: spacing.md }]}>Voice Note</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={{ fontSize: 20 }}>📷</Text>
            <Text style={[typography.body, { color: colors.text, marginLeft: spacing.md }]}>Scan OCR</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {filteredNotes.length === 0 ? (
          <EmptyState message="No notes yet" icon="📚" />
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

export function SubjectsScreen({ navigation, route }: any) {
  const initialTab = route?.params?.tab === 'notes' ? 'notes' : 'mastery';
  const [activeTab, setActiveTab] = useState<'mastery' | 'notes'>(initialTab);

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'mastery' && styles.tabActive]}
          onPress={() => setActiveTab('mastery')}
        >
          <Text style={[typography.bodySmall, { fontWeight: '600', color: activeTab === 'mastery' ? colors.primary : colors.textSecondary }]}>
            Mastery
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'notes' && styles.tabActive]}
          onPress={() => setActiveTab('notes')}
        >
          <Text style={[typography.bodySmall, { fontWeight: '600', color: activeTab === 'notes' ? colors.primary : colors.textSecondary }]}>
            Notes
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'mastery' ? (
        <MasteryTab navigation={navigation} />
      ) : (
        <NotesTab navigation={navigation} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  tabBar: {
    flexDirection: 'row', backgroundColor: colors.bgCard, borderRadius: borderRadius.md,
    padding: spacing.xs, marginTop: spacing.md, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.sm },
  tabActive: { backgroundColor: colors.primary + '15' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  subjectBlock: {
    backgroundColor: colors.bgCard, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: spacing.sm,
  },
  subjectCard: { padding: spacing.lg },
  subjectCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  masteryDot: { width: 12, height: 12, borderRadius: 6 },
  subjectCardMeta: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, marginLeft: 20 },
  topicCard: {
    paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.sm, marginBottom: 4,
    backgroundColor: colors.bg, borderRadius: borderRadius.sm,
  },
  topicRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  topicDot: { width: 8, height: 8, borderRadius: 4 },
  emptyHint: { marginTop: spacing.xl, alignItems: 'center', padding: spacing.xl },
  headerBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: spacing.sm, paddingBottom: spacing.sm },
  addBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  search: {
    backgroundColor: colors.bgInput, borderRadius: borderRadius.md, height: 48,
    paddingHorizontal: spacing.md, color: colors.text, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  filterRow: { marginBottom: spacing.md },
  filterChip: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: borderRadius.round, backgroundColor: colors.bgCard,
    marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  addMenu: {
    backgroundColor: colors.bgCard, borderRadius: borderRadius.md,
    padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  noteCard: {
    backgroundColor: colors.bgCard, borderRadius: borderRadius.md,
    padding: spacing.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
});
