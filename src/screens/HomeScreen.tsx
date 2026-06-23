import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, Image, Linking } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { supabase } from '../services/supabase';
import { colors, spacing, borderRadius } from '../theme';
import { fontFamily } from '../theme/typography';
import { useTranslation } from '../i18n/useTranslation';
import { useUserStore } from '../store/userStore';
import { useMCQStore, usePerformanceStore } from '../store';
import { BottomNav } from '../components/BottomNav';
import type { CurrentAffair } from '../data/mockData';
import { seedPSCFrequency } from '../services/pscFrequencyBoost';
import { computeExamOutlook } from '../services/examOutlookEngine';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 12;
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - spacing.lg * 2 - GRID_GAP) / 2);

const FALLBACK_CA: CurrentAffair[] = [
  { id: 'fa1', title: 'Kerala Leads in Education Development Index', summary: 'Kerala has topped the Education Development Index for the sixth consecutive year, showcasing its commitment to quality education and literacy.', category: 'national', date: '2026-06-20', source: 'PIB', isImportant: true, url: '', image_url: '' },
  { id: 'fa2', title: 'Supreme Court Landmark Verdict on Fundamental Rights', summary: 'The Supreme Court delivered a historic judgment expanding the scope of fundamental rights under Article 21 of the Constitution.', category: 'national', date: '2026-06-18', source: 'The Hindu', isImportant: true, url: '', image_url: '' },
  { id: 'fa3', title: 'New Central Scheme for Farmers Welfare Approved', summary: 'Union Cabinet approves a comprehensive scheme for farmers welfare with an outlay of Rs 50,000 crore over the next five years.', category: 'national', date: '2026-06-15', source: 'PIB', isImportant: true, url: '', image_url: '' },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function barFillColor(accuracy: number): string {
  if (accuracy >= 0.8) return '#23C420';
  if (accuracy >= 0.5) return '#F7B11A';
  return '#E43131';
}

function StatsCard({ subject, category, total, accuracy }: { subject: string; category: string; total: number; accuracy: number }) {
  const fillHeight = 141 * accuracy;
  const pct = `${Math.round(accuracy * 100)}%`;

  return (
    <View style={styles.statsCard}>
      <View style={styles.statsHeader}>
        <Text style={styles.statsSubject} numberOfLines={1}>{subject}</Text>
        {category ? <Text style={styles.statsCategory} numberOfLines={1}>{category}</Text> : null}
      </View>
      <View style={styles.statsDivider} />
      <View style={styles.statsRow}>
        <View style={styles.statsLeft}>
          <View style={styles.statsMetricBlock}>
            <Text style={styles.statsLabel}>Total Questions Attempted</Text>
            <Text style={styles.statsValue}>{total.toLocaleString()}</Text>
          </View>
          <View style={styles.statsMetricBlock}>
            <Text style={styles.statsLabel}>Accuracy</Text>
            <Text style={styles.statsPct}>{pct}</Text>
          </View>
        </View>
        <View style={styles.barContainer}>
          <View style={[styles.barFill, { height: fillHeight, backgroundColor: barFillColor(accuracy) }]} />
        </View>
      </View>
    </View>
  );
}

function CACard({ item }: { item: CurrentAffair }) {
  const hasImage = !!item.image_url;
  return (
    <TouchableOpacity style={styles.caCard} onPress={() => item.url ? Linking.openURL(item.url) : null} activeOpacity={0.7}>
      {hasImage ? (
        <Image source={{ uri: item.image_url }} style={styles.caImage} />
      ) : (
        <View style={styles.caImagePlaceholder} />
      )}
      <View style={styles.caTextCol}>
        <Text style={styles.caTitle} numberOfLines={3}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function HomeScreen({ navigation }: any) {
  const { t } = useTranslation();
  const streak = useUserStore((s) => s.streak?.current ?? 0);
  const sessionOutcomes = usePerformanceStore((s) => s.sessionOutcomes);
  const [caItems, setCaItems] = useState<CurrentAffair[]>([]);
  const [loadingCA, setLoadingCA] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoadingCA(false); return; }
    supabase.from('current_affairs').select('*').order('published_at', { ascending: false }).limit(5).then(({ data, error: fetchError }) => {
      if (fetchError || !data || data.length === 0) {
        setCaItems(FALLBACK_CA);
        setLoadingCA(false);
        return;
      }
      setCaItems(data.map((r: any) => ({
        id: r.id,
        title: r.title,
        summary: r.summary,
        category: r.category,
        date: r.published_at ? r.published_at.split('T')[0] : '',
        source: r.source || '',
        isImportant: true,
        url: r.url || '',
        image_url: r.image_url || '',
      })));
      setLoadingCA(false);
    }).catch(() => { setCaItems(FALLBACK_CA); setLoadingCA(false); });
    seedPSCFrequency();
  }, []);

  const outlook = React.useMemo(() => {
    try { return computeExamOutlook(); } catch { return null; }
  }, [streak, sessionOutcomes?.length]);

  const subjectStats = React.useMemo(() => {
    const outcomes = Array.isArray(sessionOutcomes) ? sessionOutcomes : [];
    const accums: Record<string, { total: number; correct: number }> = {};
    for (const o of outcomes) {
      if (!o.subjectScores) continue;
      for (const [subject, score] of Object.entries(o.subjectScores)) {
        if (!accums[subject]) accums[subject] = { total: 0, correct: 0 };
        accums[subject].total += score.total;
        accums[subject].correct += score.correct;
      }
    }
    return Object.entries(accums)
      .filter(([, v]) => v.total > 0)
      .map(([subject, v]) => ({
        subject,
        category: '',
        total: v.total,
        accuracy: v.correct / v.total,
      }))
      .sort((a, b) => a.accuracy - b.accuracy);
  }, [sessionOutcomes]);

  const statusTags: Record<string, { label: string; color: string }> = {
    'Getting Started': { label: 'Getting Started', color: '#6B7280' },
    'Building Foundation': { label: 'Building Foundation', color: '#D39309' },
    'Making Progress': { label: 'Making Progress', color: '#D39309' },
    'Competitive': { label: 'Competitive', color: '#059669' },
    'Exam Ready': { label: 'Exam Ready', color: '#16A34A' },
  };
  const outlookStatus = outlook?.outlookStatus ?? 'Building Foundation';
  const currentTag = statusTags[outlookStatus] ?? statusTags['Building Foundation'];

  const handleStartNow = () => {
    const block = outlook?.blockingTopics?.[0];
    useMCQStore.getState().startOrchestratedSession({
      subjects: block ? [block.subject] : undefined,
      recommendedTopic: block?.topic,
      sessionType: 'focused',
    });
    navigation.navigate('MCQ');
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Section 1: Header Row */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.greetingSub}>{t('home.greeting.subtitle')}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
            <View style={styles.avatarCircle}>
              <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <Path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" stroke={colors.text} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M20 21C20 18.8783 19.1571 16.8434 17.6569 15.3431C16.1566 13.8429 14.1217 13 12 13C9.87827 13 7.84344 13.8429 6.34315 15.3431C4.84285 16.8434 4 18.8783 4 21" stroke={colors.text} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
          </TouchableOpacity>
        </View>

        {/* Section 2: Preparation Outlook */}
        <View>
          <View style={styles.preparationHeader}>
            <Text style={styles.preparationTitle}>Preparation Outlook</Text>
            <View style={[styles.progressTag, { backgroundColor: currentTag.color }]}>
              <Text style={styles.progressTagText}>{currentTag.label}</Text>
            </View>
          </View>
          <View style={styles.outlookCard}>
            <Text style={styles.outlookCardTitle}>Next Recommended Action</Text>
            <View style={styles.outlookRow}>
              <View style={styles.outlookTextCol}>
                <Text style={styles.outlookDescription} numberOfLines={3}>
                  {outlook?.nextBestAction ?? 'Start with a daily MCQ practice session.'}
                </Text>
              </View>
              <TouchableOpacity style={styles.startNowButton} onPress={handleStartNow} activeOpacity={0.8}>
                <Text style={styles.startNowText}>Start Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Section 3: Current Affairs */}
        <View>
          <View style={styles.caSectionHeader}>
            <Text style={styles.caSectionTitle}>Current Affairs</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CurrentAffairs')} activeOpacity={0.7}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {loadingCA ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.caScroll}>
              {caItems.slice(0, 3).map((item) => (
                <CACard key={item.id} item={item} />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Section 4: Last 7 days */}
        <Text style={styles.last7Label}>Last 7 days</Text>

        {/* Section 5: Stats Cards Grid */}
        <View style={styles.statsGrid}>
          {subjectStats.map((stat) => (
            <StatsCard key={stat.subject} {...stat} />
          ))}
        </View>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>

      <BottomNav activeTab="Home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  scrollContent: {
    paddingTop: spacing.huge,
    paddingHorizontal: spacing.lg,
    gap: spacing.xxl,
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontFamily: fontFamily.body,
    fontWeight: '400',
    fontSize: 24,
    lineHeight: 29,
    color: colors.text,
  },
  greetingSub: {
    fontFamily: fontFamily.body,
    fontWeight: '300',
    fontSize: 14,
    lineHeight: 17,
    color: colors.text,
    marginTop: 2,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preparationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  preparationTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
  },
  progressTag: {
    backgroundColor: '#D39309',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  progressTagText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  outlookCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  outlookCardTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000000',
  },
  outlookRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  outlookTextCol: {
    flex: 1,
  },
  outlookDescription: {
    fontSize: 14,
    fontWeight: '300',
    lineHeight: 17,
    color: '#000000',
  },
  startNowButton: {
    backgroundColor: '#F7B11A',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startNowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  caSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#666666',
  },
  caSectionTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
  },
  caScroll: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  caCard: {
    width: 302,
    height: 143,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: 12,
    flexDirection: 'row',
    gap: 19,
  },
  caImagePlaceholder: {
    width: 119,
    height: 119,
    backgroundColor: '#ECECEC',
    borderRadius: borderRadius.sm,
  },
  caImage: {
    width: 119,
    height: 119,
    borderRadius: borderRadius.sm,
  },
  caTextCol: {
    width: 140,
    gap: spacing.sm,
  },
  caTitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 17,
    color: '#000000',
  },
  last7Label: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
    marginTop: -spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: GRID_GAP,
  },
  statsCard: {
    width: CARD_WIDTH,
    height: 232,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  statsHeader: {
    alignSelf: 'stretch',
    gap: 4,
  },
  statsSubject: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000000',
  },
  statsCategory: {
    fontSize: 10,
    fontWeight: '400',
    color: '#000000',
  },
  statsDivider: {
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 24,
  },
  statsLeft: {
    flex: 1,
    gap: 24,
  },
  statsMetricBlock: {
    alignSelf: 'stretch',
  },
  statsLabel: {
    fontSize: 12,
    fontWeight: '300',
    lineHeight: 14,
    color: '#000000',
  },
  statsValue: {
    fontSize: 32,
    fontWeight: '400',
    lineHeight: 43,
    color: '#000000',
  },
  statsPct: {
    fontSize: 24,
    fontWeight: '400',
    lineHeight: 32,
    color: '#000000',
  },
  barContainer: {
    width: 39,
    height: 141,
    backgroundColor: '#ECECEC',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
  barFill: {
    width: 61.67,
    alignSelf: 'center',
  },
});
