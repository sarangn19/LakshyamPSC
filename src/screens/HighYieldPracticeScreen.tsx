import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { BottomNav } from '../components/BottomNav';
import { useMCQStore } from '../store';
import { getHighYieldTopics, getHighYieldPracticeMix, getTopicTrend } from '../services/highYieldTopics';
import { getGapRecommendations } from '../services/cognitiveTwinRecommender';
import { startTracking } from '../services/recommendationTracker';
import type { HighYieldTopic, TopicTrend } from '../services/highYieldTopics';

export function HighYieldPracticeScreen({ navigation }: any) {
  const [topics, setTopics] = useState<HighYieldTopic[]>([]);
  const [trends, setTrends] = useState<TopicTrend[]>([]);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionCount, setSessionCount] = useState(15);
  const [selectedMode, setSelectedMode] = useState<'auto' | 'weak' | 'high_yield' | 'all'>('auto');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [yieldTopics, gapRecs] = await Promise.all([
        getHighYieldTopics(),
        Promise.resolve(getGapRecommendations()),
      ]);
      setTopics(yieldTopics);
      setTrends(yieldTopics.slice(0, 30).map(getTopicTrend));
      setWeakTopics(gapRecs.slice(0, 5).map(r => r.gap.topic || r.gap.subject));
    } catch {}
    setLoading(false);
  };

  const startPractice = () => {
    const mix = getHighYieldPracticeMix(weakTopics, sessionCount);

    let selectedTopics: string[];
    switch (selectedMode) {
      case 'weak':
        selectedTopics = weakTopics;
        break;
      case 'high_yield':
        selectedTopics = topics.slice(0, 5).map(t => t.topic);
        break;
      case 'all':
        selectedTopics = [];
        break;
      default: // 'auto' — 70/30 mix
        selectedTopics = [...weakTopics, ...topics.slice(0, 3).map(t => t.topic)];
    }

    const recId = startTracking('hybrid', selectedTopics[0] || 'general', 'General');
    useMCQStore.getState().startOrchestratedSession({
      subjects: [],
      recommendedTopic: selectedTopics.join(','),
      sessionType: 'high_yield_pyq',
      recommendationId: recId,
    });
    navigation.navigate('MCQ');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <BottomNav activeTab="Learn" />
        <ActivityIndicator size="large" color={colors.primary} style={{ margin: 40 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BottomNav activeTab="Learn" />

      <FlatList
        data={trends}
        keyExtractor={item => item.topic}
        ListHeaderComponent={() => (
          <View>
            <Text style={styles.title}>High Yield Practice</Text>
            <Text style={styles.subtitle}>70% weak areas · 30% high-frequency PSC topics</Text>

            {/* Practice mode selector */}
            <View style={styles.modeRow}>
              {(['auto', 'weak', 'high_yield', 'all'] as const).map(mode => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modeBtn, selectedMode === mode && styles.modeBtnActive]}
                  onPress={() => setSelectedMode(mode)}
                >
                  <Text style={[styles.modeBtnText, selectedMode === mode && styles.modeBtnTextActive]}>
                    {mode === 'auto' ? '70/30' : mode === 'weak' ? 'Weak' : mode === 'high_yield' ? 'Yield' : 'All'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Session size */}
            <View style={styles.countRow}>
              <Text style={styles.countLabel}>Questions: {sessionCount}</Text>
              <View style={styles.countBtns}>
                {[10, 15, 20, 30].map(n => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.countBtn, sessionCount === n && styles.countBtnActive]}
                    onPress={() => setSessionCount(n)}
                  >
                    <Text style={[styles.countBtnText, sessionCount === n && styles.countBtnTextActive]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Start practice */}
            <TouchableOpacity style={styles.startBtn} onPress={startPractice}>
              <Text style={styles.startBtnText}>
                Start Practice ({getHighYieldPracticeMix(weakTopics, sessionCount).mixDescription})
              </Text>
            </TouchableOpacity>

            {/* Weak topics notice */}
            {weakTopics.length === 0 && (
              <Text style={styles.notice}>Complete more quizzes to identify your weak areas</Text>
            )}

            <Text style={styles.sectionTitle}>Top High-Yield PSC Topics</Text>
            <Text style={styles.sectionSub}>Topics ranked by yield score (volume · frequency · persistence · repeat rate)</Text>
          </View>
        )}
        renderItem={({ item, index }) => (
          <TouchableOpacity style={styles.topicCard}>
            <View style={styles.rankCol}>
              <Text style={[styles.rankText, index < 3 && styles.rankTop]}>{index + 1}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.topicName}>{item.topic}</Text>
              <Text style={styles.topicMeta}>
                {item.subject} · {item.totalQuestions} questions · {item.distinctYears} years
                {item.duplicateCount > 0 ? ` · ${item.duplicateCount} repeats` : ''}
              </Text>
            </View>
            <View style={styles.scoreCol}>
              <Text style={styles.scoreText}>{item.yieldScore}</Text>
              <Text style={styles.scoreLabel}>yield</Text>
            </View>
            <Text style={styles.trendIcon}>
              {item.trend === 'rising' ? '↑' : item.trend === 'declining' ? '↓' : item.trend === 'steady' ? '→' : '·'}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, padding: spacing.md, paddingBottom: 0 },
  subtitle: { fontSize: 13, color: colors.textMuted, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  modeRow: { flexDirection: 'row', paddingHorizontal: spacing.md, marginBottom: spacing.sm, gap: spacing.xs },
  modeBtn: { flex: 1, paddingVertical: spacing.sm, backgroundColor: colors.surface, borderRadius: borderRadius.md, alignItems: 'center' },
  modeBtnActive: { backgroundColor: colors.primary },
  modeBtnText: { fontSize: 13, color: colors.text, fontWeight: '500' },
  modeBtnTextActive: { color: '#fff' },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, marginBottom: spacing.md },
  countLabel: { fontSize: 14, color: colors.text, fontWeight: '500' },
  countBtns: { flexDirection: 'row', gap: spacing.xs },
  countBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  countBtnActive: { backgroundColor: colors.primary },
  countBtnText: { fontSize: 13, fontWeight: '600', color: colors.text },
  countBtnTextActive: { color: '#fff' },
  startBtn: { backgroundColor: colors.primary, marginHorizontal: spacing.md, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', marginBottom: spacing.md },
  startBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  notice: { textAlign: 'center', color: colors.textMuted, fontSize: 12, marginBottom: spacing.md },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, paddingHorizontal: spacing.md, marginTop: spacing.sm },
  sectionSub: { fontSize: 12, color: colors.textMuted, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  topicCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, marginHorizontal: spacing.md, marginBottom: spacing.sm, borderRadius: borderRadius.md, padding: spacing.md },
  rankCol: { width: 28, alignItems: 'center', marginRight: spacing.sm },
  rankText: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  rankTop: { color: colors.primary, fontSize: 16 },
  infoCol: { flex: 1 },
  topicName: { fontSize: 14, fontWeight: '600', color: colors.text },
  topicMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  scoreCol: { alignItems: 'center', marginHorizontal: spacing.sm },
  scoreText: { fontSize: 16, fontWeight: '700', color: colors.primary },
  scoreLabel: { fontSize: 9, color: colors.textMuted, textTransform: 'uppercase' },
  trendIcon: { fontSize: 18, color: colors.textMuted, width: 24, textAlign: 'center' },
});
