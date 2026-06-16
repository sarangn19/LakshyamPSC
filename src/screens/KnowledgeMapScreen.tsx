import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { typography } from '../theme/typography';
import { syllabus, Subject } from '../data/syllabus';
import { useMCQStore } from '../store';
import { ProgressBar, Badge } from '../components/common/StyledComponents';

const subjectIcons: Record<string, string> = {
  'Kerala History': '📜',
  'Renaissance': '💡',
  'Constitution': '⚖️',
  'Geography': '🌍',
  'Current Affairs': '📰',
  'Science': '🔬',
  'Quantitative Aptitude': '🧮',
  'Mental Ability': '🧠',
  'Malayalam': '📝',
};

export function KnowledgeMapScreen() {
  const subjectProgress = useMCQStore((s) => s.subjectProgress);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const getProgress = (name: string) => {
    const p = subjectProgress.find((s) => s.subjectName === name);
    return p || { completionPercent: 0, accuracyPercent: 0, confidenceScore: 0, revisionStatus: 'needs_attention' as const };
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'good': return colors.accentGreen;
      case 'needs_attention': return colors.warning;
      case 'critical': return colors.error;
      default: return colors.textMuted;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={[typography.h2, { color: colors.text, paddingTop: spacing.lg }]}>Knowledge Map</Text>
      <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>Visual overview of your entire syllabus</Text>

      {syllabus.map((subject) => {
        const progress = getProgress(subject.name);
        const isExpanded = expandedSubject === subject.id;
        const confColor = progress.confidenceScore > 70 ? colors.accentGreen : progress.confidenceScore > 45 ? colors.warning : colors.error;

        return (
          <TouchableOpacity
            key={subject.id}
            style={styles.subjectCard}
            onPress={() => setExpandedSubject(isExpanded ? null : subject.id)}
            activeOpacity={0.8}
          >
            <View style={styles.subjectHeader}>
              <View style={styles.subjectLeft}>
                <Text style={{ fontSize: 28, marginRight: spacing.md }}>{subjectIcons[subject.name] || '📘'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyBold, { color: colors.text }]}>{subject.name}</Text>
                  <View style={styles.subjectMeta}>
                    <ProgressBar percent={progress.completionPercent} color={confColor} height={4} />
                    <Text style={[typography.tiny, { color: colors.textMuted, marginLeft: spacing.sm }]}>{progress.completionPercent}%</Text>
                  </View>
                </View>
              </View>
              <View style={styles.subjectStats}>
                <Text style={[typography.h3, { color: confColor }]}>{progress.confidenceScore}</Text>
                <Badge label={progress.revisionStatus.replace('_', ' ')} color={statusColor(progress.revisionStatus)} />
                <Text style={{ fontSize: 16, color: colors.textMuted, marginLeft: spacing.sm }}>{isExpanded ? '▼' : '▶'}</Text>
              </View>
            </View>

            {isExpanded && (
              <View style={styles.topicsWrap}>
                {subject.topics.map((topic) => (
                  <View key={topic.id} style={styles.topicRow}>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>• {topic.name}</Text>
                    <View style={styles.subtopics}>
                      {topic.subtopics.map((st) => (
                        <Badge key={st.id} label={st.name} color={colors.textMuted} />
                      ))}
                    </View>
                  </View>
                ))}

                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={[typography.small, { color: colors.textMuted }]}>Accuracy</Text>
                    <Text style={[typography.h4, { color: progress.accuracyPercent > 70 ? colors.accentGreen : colors.warning }]}>{progress.accuracyPercent}%</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[typography.small, { color: colors.textMuted }]}>Confidence</Text>
                    <Text style={[typography.h4, { color: confColor }]}>{progress.confidenceScore}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[typography.small, { color: colors.textMuted }]}>Topics</Text>
                    <Text style={[typography.h4, { color: colors.text }]}>{subject.topics.length}</Text>
                  </View>
                </View>
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  subjectCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subjectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subjectLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  subjectMeta: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  subjectStats: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  topicsWrap: { marginTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  topicRow: { marginBottom: spacing.md },
  subtopics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  statBox: {
    flex: 1,
    backgroundColor: colors.bgInput,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
});
