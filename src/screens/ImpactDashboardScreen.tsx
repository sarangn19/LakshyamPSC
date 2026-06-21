import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { BottomNav } from '../components/BottomNav';
import { getRecommendationStats, getTopicImprovements } from '../services/recommendationTracker';
import type { RecommendationStats, TopicImprovement } from '../services/recommendationTracker';

export function ImpactDashboardScreen({ navigation }: any) {
  const [stats, setStats] = useState<RecommendationStats[]>([]);
  const [topicImps, setTopicImps] = useState<TopicImprovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'all' | '7d' | '30d'>('all');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([getRecommendationStats(), getTopicImprovements()]);
      setStats(s);
      setTopicImps(t);
    } catch {}
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <BottomNav activeTab="Learn" />
        <ActivityIndicator size="large" color={colors.primary} style={{ margin: 40 }} />
      </View>
    );
  }

  const totalSessions = stats.reduce((s, r) => s + r.count, 0);
  const bestType = stats.length > 0 ? stats[0] : null;

  return (
    <View style={styles.container}>
      <BottomNav activeTab="Learn" />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={styles.title}>Recommendation Impact</Text>
        <Text style={styles.subtitle}>How our recommendations improve your learning</Text>

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalSessions}</Text>
            <Text style={styles.summaryLabel}>Sessions tracked</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: colors.success || '#4CAF50' }]}>
              {bestType ? `${bestType.avgAccuracyImprovement > 0 ? '+' : ''}${(bestType.avgAccuracyImprovement * 100).toFixed(0)}%` : '—'}
            </Text>
            <Text style={styles.summaryLabel}>Best accuracy gain</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: colors.accent }]}>
              {bestType ? `${bestType.gapClosureRate}%` : '—'}
            </Text>
            <Text style={styles.summaryLabel}>Gap closure rate</Text>
          </View>
        </View>

        {/* Stats by recommendation type */}
        <Text style={styles.sectionTitle}>By Recommendation Type</Text>
        {stats.length === 0 ? (
          <Text style={styles.empty}>Complete practice sessions to see impact data</Text>
        ) : (
          stats.map(s => (
            <View key={s.type} style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={styles.statType}>
                  {s.type === 'weakness_only' ? 'Weakness-Based' :
                   s.type === 'frequency_boosted' ? 'Frequency-Boosted' :
                   s.type === 'hybrid' ? 'Hybrid (70/30)' : s.type}
                </Text>
                <Text style={styles.statCount}>{s.count} sessions</Text>
              </View>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, s.avgAccuracyImprovement >= 0 ? styles.positive : styles.negative]}>
                    {(s.avgAccuracyImprovement * 100).toFixed(0)}%
                  </Text>
                  <Text style={styles.statLabel}>Accuracy change</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {(s.avgMasteryImprovement * 100).toFixed(0)}%
                  </Text>
                  <Text style={styles.statLabel}>Mastery change</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{s.gapClosureRate}%</Text>
                  <Text style={styles.statLabel}>Gaps closed</Text>
                </View>
              </View>
            </View>
          ))
        )}

        {/* Topic improvements */}
        {topicImps.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Improvement by Topic</Text>
            {topicImps.slice(0, 10).map(t => (
              <View key={t.topic} style={styles.topicRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.topicName}>{t.topic}</Text>
                  <Text style={styles.topicSubject}>{t.subject} · {t.sessions} sessions</Text>
                </View>
                <Text style={[styles.changeValue, t.accuracyChange >= 0 ? styles.positive : styles.negative]}>
                  {t.accuracyChange >= 0 ? '+' : ''}{(t.accuracyChange * 100).toFixed(0)}%
                </Text>
              </View>
            ))}
          </>
        )}

        {/* High Impact Topics section */}
        {topicImps.filter(t => t.accuracyChange > 0.05).length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Most Effective High-Yield Topics</Text>
            <Text style={styles.sectionSub}>Topics where high-yield practice led to the most improvement</Text>
            {topicImps.filter(t => t.accuracyChange > 0.05).slice(0, 5).map(t => (
              <View key={t.topic} style={styles.effectiveCard}>
                <Text style={styles.effectiveTopic}>{t.topic}</Text>
                <Text style={styles.effectiveMeta}>{t.subject} · +{(t.accuracyChange * 100).toFixed(0)}% accuracy</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, padding: spacing.md, paddingBottom: 0 },
  subtitle: { fontSize: 13, color: colors.textMuted, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', paddingHorizontal: spacing.md, marginBottom: spacing.md, gap: spacing.sm },
  summaryCard: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center' },
  summaryValue: { fontSize: 24, fontWeight: '700', color: colors.text },
  summaryLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, paddingHorizontal: spacing.md, marginTop: spacing.md, marginBottom: spacing.sm },
  sectionSub: { fontSize: 12, color: colors.textMuted, paddingHorizontal: spacing.md, marginBottom: spacing.sm, marginTop: -spacing.sm },
  empty: { textAlign: 'center', color: colors.textMuted, padding: spacing.xl },
  statCard: { backgroundColor: colors.surface, marginHorizontal: spacing.md, marginBottom: spacing.sm, borderRadius: borderRadius.md, padding: spacing.md },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  statType: { fontWeight: '600', fontSize: 15, color: colors.text },
  statCount: { fontSize: 12, color: colors.textMuted },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  positive: { color: colors.success || '#4CAF50' },
  negative: { color: colors.error || '#F44336' },
  topicRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, marginHorizontal: spacing.md, marginBottom: spacing.xs, borderRadius: borderRadius.md, padding: spacing.md },
  topicName: { fontSize: 14, fontWeight: '500', color: colors.text },
  topicSubject: { fontSize: 11, color: colors.textMuted },
  changeValue: { fontSize: 16, fontWeight: '700' },
  effectiveCard: { backgroundColor: '#e8f5e9', marginHorizontal: spacing.md, marginBottom: spacing.xs, borderRadius: borderRadius.md, padding: spacing.md },
  effectiveTopic: { fontSize: 14, fontWeight: '600', color: colors.text },
  effectiveMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
