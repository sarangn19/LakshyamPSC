import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, ActivityIndicator, Linking } from 'react-native';
import { supabase } from '../services/supabase';
import { CurrentAffair } from '../data/mockData';
import Svg, { Path, Circle } from 'react-native-svg';
import { fontFamily, colors } from '../theme';
import { useTranslation } from '../i18n/useTranslation';
import { usePerformanceStore } from '../store/performanceStore';
import { BottomNav } from '../components/BottomNav';
import { syllabus } from '../data/syllabus';
import { getLearnerProfile } from '../services/learnerStage';
import { getCognitiveTwinSummary } from '../services/cognitiveTwinRecommender';
import { getDueSummary } from '../services/spacedRepetition';
import { getChurnRisk, getRiskAction } from '../services/churnPrediction';
import { getStudyPathRecommendations, StudyPathRecommendation } from '../services/collaborativeFiltering';
import { explainRecommendation } from '../services/explainableAI';
import { useMCQStore } from '../store';

const DAY_ABBR = ["S", "M", "T", "W", "T", "F", "S"];

function getWeekLabels(): string[] {
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return DAY_ABBR[d.getDay()];
      });
    }
    setPathRecs(getStudyPathRecommendations(5));
  }, []);

  return (
    <View style={styles.questionsCard}>
      <Text style={styles.questionsLabel}>Questions practiced</Text>
      <Text style={styles.questionsValue}>{total}</Text>
      <View style={styles.barChartArea}>
        <View style={styles.barChart}>
          {weekly.map((height, index) => {
            const barH = maxVal > 0 ? (height / maxVal) * 49 : 1;
            return (
              <Animated.View
                key={index}
                style={[
                  styles.bar,
                  {
                    height: barAnims[index].interpolate({
                      inputRange: [0, weekly[index]],
                      outputRange: [1, barH],
                      extrapolate: 'clamp',
                    }),
                    backgroundColor: BAR_COLORS[index],
                  },
                ]}
              />
            );
          })}
        </View>
        <View style={styles.daysRow}>
          {days.map((day, index) => (
            <Text key={index} style={styles.dayLabel}>{day}</Text>
          ))}
        </View>
      </View>
    </View>
  );
}

function OverallAccuracyCard({ overallAccuracy }: { overallAccuracy: number }) {
  const size = 110;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = overallAccuracy / 100;
  const [displayAcc, setDisplayAcc] = useState(0);
  const accAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const listener = accAnim.addListener(({ value }) => setDisplayAcc(Math.round(value)));
    Animated.parallel([
      Animated.timing(accAnim, { toValue: overallAccuracy, duration: 800, useNativeDriver: false }),
      Animated.timing(rotateAnim, { toValue: progress, duration: 800, useNativeDriver: false }),
    ]).start();
    return () => accAnim.removeListener(listener);
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.accuracyCard}>
      <View style={styles.ringContainer}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#D9D9D9" strokeWidth={strokeWidth} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#F7B11A"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference * progress} ${circumference * (1 - progress)}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
      </View>
      <View style={styles.accuracyTextArea}>
        <Text style={styles.accuracyLabel}>Overall accuracy</Text>
        <Text style={styles.accuracyValue}>{displayAcc}%</Text>
      </View>
    </View>
  );
}

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

export function HomeScreen({ navigation }: any) {
  const { t } = useTranslation();
  const getInteractionAccuracy = usePerformanceStore((s) => s.getInteractionAccuracy);
  const getSubjectAccuracy = usePerformanceStore((s) => s.getSubjectAccuracy);
  const interactionSignals = usePerformanceStore((s) => s.interactionSignals);
  const sessionOutcomes = usePerformanceStore((s) => s.sessionOutcomes);
  const [caItems, setCaItems] = useState<CurrentAffair[]>([]);
  const [loadingCA, setLoadingCA] = useState(true);
  const [caError, setCaError] = useState<string | null>(null);
  const [churnNudge, setChurnNudge] = useState<{ message: string; type: string } | null>(null);
  const [pathRecs, setPathRecs] = useState<StudyPathRecommendation[]>([]);

  useEffect(() => {
    if (!supabase) { setLoadingCA(false); return; }
    supabase.from('current_affairs').select('*').order('published_at', { ascending: false }).limit(5).then(({ data, error: fetchError }) => {
      if (fetchError) { setCaError(fetchError.message); setLoadingCA(false); return; }
      if (data && data.length > 0) {
        setCaItems(data.map((r: any) => ({
          id: r.id,
          title: r.title,
          summary: r.summary,
          category: r.category,
          date: r.published_at ? r.published_at.split('T')[0] : '',
          source: r.source || '',
          isImportant: false,
          url: r.url || '',
          image_url: r.image_url || '',
        })));
      }
      setLoadingCA(false);
    }).catch((err) => { setCaError(err.message || 'Network error'); setLoadingCA(false); });
    getChurnRisk().then((record) => {
      if (record) {
        const action = getRiskAction(record.riskScore, record.features);
        if (action.type !== 'none') setChurnNudge(action);
      }
    });
  }, []);

  const weeklyQuestions: number[] = (() => {
    const days: number[] = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    for (const sig of interactionSignals) {
      const d = new Date(sig.sessionTime);
      const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
      if (diff >= 0 && diff < 7) {
        days[6 - diff]++;
      }
    }
    return days;
  })();

  const accuracy = Math.round(getInteractionAccuracy() * 100);

  const subjects = syllabus.map((subj) => {
    const acc = getSubjectAccuracy(subj.name);
    return {
      subject: subj.name,
      percent: acc.total > 0 ? Math.round((acc.correct / acc.total) * 100) : 0,
    };
  });

  const learnerProfile = getLearnerProfile();
  const cognitiveSummary = getCognitiveTwinSummary();
  const dueSummary = getDueSummary();
  const weakestSubject = subjects.length > 0
    ? subjects.reduce((a, b) => a.percent < b.percent ? a : b)
    : { subject: '', percent: 0 };

  const hour = new Date().getHours();
  const greetingText = hour < 12 ? t('home.greeting.morning') : hour < 17 ? t('home.greeting.afternoon') : t('home.greeting.evening');

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Top Bar: Crown + Profile */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.crownBtn} onPress={() => navigation.navigate('Subscription')} activeOpacity={0.8}>
            <View style={styles.crownCircle}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white" />
              </Svg>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
            <View style={styles.profileCircle}>
              <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <Path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M20 21C20 18.8783 19.1571 16.8434 17.6569 15.3431C16.1566 13.8429 14.1217 13 12 13C9.87827 13 7.84344 13.8429 6.34315 15.3431C4.84285 16.8434 4 18.8783 4 21" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
          </TouchableOpacity>
        </View>
        {/* Recommendation Card */}
        <View style={styles.recommendCard}>
          <View style={styles.recommendTextGroup}>
            <Text style={styles.greeting}>{greetingText}</Text>
            <Text style={styles.recommendSub}>{t('home.greeting.subtitle')}</Text>
          </View>
          <View style={styles.recommendRow}>
            <Text style={styles.recommendSubject}>
              {dueSummary.count > 0
                ? `${dueSummary.count} items due for review`
                : cognitiveSummary.openGaps > 0
                  ? `${cognitiveSummary.openGaps} gaps to close`
                  : learnerProfile.totalQuestions === 0
                    ? 'Start your first session'
                    : 'Keep up the momentum'}
            </Text>
            <Text style={styles.recommendDesc}>
              {learnerProfile.stage !== 'discovering'
                ? t('home.focus.subtextExperienced', {
                    accuracy: weakestSubject.percent,
                    gaps: cognitiveSummary.openGaps,
                    totalQ: learnerProfile.totalQuestions,
                    sessions: learnerProfile.sessionCount,
                  })
                : t('home.focus.subtextNew')}
            </Text>
          </View>

          {/* Adaptive Learning Row - Frame 2500 */}
          <View style={styles.adaptiveRow}>
            <Text style={styles.adaptiveLabel}>Adaptive Learning</Text>
            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => {
                useMCQStore.getState().startOrchestratedSession({});
                navigation.navigate('MCQ');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.startBtnText}>Start</Text>
              <Svg width="6.35" height="12" viewBox="0 0 7 12" fill="none">
                <Path d="M1 1L6 6L1 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>

        {churnNudge && (
          <View style={styles.churnBanner}>
            <Text style={styles.churnBannerText}>{churnNudge.message}</Text>
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Current Affairs Section */}
        <View style={styles.caSection}>
            <TouchableOpacity onPress={() => navigation.navigate('Affairs')} activeOpacity={0.8}>
            <Text style={styles.caTitle}>{t('home.currentAffairs')}</Text>
          </TouchableOpacity>
          {loadingCA ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : caError ? (
            <Text style={styles.caErrorText}>{caError}</Text>
          ) : caItems.length === 0 ? (
            <Text style={styles.caEmptyText}>No news available</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.caScroll}>
              {caItems.map((item) => (
                <TouchableOpacity key={item.id} style={styles.caCard} onPress={() => item.url ? Linking.openURL(item.url) : null}>
                  <View style={styles.caCardHeader}>
                    <View style={[styles.caBadge, { backgroundColor: categoryColor(item.category) }]}>
                      <Text style={styles.caBadgeText}>{item.category}</Text>
                    </View>
                    <Text style={styles.caDate}>{item.date}</Text>
                  </View>
                  <Text style={styles.caCardTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.caCardSummary} numberOfLines={2}>{item.summary}</Text>
                  <Text style={styles.caSource}>{item.source}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Statistics Section */}
        <View style={styles.statSection}>
          <View style={styles.statHeader}>
            <Text style={styles.statTitle}>{t('home.statistics')}</Text>
            <TouchableOpacity
              style={styles.statLink}
              onPress={() => navigation.navigate('Analytics')}
              activeOpacity={0.7}
            >
              <Text style={styles.statLinkText}>{t('home.detailedStatistics')}</Text>
              <Svg width="6.35" height="12" viewBox="0 0 7 12" fill="none">
                <Path d="M1 1L6 6L1 11" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
          </View>
          <View style={styles.statCards}>
            <QuestionsPracticedCard total={interactionSignals.length} weekly={weeklyQuestions} />
            <OverallAccuracyCard overallAccuracy={accuracy} />
          </View>
        </View>

        {pathRecs.length > 0 && (
          <View style={styles.pathSection}>
            <Text style={styles.pathTitle}>Recommended Study Path</Text>
            <Text style={styles.pathSubtitle}>Based on your learning patterns</Text>
            <View style={styles.pathList}>
              {pathRecs.map((rec, i) => {
                const expl = explainRecommendation(rec.subject, rec.topic);
                return (
                  <View key={i} style={styles.pathCard}>
                    <View style={styles.pathCardHeader}>
                      <Text style={styles.pathCardTitle}>{rec.subject}{rec.topic ? ` — ${rec.topic}` : ''}</Text>
                      <Text style={styles.pathCardScore}>{expl.score}</Text>
                    </View>
                    <Text style={styles.pathCardReason}>{rec.reason}</Text>
                    <View style={styles.pathAttributionRow}>
                      {expl.features.filter(f => f.contribution > 1).slice(0, 3).map((f, fi) => (
                        <View key={fi} style={styles.attributionBadge}>
                          <Text style={styles.attributionLabel}>{f.label}</Text>
                          <Text style={styles.attributionValue}>{Math.round(f.contribution)}%</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      <BottomNav activeTab="Home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F0EF',
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 64,
    paddingBottom: 48,
    gap: 8,
  },
  crownBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crownCircle: {
    width: 48,
    height: 48,
    backgroundColor: '#F7B11A',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCircle: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    gap: 24,
    paddingBottom: 100,
  },
  recommendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    gap: 24,
    alignSelf: 'stretch',
  },
  recommendTextGroup: {
    gap: 0,
    alignSelf: 'stretch',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '500',
    lineHeight: 32,
    color: '#000000',
    fontFamily: fontFamily.bodyMedium,
    alignSelf: 'stretch',
  },
  recommendSub: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19,
    color: 'rgba(0, 0, 0, 0.5)',
    fontFamily: fontFamily.body,
    alignSelf: 'stretch',
  },
  recommendRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  recommendSubject: {
    width: 152.12,
    height: 38,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 19,
    color: '#000000',
    fontFamily: fontFamily.bodyMedium,
  },
  recommendDesc: {
    flex: 1,
    height: 85,
    fontSize: 14,
    fontWeight: '300',
    lineHeight: 17,
    color: '#000000',
    fontFamily: fontFamily.body,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignSelf: 'stretch',
  },
  statSection: {
    gap: 24,
    alignSelf: 'stretch',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 19,
    color: '#000000',
    fontFamily: fontFamily.bodyMedium,
  },
  statLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLinkText: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 14,
    color: 'rgba(0, 0, 0, 0.5)',
    fontFamily: fontFamily.body,
  },
  statCards: {
    flexDirection: 'row',
    gap: 16,
  },
  questionsCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 24,
    padding: 16,
    gap: 10,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  questionsLabel: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 14,
    color: '#000000',
    fontFamily: fontFamily.body,
    alignSelf: 'stretch',
  },
  questionsValue: {
    fontSize: 32,
    fontWeight: '500',
    lineHeight: 43,
    color: '#000000',
    fontFamily: fontFamily.bodyMedium,
    alignSelf: 'stretch',
  },
  barChartArea: {
    gap: 4,
    width: 112,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 49,
    gap: 0,
  },
  bar: {
    width: 16,
  },
  daysRow: {
    flexDirection: 'row',
    height: 16,
    width: 112,
  },
  dayLabel: {
    width: 16,
    height: 16,
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 14,
    textAlign: 'center',
    color: '#000000',
    fontFamily: fontFamily.body,
  },
  accuracyCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 24,
    padding: 16,
    gap: 8,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  ringContainer: {
    alignSelf: 'center',
    marginBottom: 4,
  },
  accuracyTextArea: {
    gap: 8,
    alignSelf: 'stretch',
  },
  accuracyLabel: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 14,
    color: '#000000',
    fontFamily: fontFamily.body,
    alignSelf: 'stretch',
  },
  accuracyValue: {
    fontSize: 32,
    fontWeight: '500',
    lineHeight: 43,
    color: '#000000',
    fontFamily: fontFamily.bodyMedium,
    alignSelf: 'stretch',
  },
  adaptiveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 24,
    paddingRight: 8,
    height: 72,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 3,
    alignSelf: 'stretch',
  },
  adaptiveLabel: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 17,
    color: '#000000',
    fontFamily: fontFamily.body,
  },
  startBtn: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 24,
    paddingRight: 12,
    gap: 8,
    backgroundColor: '#F7B11A',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 19,
    color: '#FFFFFF',
    fontFamily: fontFamily.bodyBold,
  },
  caSection: {
    alignSelf: 'stretch',
  },
  caTitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 19,
    color: '#000000',
    fontFamily: fontFamily.bodyMedium,
    marginBottom: 12,
  },
  caScroll: {
    marginLeft: -24,
    paddingLeft: 24,
  },
  caCard: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 24,
    padding: 16,
    marginRight: 12,
    gap: 8,
  },
  caCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  caBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
    color: '#FFFFFF',
    fontFamily: fontFamily.bodyBold,
    textTransform: 'capitalize',
  },
  caDate: {
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 14,
    color: 'rgba(0,0,0,0.5)',
    fontFamily: fontFamily.body,
  },
  caCardTitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 17,
    color: '#000000',
    fontFamily: fontFamily.bodyMedium,
  },
  caCardSummary: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 15,
    color: 'rgba(0,0,0,0.6)',
    fontFamily: fontFamily.body,
  },
  caSource: {
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 14,
    color: 'rgba(0,0,0,0.4)',
    fontFamily: fontFamily.body,
  },
  caErrorText: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 14,
    color: colors.warning,
    fontFamily: fontFamily.body,
  },
  caEmptyText: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 14,
    color: 'rgba(0,0,0,0.4)',
    fontFamily: fontFamily.body,
  },
  churnBanner: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 16,
    padding: 16,
  },
  churnBannerText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    color: '#92400E',
    fontFamily: fontFamily.bodyMedium,
  },
  pathSection: {
    alignSelf: 'stretch',
  },
  pathTitle: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 24,
    color: '#000000',
    fontFamily: fontFamily.bodyMedium,
  },
  pathSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    color: 'rgba(0,0,0,0.5)',
    fontFamily: fontFamily.body,
    marginBottom: 12,
  },
  pathList: {
    gap: 8,
  },
  pathCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pathCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pathCardTitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
    color: '#000000',
    fontFamily: fontFamily.bodyMedium,
    flex: 1,
  },
  pathCardScore: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
    color: '#7C3AED',
    fontFamily: fontFamily.bodyMedium,
    marginLeft: 8,
  },
  pathCardReason: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: 'rgba(0,0,0,0.5)',
    fontFamily: fontFamily.body,
    marginTop: 4,
  },
  pathAttributionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  attributionBadge: {
    flexDirection: 'row',
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    alignItems: 'center',
  },
  attributionLabel: {
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 14,
    color: '#6B21A8',
    fontFamily: fontFamily.body,
  },
  attributionValue: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
    color: '#6B21A8',
    fontFamily: fontFamily.bodyMedium,
  },
});
