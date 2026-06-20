import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getLearningForecast } from '../services/learningForecast';
import { getCognitiveTwinSummary } from '../services/cognitiveTwinRecommender';
import { colors, fontFamily } from '../theme';

export function KnowledgeDashboard() {
  const forecast = getLearningForecast();
  const summary = getCognitiveTwinSummary();

  const ringColor = forecast.onTrack ? '#32CD32' : '#FF8C00';
  const pct = Math.min(100, Math.max(0, summary.overallMastery));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Knowledge</Text>
        <Text style={styles.status}>{forecast.onTrack ? 'On Track' : 'Needs Focus'}</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: ringColor }]}>{pct}%</Text>
          <Text style={styles.statLabel}>Mastery</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{forecast.coveragePercent}%</Text>
          <Text style={styles.statLabel}>Coverage</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{forecast.daysToExam}d</Text>
          <Text style={styles.statLabel}>To Exam</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: '#1E90FF' }]}>{forecast.recommendedDaily}</Text>
          <Text style={styles.statLabel}>Qns/Day</Text>
        </View>
      </View>

      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: ringColor }]} />
      </View>

      <View style={styles.projectionRow}>
        <Text style={styles.projLabel}>Projected by exam:</Text>
        <Text style={[styles.projValue, { color: forecast.onTrack ? '#32CD32' : '#FF8C00' }]}>
          {forecast.projectedMastery}% mastery
        </Text>
      </View>

      {summary.weakestSubject && (
        <Text style={styles.weakText}>
          Weakest: {summary.weakestSubject} · Strongest: {summary.strongestSubject}
        </Text>
      )}

      {forecast.blockingTopics.length > 0 && (
        <View style={styles.blockSection}>
          <Text style={styles.blockTitle}>Blocking topics:</Text>
          {forecast.blockingTopics.slice(0, 3).map((b, i) => (
            <Text key={i} style={styles.blockItem}>
              {b.subject} › {b.topic} — {b.mastery}%
            </Text>
          ))}
        </View>
      )}

      {summary.openGaps > 0 && (
        <Text style={styles.gapText}>{summary.openGaps} open knowledge gap{summary.openGaps > 1 ? 's' : ''} identified</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    fontFamily: fontFamily.bodyMedium,
  },
  status: {
    fontSize: 13,
    fontWeight: '500',
    color: '#32CD32',
    fontFamily: fontFamily.bodyMedium,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stat: { alignItems: 'center', flex: 1 },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    fontFamily: fontFamily.bodyMedium,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.5)',
    fontFamily: fontFamily.body,
    marginTop: 2,
  },
  barBg: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  barFill: { height: 6, borderRadius: 3 },
  projectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  projLabel: { fontSize: 12, color: 'rgba(0,0,0,0.5)', fontFamily: fontFamily.body },
  projValue: { fontSize: 12, fontWeight: '600', fontFamily: fontFamily.bodyMedium },
  weakText: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.5)',
    fontFamily: fontFamily.body,
    marginBottom: 4,
  },
  blockSection: { marginTop: 8 },
  blockTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FF6347',
    fontFamily: fontFamily.bodyMedium,
    marginBottom: 4,
  },
  blockItem: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.6)',
    fontFamily: fontFamily.body,
    lineHeight: 16,
  },
  gapText: {
    fontSize: 11,
    color: '#FF8C00',
    fontFamily: fontFamily.body,
    marginTop: 8,
  },
});
