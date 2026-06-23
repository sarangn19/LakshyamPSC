import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { BottomNav } from '../components/BottomNav';
import { supabase } from '../services/supabase';

interface CorpusHealth {
  total_questions: number;
  questions_with_answer: number;
  answer_coverage_pct: number;
  questions_with_options: number;
  option_coverage_pct: number;
  all_four_options_pct: number;
  duplicate_pairs: number;
  duplicate_questions_pct: number;
  topics_covered: number;
  topic_coverage_pct: number;
  subjects_covered: number;
  exams_total: number;
  years_covered: number;
  avg_questions_per_exam: number;
  total_recommendation_sessions: number;
  last_updated: string;
}

export async function getCorpusHealth(): Promise<CorpusHealth | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('get_corpus_health');
  if (error || !data) {
    console.error('get_corpus_health failed:', error);
    return null;
  }
  // RPC now returns a JSONB object matching CorpusHealth interface
  return data as unknown as CorpusHealth;
}

export function CorpusHealthScreen({ navigation }: any) {
  const [health, setHealth] = useState<CorpusHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCorpusHealth().then(h => { setHealth(h); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <BottomNav activeTab="Learn" />
        <ActivityIndicator size="large" color={colors.primary} style={{ margin: 40 }} />
      </View>
    );
  }

  const metrics = health ? [
    { label: 'Total Questions', value: health.total_questions.toLocaleString(), pct: null },
    { label: 'Questions with Answer', value: health.questions_with_answer.toLocaleString(), pct: `${health.answer_coverage_pct}%` },
    { label: 'Questions with Options', value: health.questions_with_options.toLocaleString(), pct: `${health.option_coverage_pct}%` },
    { label: 'All 4 Options (Full Recovery)', value: health.total_questions.toLocaleString(), pct: `${health.all_four_options_pct}%` },
    { label: 'Duplicate Pairs', value: health.duplicate_pairs.toLocaleString(), pct: `${health.duplicate_questions_pct}%` },
    { label: 'Topics Covered', value: health.topics_covered.toLocaleString(), pct: `${health.topic_coverage_pct}%` },
    { label: 'Subjects Covered', value: health.subjects_covered.toLocaleString(), pct: null },
    { label: 'Total Exams', value: health.exams_total.toLocaleString(), pct: null },
    { label: 'Years Covered', value: health.years_covered.toLocaleString(), pct: null },
    { label: 'Avg Questions / Exam', value: health.avg_questions_per_exam.toFixed(1), pct: null },
    { label: 'Recommendation Sessions', value: health.total_recommendation_sessions.toLocaleString(), pct: null },
  ] : [];

  return (
    <View style={styles.container}>
      <BottomNav activeTab="Learn" />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={styles.title}>Corpus Health</Text>
        <Text style={styles.subtitle}>Completeness and quality metrics for the PSC question bank</Text>

        {!health ? (
          <Text style={styles.empty}>Unable to load corpus health data</Text>
        ) : (
          <>
            {/* Coverage cards */}
            <View style={styles.coverRow}>
              {[
                { label: 'Answers', value: `${health.answer_coverage_pct}%`, color: colors.success },
                { label: 'Options', value: `${health.option_coverage_pct}%`, color: colors.primary },
                { label: 'All-4', value: `${health.all_four_options_pct}%`, color: colors.accent },
                { label: 'Topics', value: `${health.topic_coverage_pct}%`, color: colors.warning },
              ].map(c => (
                <View key={c.label} style={styles.coverCard}>
                  <Text style={[styles.coverValue, { color: c.color }]}>{c.value}</Text>
                  <Text style={styles.coverLabel}>{c.label}</Text>
                </View>
              ))}
            </View>

            {/* All metrics */}
            <Text style={styles.sectionTitle}>All Metrics</Text>
            {metrics.map(m => (
              <View key={m.label} style={styles.metricRow}>
                <Text style={styles.metricLabel}>{m.label}</Text>
                <Text style={styles.metricValue}>
                  {m.value}{m.pct != null ? ` (${m.pct})` : ''}
                </Text>
              </View>
            ))}

            <Text style={styles.updated}>Last updated: {new Date(health.last_updated).toLocaleString()}</Text>
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
  empty: { textAlign: 'center', color: colors.textMuted, padding: spacing.xl },
  coverRow: { flexDirection: 'row', paddingHorizontal: spacing.md, marginBottom: spacing.md, gap: spacing.sm },
  coverCard: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center' },
  coverValue: { fontSize: 24, fontWeight: '700' },
  coverLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, paddingHorizontal: spacing.md, marginTop: spacing.md, marginBottom: spacing.sm },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.surface, marginHorizontal: spacing.md, marginBottom: spacing.xs, borderRadius: borderRadius.md, padding: spacing.md },
  metricLabel: { fontSize: 14, color: colors.text, flex: 1 },
  metricValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  updated: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
});
