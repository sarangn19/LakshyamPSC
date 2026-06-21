import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { supabase } from '../services/supabase';
import { colors, spacing, borderRadius } from '../theme';
import { typography } from '../theme/typography';
import { useTranslation } from '../i18n/useTranslation';
import { useUserStore } from '../store/userStore';
import { useMCQStore } from '../store';
import { BottomNav } from '../components/BottomNav';
import { ExamOutlookCard } from '../components/cards/ExamOutlookCard';
import { WeakAreasCard } from '../components/cards/WeakAreasCard';
import { CurrentAffairsCard } from '../components/cards/CurrentAffairsCard';
import type { CurrentAffair } from '../data/mockData';

const CATEGORY_COLORS: Record<string, string> = {
  kerala: '#F7B11A',
  national: '#4A90D9',
  appointments: '#7C4DFF',
  schemes: '#4CAF50',
  awards: '#FF7043',
};

function categoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] || '#999';
}

function StreakBadge({ current, longest }: { current: number; longest: number }) {
  return (
    <View style={styles.streakCard}>
      <View style={styles.streakRow}>
        <View style={styles.streakFlame}>
          <Svg width="20" height="24" viewBox="0 0 20 24" fill="none">
            <Path d="M10 0C10 0 5 6 5 11C5 15 7 17 10 17C13 17 15 15 15 11C15 6 10 0 10 0Z" fill="#F59E0B" />
            <Path d="M10 24C13 24 15 22 15 20C15 18 13 17 10 17C7 17 5 18 5 20C5 22 7 24 10 24Z" fill="#F59E0B" opacity="0.6" />
          </Svg>
        </View>
        <View style={styles.streakInfo}>
          <Text style={styles.streakValue}>{current} day streak</Text>
          <Text style={styles.streakLongest}>Best: {longest} days</Text>
        </View>
      </View>
    </View>
  );
}

export function HomeScreen({ navigation }: any) {
  const { t } = useTranslation();
  const streak = useUserStore((s) => s.streak);
  const [caItems, setCaItems] = useState<CurrentAffair[]>([]);
  const [loadingCA, setLoadingCA] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoadingCA(false); return; }
    supabase.from('current_affairs').select('*').order('published_at', { ascending: false }).limit(5).then(({ data, error: fetchError }) => {
      if (fetchError || !data || data.length === 0) { setLoadingCA(false); return; }
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
    }).catch(() => setLoadingCA(false));
  }, []);

  const hour = new Date().getHours();
  const greetingText = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const handlePracticeSubject = (subject: string) => {
    useMCQStore.getState().startOrchestratedSession({ subjects: [subject], sessionType: 'focused' });
    navigation.navigate('MCQ');
  };

  const handleExamOutlookStart = (subject: string, topic: string, recId: string) => {
    useMCQStore.getState().startOrchestratedSession({ subjects: [subject], recommendedTopic: topic, sessionType: 'blocking_topic', recommendationId: recId });
    navigation.navigate('MCQ');
  };

  const handleExamOutlookRevision = (subject: string, topic: string, recId: string) => {
    useMCQStore.getState().startOrchestratedSession({ subjects: [subject], recommendedTopic: topic, sessionType: 'revision', recommendationId: recId });
    navigation.navigate('MCQ');
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>{greetingText}</Text>
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

        {/* Section 1: Exam Outlook */}
        <ExamOutlookCard onStartBlockingTopic={handleExamOutlookStart} onStartRevision={handleExamOutlookRevision} />

        {/* Section 2: Top Weak Areas */}
        <WeakAreasCard onPracticeSubject={handlePracticeSubject} />

        {/* Section 3: Current Affairs */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Current Affairs</Text>
          {caItems.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('Affairs')} activeOpacity={0.7}>
              <Text style={styles.viewAll}>View More</Text>
            </TouchableOpacity>
          )}
        </View>
        {loadingCA ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : caItems.length > 0 ? (
          <>
            <CurrentAffairsCard items={caItems} onViewAll={() => navigation.navigate('Affairs')} />
          </>
        ) : (
          <Text style={styles.emptyText}>No current affairs available</Text>
        )}

        {/* Section 4: Streak */}
        <StreakBadge current={streak.current} longest={streak.longest} />

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>

      <BottomNav activeTab="Home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 64,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    fontFamily: typography.h2.fontFamily,
  },
  greetingSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    fontFamily: typography.bodySmall.fontFamily,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: 100,
    paddingTop: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontFamily: typography.bodyBold.fontFamily,
  },
  viewAll: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    fontFamily: typography.captionBold.fontFamily,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: typography.bodySmall.fontFamily,
    paddingVertical: spacing.md,
  },
  streakCard: {
    backgroundColor: colors.warning + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakFlame: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  streakInfo: {},
  streakValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    fontFamily: typography.bodyBold.fontFamily,
  },
  streakLongest: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
    fontFamily: typography.caption.fontFamily,
  },
});
