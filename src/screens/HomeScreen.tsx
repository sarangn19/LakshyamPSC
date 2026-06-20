import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, useWindowDimensions, Easing } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { fontFamily } from '../theme';
import { useTranslation } from '../i18n/useTranslation';
import { usePerformanceStore } from '../store/performanceStore';
import { HomeIcon, LearnIcon, ChatbotIcon } from '../components/Icons';
import { syllabus } from '../data/syllabus';
import { getLearnerProfile } from '../services/learnerStage';
import { getCognitiveTwinSummary } from '../services/cognitiveTwinRecommender';
import { getDueSummary } from '../services/spacedRepetition';
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

const BAR_COLORS = ["#F7B11A", "#D59713", "#F7B11A", "#D78B07", "#9F3200", "#D88B07", "#000000"];

function QuestionsPracticedCard({ total, weekly }: { total: number; weekly: number[] }) {
  const days = getWeekLabels();
  const maxVal = Math.max(...weekly, 1);
  const barAnims = useRef(weekly.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(80, barAnims.map((anim, i) =>
      Animated.timing(anim, { toValue: weekly[i], duration: 400, useNativeDriver: false })
    )).start();
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

export function HomeScreen({ navigation }: any) {
  const { t } = useTranslation();
  const getInteractionAccuracy = usePerformanceStore((s) => s.getInteractionAccuracy);
  const getSubjectAccuracy = usePerformanceStore((s) => s.getSubjectAccuracy);
  const interactionSignals = usePerformanceStore((s) => s.interactionSignals);
  const sessionOutcomes = usePerformanceStore((s) => s.sessionOutcomes);

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

  const { width: screenW } = useWindowDimensions();
  const navW = screenW - 48;
  const indicatorAnim = useRef(new Animated.Value(8)).current;
  const [navWidth, setNavWidth] = useState(0);

  const slideIndicator = (targetLeft: number, navigateTo?: string) => {
    Animated.timing(indicatorAnim, {
      toValue: targetLeft,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      if (navigateTo) navigation.navigate(navigateTo);
    });
  };

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
              Review {weakestSubject.subject || 'your subjects'} today.
            </Text>
            <Text style={styles.recommendDesc}>
              {learnerProfile.totalQuestions >= 5
                ? t('home.focus.subtextExperienced', {
                    accuracy: weakestSubject.percent,
                    gaps: cognitiveSummary.openGaps,
                    totalQ: learnerProfile.totalQuestions,
                    sessions: learnerProfile.sessionCount,
                  })
                : t('home.focus.subtextNew')}
            </Text>
          </View>
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

        {/* Divider */}
        <View style={styles.divider} />

        {/* Adaptive Learning Row */}
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
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav} onLayout={(e) => { setNavWidth(e.nativeEvent.layout.width); }}>
        <Animated.View style={[styles.navActiveBg, { left: indicatorAnim }]} />
        <View style={styles.navItems}>
          <TouchableOpacity style={[styles.navItem, styles.navItemActive]} activeOpacity={1}>
            <HomeIcon width={16.25} height={16} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => { const w = navWidth || navW; slideIndicator((w - 54.32) / 2, 'Learn'); }}>
            <LearnIcon width={18.97} height={16} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => { const w = navWidth || navW; slideIndicator(w - 54.32 - 9, 'Chatbot'); }}>
            <ChatbotIcon width={19} height={16} color="black" />
          </TouchableOpacity>
        </View>
      </View>
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
    paddingVertical: 8,
    paddingLeft: 24,
    paddingRight: 8,
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
  bottomNav: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    height: 72,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
    justifyContent: 'center',
  },
  navActiveBg: {
    position: 'absolute',
    left: 8,
    top: 8.84,
    width: 54.32,
    height: 54.32,
    backgroundColor: '#F7B11A',
    borderRadius: 999,
  },
  navItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  navItem: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navItemActive: {
    zIndex: 1,
  },
});
