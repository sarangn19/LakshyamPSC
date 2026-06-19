import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { colors, spacing, borderRadius, fontFamily } from '../../theme';
import { typography } from '../../theme/typography';
import { useTranslation } from '../../i18n/useTranslation';
import { useAuthStore } from '../../store';
import { fetchTotalLearners, fetchActiveLearnersToday, fetchSessionCompletionRate, fetchAverageAccuracy, fetchTotalAttempts, fetchTotalSessions, fetchPendingFlaggedCount, fetchDraftCACount, fetchOpenTicketCount, fetchCriticalTicketCount, fetchRevisionAdherenceRate, fetchRecommendationsAccepted } from '../../services/adminDataService';

export function AdminDashboardScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { role } = useAuthStore();

  const [questionBankStats, setQuestionBankStats] = useState<{ mcqCount: number; flashcardCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLearners, setActiveLearners] = useState<number | null>(null);
  const [sessionCompletion, setSessionCompletion] = useState<number | null>(null);
  const [avgAccuracy, setAvgAccuracy] = useState<number | null>(null);
  const [totalLearners, setTotalLearners] = useState<number | null>(null);
  const [totalAttempts, setTotalAttempts] = useState<number | null>(null);
  const [totalSessions, setTotalSessions] = useState<number | null>(null);
  const [revisionAdherenceRate, setRevisionAdherenceRate] = useState<number | null>(null);
  const [recommendationsAccepted, setRecommendationsAccepted] = useState<number | null>(null);
  const [pendingFlags, setPendingFlags] = useState(0);
  const [draftCA, setDraftCA] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);
  const [criticalTickets, setCriticalTickets] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async () => {
    try {
      const [tl, al, sc, aa, ta, ts, ra, rec, pf, dc, ot, ct] = await Promise.all([
        fetchTotalLearners(),
        fetchActiveLearnersToday(),
        fetchSessionCompletionRate(),
        fetchAverageAccuracy(),
        fetchTotalAttempts(),
        fetchTotalSessions(),
        fetchRevisionAdherenceRate(),
        fetchRecommendationsAccepted(),
        fetchPendingFlaggedCount(),
        fetchDraftCACount(),
        fetchOpenTicketCount(),
        fetchCriticalTicketCount(),
      ]);
      setTotalLearners(tl);
      setActiveLearners(al);
      setSessionCompletion(Math.round(sc * 100));
      setAvgAccuracy(Math.round(aa * 100));
      setTotalAttempts(ta);
      setTotalSessions(ts);
      setRevisionAdherenceRate(Math.round(ra * 100));
      setRecommendationsAccepted(rec);
      setPendingFlags(pf);
      setDraftCA(dc);
      setOpenTickets(ot);
      setCriticalTickets(ct);
    } catch (err) {
      console.error('Failed to fetch KPIs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  useEffect(() => { loadDashboard(); }, []);

  useEffect(() => {
    fetchQuestionBankStats();
  }, []);

  const fetchQuestionBankStats = async () => {
    try {
      const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/question-bank-stats`, {
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setQuestionBankStats({ mcqCount: data.mcqCount, flashcardCount: data.flashcardCount });
      }
    } catch (error) {
      console.error('Failed to fetch question bank stats:', error);
    }
  };

  const kpiCards = [
    { label: t('admin.activeLearners'), value: activeLearners !== null ? activeLearners.toString() : '--', icon: '👥', color: colors.primary, action: 'View learners' },
    { label: t('admin.sessionCompletion'), value: sessionCompletion !== null ? `${sessionCompletion}%` : '--', icon: '✅', color: colors.success, action: 'Improve' },
    { label: t('admin.revisionAdherence'), value: revisionAdherenceRate !== null ? `${revisionAdherenceRate}%` : '--', icon: '🔄', color: colors.info, action: 'Review' },
    { label: t('admin.avgAccuracy'), value: avgAccuracy !== null ? `${avgAccuracy}%` : '--', icon: '📈', color: colors.warning, action: 'Analyze' },
    { label: t('admin.recommendationsAccepted'), value: recommendationsAccepted !== null ? `${recommendationsAccepted}` : '--', icon: '🎯', color: colors.accent, action: 'Tune' },
    { label: 'Stored MCQs', value: questionBankStats?.mcqCount?.toString() || '0', icon: '📝', color: colors.primary, action: 'View bank' },
    { label: 'Stored Flashcards', value: questionBankStats?.flashcardCount?.toString() || '0', icon: '🎴', color: colors.success, action: 'View bank' },
  ];

  return (
    <ScrollView style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
      <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.xs }]}>
        {t('admin.dashboardTitle')}
      </Text>
      <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
        {role === 'superadmin' ? t('admin.superAdminView') : t('admin.adminView')}
      </Text>

      <View style={styles.kpiGrid}>
        {kpiCards.map((kpi) => (
          <TouchableOpacity
            key={kpi.label}
            style={[styles.kpiCard, { borderLeftColor: kpi.color }]}
            onPress={() => {}}
          >
            <Text style={{ fontSize: 24 }}>{kpi.icon}</Text>
            <Text style={[typography.h3, { color: kpi.color, marginTop: spacing.xs }]}>{kpi.value}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>{kpi.label}</Text>
            <Text style={[typography.small, { color: kpi.color, marginTop: spacing.xs }]}>{kpi.action} →</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>
          {t('admin.requiresAction')}
        </Text>
        <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('ContentQuality')}>
          <Text style={{ fontSize: 20 }}>🚩</Text>
          <View style={styles.actionText}>
            <Text style={[typography.body, { color: colors.text }]}>{t('admin.flaggedQuestions')}</Text>
            <Text style={[typography.small, { color: colors.textSecondary }]}>{t('admin.pendingReview', { count: pendingFlags })}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: pendingFlags > 0 ? colors.error : colors.textTertiary }]}>
            <Text style={[typography.small, { color: '#fff', fontWeight: '700', fontFamily: fontFamily.bodyBold }]}>{pendingFlags}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('CurrentAffairsMgmt')}>
          <Text style={{ fontSize: 20 }}>📰</Text>
          <View style={styles.actionText}>
            <Text style={[typography.body, { color: colors.text }]}>{t('admin.draftCAByline')}</Text>
            <Text style={[typography.small, { color: colors.textSecondary }]}>{t('admin.draftCA', { count: draftCA })}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: draftCA > 0 ? colors.warning : colors.textTertiary }]}>
            <Text style={[typography.small, { color: '#fff', fontWeight: '700', fontFamily: fontFamily.bodyBold }]}>{draftCA}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('LearnerSupport')}>
          <Text style={{ fontSize: 20 }}>🎫</Text>
          <View style={styles.actionText}>
            <Text style={[typography.body, { color: colors.text }]}>{t('admin.openTickets')}</Text>
            <Text style={[typography.small, { color: colors.textSecondary }]}>
              {criticalTickets > 0 ? t('admin.criticalTickets', { count: criticalTickets }) : t('admin.ticketsCount', { count: openTickets })}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: criticalTickets > 0 ? colors.error : colors.warning }]}>
            <Text style={[typography.small, { color: '#fff', fontWeight: '700', fontFamily: fontFamily.bodyBold }]}>{openTickets}</Text>
          </View>
        </TouchableOpacity>
      </View>



      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  kpiCard: {
    width: '48%', backgroundColor: colors.bgCard, borderRadius: borderRadius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, borderLeftWidth: 3,
  },
  section: {
    backgroundColor: colors.bgCard, borderRadius: borderRadius.lg, padding: spacing.xl,
    marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  actionText: { flex: 1, marginLeft: spacing.md },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm, minWidth: 24, alignItems: 'center' },

});
