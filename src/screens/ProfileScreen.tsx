import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from '../i18n/useTranslation';
import { colors, spacing, borderRadius, fontFamily } from '../theme';
import { typography } from '../theme/typography';
import { useUserStore, usePerformanceStore, useAuthStore } from '../store';
import { supabase } from '../services/supabase';

export function ProfileScreen({ navigation }: any) {
  const { t, locale, setLocale } = useTranslation();
  const { targetExams, primaryExam, examDate, streak, masteredTopics, accuracyImprovement, userName } = useUserStore();
  const profile = usePerformanceStore((s) => s.profile);
  const { role, isAuthenticated, login } = useAuthStore();

  const displayName = userName || t('profile.pscAspirant');
  const hasData = streak.current > 0 || masteredTopics.length > 0 || (profile?.totalQuestionsAttempted ?? 0) > 0;

  const settings = [
    { icon: '🎯', label: t('profile.targetPosts'), value: targetExams.length > 0 ? targetExams.join(', ') : t('profile.notSet') },
    { icon: '📅', label: t('profile.examDate'), value: examDate || t('profile.notSet') },
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
            {t('profile.tracking', { count: targetExams.length, exam: primaryExam })}
          </Text>
        )}
        {streak.current > 0 && (
          <View style={{ marginTop: spacing.sm, backgroundColor: colors.primary + '20', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.round }}>
            <Text style={[typography.small, { color: colors.primary }]}>{t('profile.streak', { days: streak.current })}</Text>
          </View>
        )}
      </View>

      {hasData ? (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[typography.h3, { color: colors.primary }]}>{streak.longest}</Text>
            <Text style={[typography.small, { color: colors.textMuted }]}>{t('profile.bestStreak')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[typography.h3, { color: colors.accentGreen }]}>{masteredTopics.length}</Text>
            <Text style={[typography.small, { color: colors.textMuted }]}>{t('profile.masteredTopics')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[typography.h3, { color: colors.info }]}>+{accuracyImprovement}%</Text>
            <Text style={[typography.small, { color: colors.textMuted }]}>{t('profile.accuracy')}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={{ fontSize: 24, textAlign: 'center' }}>📊</Text>
          <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm }]}>
            {t('profile.emptyStats')}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>{t('profile.settings')}</Text>
        {settings.map((s) => (
          <TouchableOpacity key={s.label} style={styles.settingRow}>
            <Text style={{ fontSize: 20 }}>{s.icon}</Text>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[typography.body, { color: colors.text }]}>{s.label}</Text>
              <Text style={[typography.small, { color: colors.textMuted }]}>{s.value}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <View style={styles.settingRow}>
          <Text style={{ fontSize: 20 }}>🌐</Text>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={[typography.body, { color: colors.text }]}>{t('profile.language')}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <TouchableOpacity
              onPress={() => setLocale('en')}
              style={[styles.langBtn, locale === 'en' && styles.langBtnActive]}
            >
              <Text style={[styles.langBtnText, locale === 'en' && styles.langBtnTextActive]}>{t('profile.english')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setLocale('ml')}
              style={[styles.langBtn, locale === 'ml' && styles.langBtnActive]}
            >
              <Text style={[styles.langBtnText, locale === 'ml' && styles.langBtnTextActive]}>{t('profile.malayalam')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {(role === 'admin' || role === 'superadmin') && (
        <View style={styles.section}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>
            {role === 'superadmin' ? '🛡️' : '🔧'} {t('profile.adminPortal')}
          </Text>
          {!isAuthenticated ? (
            <TouchableOpacity
              style={styles.adminLoginBtn}
              onPress={async () => {
                const ok = await login('admin@lakshyam.app', 'admin123', role);
                if (ok) navigation.navigate(role === 'superadmin' ? 'SuperAdminPortal' : 'AdminPortal');
              }}
            >
              <Text style={[typography.bodyBold, { color: '#fff' }]}>
                {t('profile.loginAs')} {role}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.adminLoginBtn}
              onPress={() => navigation.navigate(role === 'superadmin' ? 'SuperAdminPortal' : 'AdminPortal')}
            >
              <Text style={[typography.bodyBold, { color: '#fff' }]}>
                {t('profile.openPortal')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {hasData && (
        <View style={styles.section}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>{t('profile.studyStatistics')}</Text>
          <View style={styles.statItem}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('profile.totalDaysStudied')}</Text>
            <Text style={[typography.bodyBold, { color: colors.text }]}>{streak.dates.length} days</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('profile.topicsMastered')}</Text>
            <Text style={[typography.bodyBold, { color: colors.text }]}>{masteredTopics.length} topics</Text>
          </View>
          {profile && (
            <View style={styles.statItem}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('profile.questionsAttempted')}</Text>
              <Text style={[typography.bodyBold, { color: colors.text }]}>{profile.totalQuestionsAttempted}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>{t('profile.about')}</Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {t('profile.aboutText')}
        </Text>
        <Text style={[typography.small, { color: colors.textMuted, marginTop: spacing.md }]}>{t('profile.version')}</Text>
      </View>

      {hasData && (
        <TouchableOpacity style={styles.logoutBtn} onPress={() => {}}>
          <Text style={[typography.bodyBold, { color: colors.secondary }]}>{t('profile.resetData')}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={async () => {
        if (supabase) await supabase.auth.signOut().catch(() => {});
        useAuthStore.getState().logout();
      }}>
        <Text style={[typography.bodyBold, { color: '#E53935' }]}>Logout</Text>
      </TouchableOpacity>

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
  langBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  langBtnText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  langBtnTextActive: {
    color: '#fff',
    fontWeight: '600',
    fontFamily: fontFamily.bodyMedium,
  },
  adminLoginBtn: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
});
