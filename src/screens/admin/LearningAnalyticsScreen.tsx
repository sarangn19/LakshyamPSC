import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { typography } from '../../theme/typography';
import { useTranslation } from '../../i18n/useTranslation';
import { usePerformanceStore } from '../../store';
import { fetchSubjectAnalytics } from '../../services/adminDataService';

export function LearningAnalyticsScreen() {
  const { t } = useTranslation();
  const profile = usePerformanceStore((s) => s.profile);
  const [view, setView] = useState<'subjects' | 'topics'>('subjects');
  const [loading, setLoading] = useState(true);
  const [subjectAnalytics, setSubjectAnalytics] = useState<{ subject: string; correct: number; total: number; accuracy: number }[]>([]);

  useEffect(() => {
    fetchSubjectAnalytics().then((data) => {
      setSubjectAnalytics(data);
    }).catch((err) => {
      console.error('Failed to fetch subject analytics:', err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const subjectScores = subjectAnalytics.map((s) => ({
    subject: s.subject,
    accuracy: Math.round(s.accuracy * 100),
    students: s.total,
  }));

  const weakestSubjects = subjectScores.filter((s) => s.accuracy < 65).sort((a, b) => a.accuracy - b.accuracy);
  const strongestSubjects = subjectScores.filter((s) => s.accuracy >= 75).sort((a, b) => b.accuracy - a.accuracy);

  const topDifficultTopics = [...subjectScores].sort((a, b) => a.accuracy - b.accuracy).slice(0, 5).map((s) => ({
    topic: s.subject,
    accuracy: s.accuracy,
    students: s.students,
  }));

  return (
    <ScrollView style={styles.container}>
      <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.xs }]}>
        {t('admin.learningAnalytics')}
      </Text>
      <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
        {t('admin.analyticsSubtitle')}
      </Text>

      <View style={styles.viewToggle}>
        {(['subjects', 'topics'] as const).map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.toggleBtn, view === v && styles.toggleBtnActive]}
            onPress={() => setView(v)}
          >
            <Text style={[typography.body, { color: view === v ? '#fff' : colors.textSecondary }]}>
              {v === 'subjects' ? t('admin.bySubject') : t('admin.byTopic')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {profile && (
        <View style={styles.section}>
          <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>
            {t('admin.overallMetrics')}
          </Text>
          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Text style={[typography.h3, { color: colors.primary }]}>
                {profile.totalQuestionsAttempted}
              </Text>
              <Text style={[typography.small, { color: colors.textSecondary }]}>{t('admin.totalAttempts')}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={[typography.h3, { color: colors.success }]}>
                {Math.round(profile.averageAccuracy)}%
              </Text>
              <Text style={[typography.small, { color: colors.textSecondary }]}>{t('admin.overallAccuracy')}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={[typography.h3, { color: colors.info }]}>
                {profile.strongSubjects.length}
              </Text>
              <Text style={[typography.small, { color: colors.textSecondary }]}>{t('admin.strongSubjects')}</Text>
            </View>
          </View>
        </View>
      )}

      {view === 'subjects' && (
        <>
          {weakestSubjects.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[typography.h4, { color: colors.error }]}>{t('admin.needsAttention')}</Text>
                <Text style={[typography.small, { color: colors.textSecondary }]}>{t('admin.intervene')}</Text>
              </View>
              {weakestSubjects.map((s) => (
                <View key={s.subject} style={styles.subjectRow}>
                  <Text style={[typography.body, { flex: 1, color: colors.text }]}>{s.subject}</Text>
                  <View style={styles.accuracyBar}>
                    <View style={[styles.accuracyFill, { width: `${s.accuracy}%`, backgroundColor: s.accuracy < 50 ? colors.error : colors.warning }]} />
                  </View>
                  <Text style={[typography.small, { color: s.accuracy < 50 ? colors.error : colors.warning, marginLeft: spacing.sm, minWidth: 40 }]}>
                    {s.accuracy}%
                  </Text>
                  <Text style={[typography.small, { color: colors.textMuted, marginLeft: spacing.sm }]}>
                    {s.students} {t('admin.learners')}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={[typography.h4, { color: colors.success, marginBottom: spacing.md }]}>
              {t('admin.strongSubjects')}
            </Text>
            {strongestSubjects.map((s) => (
              <View key={s.subject} style={styles.subjectRow}>
                <Text style={[typography.body, { flex: 1, color: colors.text }]}>{s.subject}</Text>
                <View style={styles.accuracyBar}>
                  <View style={[styles.accuracyFill, { width: `${s.accuracy}%`, backgroundColor: colors.success }]} />
                </View>
                <Text style={[typography.small, { color: colors.success, marginLeft: spacing.sm, minWidth: 40 }]}>
                  {s.accuracy}%
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {view === 'topics' && (
        <View style={styles.section}>
          <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>
            {t('admin.mostDifficultTopics')}
          </Text>
          {topDifficultTopics.map((item, i) => (
            <View key={item.topic} style={styles.topicRow}>
              <Text style={[typography.caption, { color: colors.textMuted, width: 24 }]}>{i + 1}.</Text>
              <View style={{ flex: 1 }}>
                <Text style={[typography.body, { color: colors.text }]}>{item.topic}</Text>
                <Text style={[typography.small, { color: colors.textMuted }]}>
                  {item.students} {t('admin.learnersAffected')}
                </Text>
              </View>
              <Text style={[typography.h4, { color: item.accuracy < 45 ? colors.error : colors.warning }]}>
                {item.accuracy}%
              </Text>
            </View>
          ))}
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.md }]}>
            {t('admin.difficultTopicAction')}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>
          {t('admin.revisionAdherence')}
        </Text>
        <View style={styles.revisionRow}>
          <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{t('admin.totalRevisionUsers')}</Text>
          <Text style={[typography.h4, { color: colors.info }]}>245</Text>
        </View>
        <View style={styles.revisionRow}>
          <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{t('admin.adherentRate')}</Text>
          <Text style={[typography.h4, { color: colors.success }]}>62%</Text>
        </View>
        <View style={styles.revisionRow}>
          <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{t('admin.avgRevisionSessions')}</Text>
          <Text style={[typography.h4, { color: colors.primary }]}>3.2/week</Text>
        </View>
      </View>

      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  viewToggle: { flexDirection: 'row', backgroundColor: colors.bgCard, borderRadius: borderRadius.md, padding: 2, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  toggleBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.sm },
  toggleBtnActive: { backgroundColor: colors.primary },
  section: {
    backgroundColor: colors.bgCard, borderRadius: borderRadius.lg, padding: spacing.xl,
    marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  sectionHeader: { marginBottom: spacing.md },
  metricRow: { flexDirection: 'row', gap: spacing.md },
  metric: { flex: 1, alignItems: 'center' },
  subjectRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  accuracyBar: { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  accuracyFill: { height: 8, borderRadius: 4 },
  topicRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  revisionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
});
