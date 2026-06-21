import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { typography } from '../theme/typography';
import { BottomNav } from '../components/BottomNav';
import { getPSCQuestions, getPSCFilters, getTopTopics } from '../services/pscService';

export function PYQExplorerScreen({ navigation }: any) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'topics' | 'questions'>('topics');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { loadFilters(); loadTopics(); }, []);
  useEffect(() => { if (mode === 'questions') loadQuestions(); }, [mode, selectedCategory, selectedSubject, selectedYear, selectedTopic]);

  const loadFilters = async () => { try { setFilters(await getPSCFilters()); } catch {} };
  const loadTopics = async () => { try { setTopics(await getTopTopics(30)); } catch {} finally { setLoading(false); } };

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const r = await getPSCQuestions({ examCategory: selectedCategory, subject: selectedSubject, topic: selectedTopic, yearFrom: selectedYear, yearTo: selectedYear, search: search || null, limit: 100, offset: 0 });
      setQuestions(r.questions);
    } catch {}
    setLoading(false);
  };

  const activeFilterCount = [selectedCategory, selectedSubject, selectedTopic, selectedYear].filter(Boolean).length;

  const filterChips = (items: string[], selected: string | null, onSelect: (v: string | null) => void) => (
    <View style={styles.chipRow}>
      {items.map(item => (
        <TouchableOpacity key={item} style={[styles.chip, selected === item && styles.chipActive]} onPress={() => onSelect(selected === item ? null : item)}>
          <Text style={[styles.chipText, selected === item && styles.chipTextActive]}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (mode === 'topics') {
    return (
      <View style={styles.container}>
        <BottomNav navigation={navigation} currentRoute="PYQExplorer" />
        <Text style={styles.title}>Most Repeated PSC Topics</Text>
        <Text style={styles.subtitle}>Based on 17,165 PYQs from 114 exams</Text>

        {loading ? <ActivityIndicator style={{ margin: 40 }} size="large" color={colors.primary} /> : (
          <FlatList
            data={topics}
            keyExtractor={item => item.topic}
            renderItem={({ item, index }) => (
              <TouchableOpacity style={styles.topicCard} onPress={() => { setSelectedSubject(item.subject); setSelectedTopic(item.topic); setMode('questions'); }}>
                <View style={[styles.rankCircle, { backgroundColor: index < 3 ? colors.primary : colors.surface }]}>
                  <Text style={[styles.rankText, { color: index < 3 ? '#fff' : colors.text }]}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.topicName}>{item.topic}</Text>
                  <Text style={styles.topicSubject}>{item.subject} · {item.question_count} questions{item.repeat_count > 0 ? ` · ${item.repeat_count} repeats` : ''}</Text>
                </View>
                <Text style={styles.arrow}>→</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
        <TouchableOpacity style={styles.exploreBtn} onPress={() => setMode('questions')}>
          <Text style={styles.exploreBtnText}>Browse All PYQs</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BottomNav navigation={navigation} currentRoute="PYQExplorer" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMode('topics')}><Text style={styles.backBtn}>← Topics</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>PYQ Explorer</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.searchRow}>
        <TextInput style={styles.searchInput} placeholder="Search questions..." value={search} onChangeText={setSearch} onSubmitEditing={loadQuestions} returnKeyType="search" placeholderTextColor={colors.textMuted} />
        <TouchableOpacity style={styles.searchBtn} onPress={loadQuestions}><Text style={styles.searchBtnText}>Go</Text></TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.filterToggle} onPress={() => setShowFilters(!showFilters)}>
        <Text style={styles.filterToggleText}>Filters ({activeFilterCount})</Text>
        <Text>{showFilters ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {showFilters && filters && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterLabel}>Category</Text>
          {filterChips(filters.categories, selectedCategory, setSelectedCategory)}
          <Text style={styles.filterLabel}>Subject</Text>
          {filterChips(filters.subjects, selectedSubject, setSelectedSubject)}
          <Text style={styles.filterLabel}>Year</Text>
          {filterChips(filters.years.map(String), selectedYear?.toString() || null, v => setSelectedYear(v ? parseInt(v) : null))}
        </View>
      )}

      {loading ? <ActivityIndicator style={{ margin: 40 }} size="large" color={colors.primary} /> : (
        <FlatList
          data={questions}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.qCard} onPress={() => navigation.navigate('MCQ', { questionId: item.id, source: 'pyq' })}>
              <View style={styles.qMeta}>
                <Text style={styles.qExam}>{item.examName?.slice(0, 50)}{item.year ? ` (${item.year})` : ''}</Text>
                {item.isQuizReady && <Text style={styles.readyBadge}>Ready</Text>}
              </View>
              <Text style={styles.qText} numberOfLines={2}>{item.question}</Text>
              {item.subject && <Text style={styles.qTopic}>{item.subject}{item.topic ? ` › ${item.topic}` : ''}</Text>}
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No questions found. Try different filters.</Text>}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, padding: spacing.md, paddingBottom: 0 },
  subtitle: { fontSize: 13, color: colors.textMuted, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, paddingBottom: 0 },
  backBtn: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  searchRow: { flexDirection: 'row', paddingHorizontal: spacing.md, marginVertical: spacing.sm },
  searchInput: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 14, color: colors.text, marginRight: spacing.sm },
  searchBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '600' },
  filterToggle: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginHorizontal: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.md, marginBottom: spacing.xs },
  filterToggleText: { color: colors.text, fontWeight: '500' },
  filterPanel: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  filterLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', marginTop: spacing.sm, marginBottom: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: '#ddd' },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, color: colors.text },
  chipTextActive: { color: '#fff' },
  topicCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, marginHorizontal: spacing.md, marginBottom: spacing.sm, borderRadius: borderRadius.md, padding: spacing.md },
  rankCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  rankText: { fontSize: 14, fontWeight: '700' },
  topicName: { fontSize: 15, fontWeight: '600', color: colors.text },
  topicSubject: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  arrow: { color: colors.textMuted, fontSize: 18, marginLeft: spacing.sm },
  exploreBtn: { backgroundColor: colors.primary, margin: spacing.md, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  exploreBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  qCard: { backgroundColor: colors.surface, marginHorizontal: spacing.md, marginBottom: spacing.sm, borderRadius: borderRadius.md, padding: spacing.md },
  qMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  qExam: { fontSize: 11, color: colors.textMuted },
  readyBadge: { fontSize: 10, backgroundColor: '#e8f5e9', color: '#2e7d32', paddingHorizontal: 4, borderRadius: 4, overflow: 'hidden' },
  qText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  qTopic: { fontSize: 11, color: colors.primary, marginTop: 4 },
  empty: { textAlign: 'center', color: colors.textMuted, padding: spacing.xl },
});
