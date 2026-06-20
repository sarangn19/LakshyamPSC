import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useTranslation } from '../i18n/useTranslation';
import { colors, spacing, borderRadius, fontFamily } from '../theme';
import { typography } from '../theme/typography';
import { useUserStore, usePerformanceStore, useAuthStore } from '../store';
import { supabase } from '../services/supabase';
import { getLearnerProfile } from '../services/learnerStage';
import { getCognitiveTwinSummary } from '../services/cognitiveTwinRecommender';
import { computeCalibrationMetrics, getCalibrationInterpretation } from '../services/confidenceCalibration';

const TargetIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <Circle cx="10" cy="10" r="8" stroke={colors.primary} strokeWidth="1.5" />
    <Circle cx="10" cy="10" r="4" stroke={colors.primary} strokeWidth="1.5" />
    <Circle cx="10" cy="10" r="1.5" fill={colors.primary} />
  </Svg>
);

const CalendarIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <Rect x="2" y="3" width="16" height="15" rx="2" stroke={colors.primary} strokeWidth="1.5" />
    <Path d="M2 7H18" stroke={colors.primary} strokeWidth="1.5" />
    <Path d="M6 1V4" stroke={colors.primary} strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M14 1V4" stroke={colors.primary} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

const GlobeIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <Circle cx="10" cy="10" r="8" stroke={colors.primary} strokeWidth="1.5" />
    <Path d="M2 10H18" stroke={colors.primary} strokeWidth="1.5" />
    <Path d="M10 2C12.5 4.5 13.5 7 13.5 10C13.5 13 12.5 15.5 10 18" stroke={colors.primary} strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M10 2C7.5 4.5 6.5 7 6.5 10C6.5 13 7.5 15.5 10 18" stroke={colors.primary} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

const UploadIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <Path d="M10 14V4M10 4L6 8M10 4L14 8" stroke={colors.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M3 13V16H17V13" stroke={colors.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ShieldIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <Path d="M10 2L3 5V10C3 14 6 17.5 10 19C14 17.5 17 14 17 10V5L10 2Z" stroke={colors.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const WrenchIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <Path d="M14 2L11 5L12 7L9 10L7 9L3 14C3 14 3 16 4 17C5 18 7 18 7 18L12 13L11 11L14 8L16 9L19 6L17 4L14 6V2Z" stroke={colors.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LogoutIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <Path d="M8 17H4C3.44772 17 3 16.5523 3 16V4C3 3.44772 3.44772 3 4 3H8" stroke="#E53935" strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M13 14L17 10L13 6" stroke="#E53935" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M17 10H8" stroke="#E53935" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

export function ProfileScreen({ navigation }: any) {
  const { t, locale, setLocale, typography: tx } = useTranslation();
  const { targetExams, primaryExam, examDate, streak, masteredTopics, accuracyImprovement, userName } = useUserStore();
  const profile = usePerformanceStore((s) => s.profile);
  const { role, isAuthenticated, login } = useAuthStore();

  const displayName = userName || t('profile.pscAspirant');
  const hasData = streak.current > 0 || masteredTopics.length > 0 || (profile?.totalQuestionsAttempted ?? 0) > 0;

  const settings = [
    { icon: <TargetIcon />, label: t('profile.targetPosts'), value: targetExams.length > 0 ? targetExams.join(', ') : t('profile.notSet') },
    { icon: <CalendarIcon />, label: t('profile.examDate'), value: examDate || t('profile.notSet') },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarLarge}>
          <Text style={{ fontSize: 48, lineHeight: 56 }}>🧑‍🎓</Text>
        </View>
        <Text style={[tx.h2, { color: colors.text, marginTop: spacing.md }]}>{displayName}</Text>
        {primaryExam && (
          <Text style={[tx.caption, { color: colors.textSecondary }]}>
            {t('profile.tracking', { count: targetExams.length, exam: primaryExam })}
          </Text>
        )}
        {streak.current > 0 && (
          <View style={{ marginTop: spacing.sm, backgroundColor: colors.primary + '20', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.round }}>
            <Text style={[tx.small, { color: colors.primary }]}>{t('profile.streak', { days: streak.current })}</Text>
          </View>
        )}
      </View>

      {hasData ? (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[tx.h3, { color: colors.primary }]}>{streak.longest}</Text>
            <Text style={[tx.small, { color: colors.textMuted }]}>{t('profile.bestStreak')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[tx.h3, { color: colors.accentGreen }]}>{masteredTopics.length}</Text>
            <Text style={[tx.small, { color: colors.textMuted }]}>{t('profile.masteredTopics')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[tx.h3, { color: colors.info }]}>+{accuracyImprovement}%</Text>
            <Text style={[tx.small, { color: colors.textMuted }]}>{t('profile.accuracy')}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <TargetIcon />
          <Text style={[tx.caption, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm }]}>
            {t('profile.emptyStats')}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[tx.h3, { color: colors.text, marginBottom: spacing.md }]}>{t('profile.settings')}</Text>
        {settings.map((s) => (
          <TouchableOpacity key={s.label} style={styles.settingRow}>
            {s.icon}
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[tx.body, { color: colors.text }]}>{s.label}</Text>
              <Text style={[tx.small, { color: colors.textMuted }]}>{s.value}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <View style={styles.settingRow}>
          <GlobeIcon />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={[tx.body, { color: colors.text }]}>{t('profile.language')}</Text>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
            {role === 'superadmin' ? <ShieldIcon /> : <WrenchIcon />}
            <Text style={[tx.h3, { color: colors.text }]}>{t('profile.adminPortal')}</Text>
          </View>
          {!isAuthenticated ? (
            <TouchableOpacity
              style={styles.adminLoginBtn}
              onPress={async () => {
                const ok = await login('admin@lakshyam.app', 'admin123', role);
                if (ok) navigation.navigate(role === 'superadmin' ? 'SuperAdminPortal' : 'AdminPortal');
              }}
            >
              <Text style={[tx.bodyBold, { color: '#fff' }]}>
                {t('profile.loginAs')} {role}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.adminLoginBtn}
              onPress={() => navigation.navigate(role === 'superadmin' ? 'SuperAdminPortal' : 'AdminPortal')}
            >
              <Text style={[tx.bodyBold, { color: '#fff' }]}>
                {t('profile.openPortal')}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('BulkUpload')}
          >
            <UploadIcon />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[tx.body, { color: colors.text }]}>Bulk Upload Questions</Text>
              <Text style={[tx.small, { color: colors.textMuted }]}>JSON / CSV / file upload</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('Bookmarks')}
          >
            <Text style={{ fontSize: 18 }}>🔖</Text>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[tx.body, { color: colors.text }]}>Bookmarked Questions</Text>
              <Text style={[tx.small, { color: colors.textMuted }]}>Questions you saved during practice</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {hasData && (
        <View style={styles.section}>
          <Text style={[tx.h3, { color: colors.text, marginBottom: spacing.md }]}>{t('profile.studyStatistics')}</Text>
          <View style={styles.statItem}>
            <Text style={[tx.caption, { color: colors.textSecondary }]}>{t('profile.totalDaysStudied')}</Text>
            <Text style={[tx.bodyBold, { color: colors.text }]}>{streak.dates.length} days</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[tx.caption, { color: colors.textSecondary }]}>{t('profile.topicsMastered')}</Text>
            <Text style={[tx.bodyBold, { color: colors.text }]}>{masteredTopics.length} topics</Text>
          </View>
          {profile && (
            <View style={styles.statItem}>
              <Text style={[tx.caption, { color: colors.textSecondary }]}>{t('profile.questionsAttempted')}</Text>
              <Text style={[tx.bodyBold, { color: colors.text }]}>{profile.totalQuestionsAttempted}</Text>
            </View>
          )}
        </View>
      )}

      {hasData && (() => {
        const lp = getLearnerProfile();
        const cs = getCognitiveTwinSummary();
        return (
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
              <Text style={[tx.h3, { color: colors.text }]}>Learning Profile</Text>
              <View style={{ backgroundColor: '#E8EDF5', borderRadius: 999, paddingHorizontal: 10, height: 22, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#4D5F81', letterSpacing: 0.5, textTransform: 'capitalize' }}>{lp.stage}</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <Text style={[tx.caption, { color: colors.textSecondary }]}>Stage</Text>
              <Text style={[tx.bodyBold, { color: colors.text, textTransform: 'capitalize' }]}>{lp.stage}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[tx.caption, { color: colors.textSecondary }]}>Total Questions</Text>
              <Text style={[tx.bodyBold, { color: colors.text }]}>{lp.totalQuestions}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[tx.caption, { color: colors.textSecondary }]}>Sessions Completed</Text>
              <Text style={[tx.bodyBold, { color: colors.text }]}>{lp.sessionCount}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[tx.caption, { color: colors.textSecondary }]}>Overall Mastery</Text>
              <Text style={[tx.bodyBold, { color: colors.text }]}>{cs.overallMastery}%</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[tx.caption, { color: colors.textSecondary }]}>Open Gaps</Text>
              <Text style={[tx.bodyBold, { color: colors.text }]}>{cs.openGaps}</Text>
            </View>
            {cs.strongestSubject && (
              <View style={styles.statItem}>
                <Text style={[tx.caption, { color: colors.textSecondary }]}>Strongest Subject</Text>
                <Text style={[tx.bodyBold, { color: colors.text }]}>{cs.strongestSubject}</Text>
              </View>
            )}
            {cs.weakestSubject && (
              <View style={styles.statItem}>
                <Text style={[tx.caption, { color: colors.textSecondary }]}>Weakest Subject</Text>
                <Text style={[tx.bodyBold, { color: colors.text }]}>{cs.weakestSubject}</Text>
              </View>
            )}
          </View>
        );
      })()}

      {hasData && (() => {
        const cal = computeCalibrationMetrics(usePerformanceStore.getState().confidenceRecords);
        if (cal.totalRecords < 3) return null;
        return (
          <View style={styles.section}>
            <Text style={[tx.h3, { color: colors.text, marginBottom: spacing.md }]}>Confidence Calibration</Text>
            <View style={styles.statItem}>
              <Text style={[tx.caption, { color: colors.textSecondary }]}>Calibration Score</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[tx.bodyBold, { color: cal.calibrationScore >= 70 ? colors.status.strong : colors.status.weakArea }]}>{cal.calibrationScore}%</Text>
                <View style={{ flex: 1, height: 4, backgroundColor: colors.border, borderRadius: 2 }}>
                  <View style={{ width: `${cal.calibrationScore}%`, height: 4, backgroundColor: cal.calibrationScore >= 70 ? colors.status.strong : colors.status.weakArea, borderRadius: 2 }} />
                </View>
              </View>
            </View>
            <View style={styles.statItem}>
              <Text style={[tx.caption, { color: colors.textSecondary }]}>Overconfidence</Text>
              <Text style={[tx.bodyBold, { color: cal.overconfidenceRate > 30 ? colors.error : colors.text }]}>{cal.overconfidenceRate}%</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[tx.caption, { color: colors.textSecondary }]}>Underconfidence</Text>
              <Text style={[tx.bodyBold, { color: cal.underconfidenceRate > 30 ? colors.warning : colors.text }]}>{cal.underconfidenceRate}%</Text>
            </View>
            <Text style={[tx.tiny, { color: colors.textSecondary, marginTop: 4, fontStyle: 'italic' }]}>{getCalibrationInterpretation(cal)}</Text>
          </View>
        );
      })()}

      <View style={styles.section}>
        <Text style={[tx.h3, { color: colors.text, marginBottom: spacing.md }]}>{t('profile.about')}</Text>
        <Text style={[tx.caption, { color: colors.textSecondary }]}>
          {t('profile.aboutText')}
        </Text>
        <Text style={[tx.small, { color: colors.textMuted, marginTop: spacing.md }]}>{t('profile.version')}</Text>
      </View>

      {hasData && (
        <TouchableOpacity style={styles.logoutBtn} onPress={() => {}}>
          <Text style={[tx.bodyBold, { color: colors.textSecondary }]}>{t('profile.resetData')}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={[styles.logoutBtn, styles.logoutDanger]} onPress={async () => {
        if (supabase) await supabase.auth.signOut().catch(() => {});
        useAuthStore.getState().logout();
      }}>
        <LogoutIcon />
        <Text style={[tx.bodyBold, { color: '#E53935', marginLeft: spacing.sm }]}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  profileHeader: { alignItems: 'center', paddingTop: spacing.md, paddingBottom: spacing.xl },
  avatarLarge: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.primary },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  emptyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    padding: spacing.md,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  section: {
    backgroundColor: colors.bgCard,
    borderRadius: 24,
    padding: spacing.lg,
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
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutDanger: { borderColor: '#E5393530' },
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
