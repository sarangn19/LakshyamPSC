import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { typography } from '../theme/typography';
import { useFlashcardStore, useMCQStore } from '../store';
import { Badge, SectionHeader, ProgressBar } from '../components/common/StyledComponents';

export function RevisionHubScreen({ navigation }: any) {
  const getDueCount = useFlashcardStore((s) => s.getDueCount);
  const mistakes = useMCQStore((s) => s.mistakes);

  const unreviewedMistakes = mistakes.filter((m) => !m.reviewed);
  const subjectMistakes: Record<string, number> = {};
  unreviewedMistakes.forEach((m) => { subjectMistakes[m.subject] = (subjectMistakes[m.subject] || 0) + 1; });
  const weakSubjects = Object.entries(subjectMistakes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2);

  const revisionItems = [
    { label: 'Flashcards Due', value: getDueCount(), icon: '🃏', color: colors.info },
    { label: 'Mistakes to Review', value: unreviewedMistakes.length, icon: '📓', color: colors.secondary },
    { label: 'Weak Topics', value: weakSubjects.length, icon: '🎯', color: colors.warning },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={[typography.h2, { color: colors.text, paddingTop: spacing.huge }]}>Revision Hub</Text>
      <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>Based on your forgetting curve</Text>

      <View style={styles.todaySection}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>📅 Today's Revision Plan</Text>
        <View style={styles.planRow}>
          {revisionItems.map((item) => (
            <View key={item.label} style={[styles.planCard, { borderLeftColor: item.color }]}>
              <Text style={{ fontSize: 28 }}>{item.icon}</Text>
              <Text style={[typography.h2, { color: item.color, marginTop: spacing.sm }]}>{item.value}</Text>
              <Text style={[typography.small, { color: colors.textSecondary, textAlign: 'center' }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
          <Text style={[typography.bodyBold, { color: colors.white }]}>Start Today's Revision →</Text>
        </TouchableOpacity>
      </View>

      {weakSubjects.length > 0 && (
        <View style={styles.weakSection}>
          <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>🎯 Topics Needing Attention</Text>
          {weakSubjects.map(([subject, count]) => (
            <View key={subject} style={styles.weakRow}>
              <Badge label={subject} color={colors.warning} />
              <Text style={[typography.caption, { color: colors.textMuted }]}>{count} mistakes</Text>
              <ProgressBar percent={(count / Math.max(...Object.values(subjectMistakes))) * 100} color={colors.secondary} height={4} />
            </View>
          ))}
        </View>
      )}

      <View style={styles.sprintSection}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>⚡ 7-Day Sprint</Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.md }]}>Intensive revision plan for upcoming exams</Text>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.accent }]}>
          <Text style={[typography.bodyBold, { color: colors.black }]}>Start 7-Day Sprint</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.capsuleSection}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>💊 Last Minute Capsule</Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.md }]}>High-frequency topics and expected areas</Text>

        {[
          { title: 'Kerala Renaissance - Top 20 Facts', subject: 'Renaissance', items: '20 facts' },
          { title: 'Constitution - Key Articles', subject: 'Constitution', items: '15 articles' },
          { title: 'Kerala Districts - Quick Recap', subject: 'Geography', items: '14 districts' },
        ].map((capsule) => (
          <TouchableOpacity key={capsule.title} style={styles.capsuleCard}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyBold, { color: colors.text }]}>{capsule.title}</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
                <Badge label={capsule.subject} color={colors.primaryLight} />
                <Text style={[typography.small, { color: colors.textMuted }]}>{capsule.items}</Text>
              </View>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.flashcardPreview}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
          <Text style={[typography.h4, { color: colors.text }]}>🃏 Spaced Repetition</Text>
          <Badge label={`${getDueCount()} due`} color={colors.info} />
        </View>
        <View style={styles.repRow}>
          {[
            { label: '1 Day', active: true },
            { label: '3 Days', active: false },
            { label: '7 Days', active: false },
            { label: '15 Days', active: false },
            { label: '30 Days', active: false },
          ].map((day) => (
            <View key={day.label} style={[styles.repDot, day.active && styles.repDotActive]}>
              <Text style={[typography.tiny, { color: day.active ? colors.primary : colors.textMuted }]}>{day.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  todaySection: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  planCard: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderLeftWidth: 3,
  },
  actionBtn: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  weakSection: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weakRow: { marginBottom: spacing.sm },
  sprintSection: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  capsuleSection: { marginTop: spacing.xl },
  capsuleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  flashcardPreview: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.huge,
    borderWidth: 1,
    borderColor: colors.border,
  },
  repRow: { flexDirection: 'row', justifyContent: 'space-between' },
  repDot: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.bgInput,
  },
  repDotActive: { backgroundColor: colors.primary + '20' },
});
