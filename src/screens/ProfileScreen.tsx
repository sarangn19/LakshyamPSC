import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { typography } from '../theme/typography';
import { useUserStore, usePerformanceStore } from '../store';

export function ProfileScreen() {
  const { targetExams, primaryExam, examDate, streak, masteredTopics, accuracyImprovement, userName } = useUserStore();
  const profile = usePerformanceStore((s) => s.profile);

  const displayName = userName || 'PSC Aspirant';
  const hasData = streak.current > 0 || masteredTopics.length > 0 || (profile?.totalQuestionsAttempted ?? 0) > 0;

  const settings = [
    { icon: '🎯', label: 'Target Posts', value: targetExams.length > 0 ? targetExams.join(', ') : 'Not set' },
    { icon: '📅', label: 'Exam Date', value: examDate || 'Not set' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarLarge}>
          <Text style={{ fontSize: 48 }}>🧑‍🎓</Text>
        </View>
        <Text style={[typography.h2, { color: colors.text, marginTop: spacing.md }]}>{displayName}</Text>
        {primaryExam && (
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            Tracking: {targetExams.length} post{targetExams.length > 1 ? 's' : ''} • Primary: {primaryExam}
          </Text>
        )}
        {streak.current > 0 && (
          <View style={{ marginTop: spacing.sm, backgroundColor: colors.primary + '20', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.round }}>
            <Text style={[typography.small, { color: colors.primary }]}>🔥 Streak {streak.current} days</Text>
          </View>
        )}
      </View>

      {hasData ? (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[typography.h3, { color: colors.primary }]}>{streak.longest}</Text>
            <Text style={[typography.small, { color: colors.textMuted }]}>Best Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[typography.h3, { color: colors.accentGreen }]}>{masteredTopics.length}</Text>
            <Text style={[typography.small, { color: colors.textMuted }]}>Mastered Topics</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[typography.h3, { color: colors.info }]}>+{accuracyImprovement}%</Text>
            <Text style={[typography.small, { color: colors.textMuted }]}>Accuracy</Text>
          </View>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={{ fontSize: 24, textAlign: 'center' }}>📊</Text>
          <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm }]}>
            Complete your first session to see study statistics
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>⚙️ Settings</Text>
        {settings.map((s) => (
          <TouchableOpacity key={s.label} style={styles.settingRow}>
            <Text style={{ fontSize: 20 }}>{s.icon}</Text>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[typography.body, { color: colors.text }]}>{s.label}</Text>
              <Text style={[typography.small, { color: colors.textMuted }]}>{s.value}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {hasData && (
        <View style={styles.section}>
          <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>📊 Study Statistics</Text>
          <View style={styles.statItem}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Total Days Studied</Text>
            <Text style={[typography.bodyBold, { color: colors.text }]}>{streak.dates.length} days</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Topics Mastered</Text>
            <Text style={[typography.bodyBold, { color: colors.text }]}>{masteredTopics.length} topics</Text>
          </View>
          {profile && (
            <View style={styles.statItem}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>Questions Attempted</Text>
              <Text style={[typography.bodyBold, { color: colors.text }]}>{profile.totalQuestionsAttempted}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>❓ About Lakshyam</Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          Lakshyam is an AI-powered learning assistant for Kerala PSC aspirants.
        </Text>
        <Text style={[typography.small, { color: colors.textMuted, marginTop: spacing.md }]}>Version 1.0.0</Text>
      </View>

      {hasData && (
        <TouchableOpacity style={styles.logoutBtn}>
          <Text style={[typography.bodyBold, { color: colors.secondary }]}>Reset Data</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  profileHeader: { alignItems: 'center', paddingTop: spacing.lg, paddingBottom: spacing.xl },
  avatarLarge: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.primary },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  emptyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  section: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  logoutBtn: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.secondary + '30',
  },
});
