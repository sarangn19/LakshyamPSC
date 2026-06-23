import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { BottomNav } from '../components/BottomNav';
import { getHighYieldTopics, getTopicTrend, getTopYieldBySubject } from '../services/highYieldTopics';
import type { HighYieldTopic, TopicTrend } from '../services/highYieldTopics';
import { useCognitiveTwinStore } from '../store/cognitiveTwinStore';

export function TopicIntelligenceScreen({ navigation }: any) {
  const [topics, setTopics] = useState<HighYieldTopic[]>([]);
  const [trends, setTrends] = useState<TopicTrend[]>([]);
  const [grouped, setGrouped] = useState<Record<string, HighYieldTopic[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const masteryMap = useCognitiveTwinStore(s => s.masteryMap);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const yieldTopics = await getHighYieldTopics();
      setTopics(yieldTopics);
      setTrends(yieldTopics.map(getTopicTrend));
      setGrouped(getTopYieldBySubject(yieldTopics));
    } catch {}
    setLoading(false);
  };

  const subjects = Object.keys(grouped).sort();
  const displayTopics = selectedSubject ? grouped[selectedSubject] || [] : trends.slice(0, 50);

  const getMasteryForTopic = (topic: string): { score: number; status: string } | null => {
    const mastery = masteryMap[topic];
    if (!mastery) return null;
    return {
      score: Math.round(mastery.masteryScore || 0),
      status: (mastery.masteryScore || 0) >= 80 ? 'strong' :
              (mastery.masteryScore || 0) >= 60 ? 'good' :
              (mastery.masteryScore || 0) >= 40 ? 'weak' : 'poor',
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'strong': return colors.success;
      case 'good': return colors.primary;
      case 'weak': return colors.warning;
      case 'poor': return colors.error;
      default: return colors.textMuted;
    }
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
        data={displayTopics}
        keyExtractor={item => item.topic}
        ListHeaderComponent={() => (
          <View>
            <Text style={styles.title}>Topic Intelligence</Text>
            <Text style={styles.subtitle}>Every topic's corpus data, your mastery, and recommendation priority</Text>

            {/* Subject filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectRow}>
              <TouchableOpacity
                style={[styles.subjectChip, !selectedSubject && styles.subjectChipActive]}
                onPress={() => setSelectedSubject(null)}
              >
                <Text style={[styles.subjectChipText, !selectedSubject && styles.subjectChipTextActive]}>All</Text>
              </TouchableOpacity>
              {subjects.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.subjectChip, selectedSubject === s && styles.subjectChipActive]}
                  onPress={() => setSelectedSubject(s)}
                >
                  <Text style={[styles.subjectChipText, selectedSubject === s && styles.subjectChipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.legend}>
              {['Strong', 'Good', 'Weak', 'Poor'].map(s => (
                <View key={s} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: getStatusColor(s.toLowerCase()) }]} />
                  <Text style={styles.legendText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        renderItem={({ item, index }) => {
          const trend = trends.find(t => t.topic === item.topic);
          const mastery = getMasteryForTopic(item.topic);
          const hasMastery = mastery !== null;

          return (
            <TouchableOpacity
              style={styles.topicCard}
              onPress={() => navigation.navigate('PYQExplorer', { initialTopic: item.topic, initialSubject: item.subject })}
            >
              {/* Rank */}
              <View style={[styles.rankBadge, { backgroundColor: index < 3 ? colors.primary : colors.surface }]}>
                <Text style={[styles.rankBadgeText, { color: index < 3 ? '#fff' : colors.text }]}>{index + 1}</Text>
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <Text style={styles.topicName}>{item.topic}</Text>
                <Text style={styles.topicMeta}>
                  {item.totalQuestions}Q · {item.distinctYears}yrs · {item.duplicateCount} dupes
                </Text>
                {trend && (
                  <Text style={styles.trendText}>
                    {trend.trend === 'rising' ? '↑' : trend.trend === 'declining' ? '↓' : '→'} {trend.trendReason}
                  </Text>
                )}
              </View>

              {/* Yield score */}
              <View style={styles.yieldCol}>
                <Text style={styles.yieldScore}>{item.yieldScore}</Text>
                <Text style={styles.yieldLabel}>Yield</Text>
              </View>

              {/* Mastery indicator */}
              {hasMastery && (
                <View style={[styles.masteryDot, { backgroundColor: getStatusColor(mastery.status) }]}>
                  <Text style={styles.masteryText}>{mastery.score}</Text>
                </View>
              )}
              {!hasMastery && (
                <View style={styles.noMastery}>
                  <Text style={styles.noMasteryText}>—</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, padding: spacing.md, paddingBottom: 0 },
  subtitle: { fontSize: 13, color: colors.textMuted, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  subjectRow: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  subjectChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.surface, borderRadius: 16, marginRight: spacing.xs },
  subjectChipActive: { backgroundColor: colors.primary },
  subjectChipText: { fontSize: 13, color: colors.text },
  subjectChipTextActive: { color: '#fff' },
  legend: { flexDirection: 'row', paddingHorizontal: spacing.md, marginBottom: spacing.sm, gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  legendText: { fontSize: 11, color: colors.textMuted },
  topicCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, marginHorizontal: spacing.md, marginBottom: spacing.sm, borderRadius: borderRadius.md, padding: spacing.md },
  rankBadge: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  rankBadgeText: { fontSize: 12, fontWeight: '700' },
  topicName: { fontSize: 14, fontWeight: '600', color: colors.text },
  topicMeta: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  trendText: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
  yieldCol: { alignItems: 'center', marginHorizontal: spacing.sm },
  yieldScore: { fontSize: 15, fontWeight: '700', color: colors.primary },
  yieldLabel: { fontSize: 9, color: colors.textMuted, textTransform: 'uppercase' },
  masteryDot: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  masteryText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  noMastery: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  noMasteryText: { fontSize: 12, color: colors.textMuted },
});
