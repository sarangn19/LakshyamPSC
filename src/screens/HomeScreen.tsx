import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, Image, TouchableWithoutFeedback, Linking, useWindowDimensions } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { fontFamily, spacing, typography } from '../theme';
import { useUserStore } from '../store/userStore';
import { usePerformanceStore } from '../store/performanceStore';
import { mockCurrentAffairs, CurrentAffair } from '../data/mockData';
import { syllabus } from '../data/syllabus';
import { getLearnerProfile } from '../services/learnerStage';
import { getCognitiveTwinSummary } from '../services/cognitiveTwinRecommender';
import { getDueSummary } from '../services/spacedRepetition';

const DAY_ABBR = ["S", "M", "T", "W", "T", "F", "S"];

function getWeekLabels(): string[] {
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return DAY_ABBR[d.getDay()];
  });
}

function statColor(t: number): string {
  const r = Math.round(247 * t);
  const g = Math.round(177 * t);
  const b = Math.round(26 * t);
  return `rgb(${r},${g},${b})`;
}

const GRADIENT_COLORS = [
  "#F7B11A", "#DAA10E", "#BD910C", "#A08109",
  "#837007", "#666004", "#000000",
];

function QuestionsPracticedCard({ total, weekly }: { total: number; weekly: number[] }) {
  const days = getWeekLabels();
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
      <View style={styles.barChartWrapper}>
        <View style={styles.barChart}>
          {weekly.map((height, index) => (
            <Animated.View
              key={index}
              style={[
                styles.bar,
                { height: barAnims[index], backgroundColor: GRADIENT_COLORS[index] }
              ]}
            />
          ))}
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

function OverallAccuracyCard({ data, overallAccuracy }: { data: number[]; overallAccuracy: number }) {
  const w = 130;
  const h = 60;
  const padding = 4;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const [displayAcc, setDisplayAcc] = useState(0);
  const accAnim = useRef(new Animated.Value(0)).current;
  const graphOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const listener = accAnim.addListener(({ value }) => setDisplayAcc(Math.round(value)));
    Animated.parallel([
      Animated.timing(accAnim, { toValue: overallAccuracy, duration: 800, useNativeDriver: false }),
      Animated.timing(graphOpacity, { toValue: 1, duration: 600, useNativeDriver: false }),
    ]).start();
    return () => accAnim.removeListener(listener);
  }, []);

  const points = data.map((v, i) => ({
    x: padding + (i * (w - 2 * padding)) / (data.length - 1),
    y: h - padding - ((v - min) / range) * (h - 2 * padding),
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');

  return (
    <View style={styles.accuracyCard}>
      <View style={styles.accuracyTop}>
        <Text style={styles.accuracyLabel}>Overall accuracy</Text>
        <Text style={styles.accuracyValue}>{displayAcc}%</Text>
      </View>
      <Animated.View style={[styles.graphWrap, { opacity: graphOpacity }]}>
        <Svg width={w} height={h}>
          <Path d={linePath} stroke={statColor(0.65)} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={3} fill={statColor(overallAccuracy / 100)} />
        </Svg>
        <View style={styles.graphDays}>
          {getWeekLabels().map((d, i) => (
            <Text key={i} style={styles.graphDayLabel}>{d}</Text>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

export function HomeScreen({ navigation }: any) {
  const userName = useUserStore((s) => s.userName);
  const storeCurrentAffairs = useUserStore((s) => s.currentAffairs);
  const lastFetch = useUserStore((s) => s.lastCurrentAffairsFetch);
  const setLastFetch = useUserStore((s) => s.setLastCurrentAffairsFetch);
  const [dbAffairs, setDbAffairs] = useState<CurrentAffair[] | null>(null);
  const [selectedNews, setSelectedNews] = useState<CurrentAffair | null>(null);
  const currentAffairs = dbAffairs ?? (storeCurrentAffairs.length > 0 ? storeCurrentAffairs : mockCurrentAffairs);
  const { width: screenW, height: screenH } = useWindowDimensions();
  const cardRefs = useRef<(View | null)[]>([]);
  const cardStartLayout = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const expandX = useRef(new Animated.Value(0)).current;
  const expandY = useRef(new Animated.Value(0)).current;
  const expandScaleX = useRef(new Animated.Value(1)).current;
  const expandScaleY = useRef(new Animated.Value(1)).current;
  const expandOpacity = useRef(new Animated.Value(0)).current;
  const [expandedNews, setExpandedNews] = useState<CurrentAffair | null>(null);
  const navSlideAnim = useRef(new Animated.Value(0)).current;

  const handleCardPress = (item: CurrentAffair, index: number) => {
    const node = cardRefs.current[index];
    if (!node) return;
    node.measureInWindow((x, y, w, h) => {
      if (w === 0 || h === 0) return;
      const fw = screenW - 48;
      const fh = screenH - 160;
      const fx = 24;
      const fy = 80;
      const startCx = x + w / 2;
      const startCy = y + h / 2;
      const finalCx = fx + fw / 2;
      const finalCy = fy + fh / 2;
      cardStartLayout.current = { x, y, w, h };
      expandX.setValue(startCx - finalCx);
      expandY.setValue(startCy - finalCy);
      expandScaleX.setValue(w / fw);
      expandScaleY.setValue(h / fh);
      expandOpacity.setValue(0);
      setExpandedNews(item);
      setSelectedNews(item);
      Animated.parallel([
        Animated.spring(expandX, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 280 }),
        Animated.spring(expandY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 280 }),
        Animated.spring(expandScaleX, { toValue: 1, useNativeDriver: true, damping: 22, stiffness: 280 }),
        Animated.spring(expandScaleY, { toValue: 1, useNativeDriver: true, damping: 22, stiffness: 280 }),
        Animated.timing(expandOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(navSlideAnim, { toValue: 100, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleCloseNews = () => {
    const { x, y, w, h } = cardStartLayout.current;
    if (w === 0 || h === 0) { setSelectedNews(null); setExpandedNews(null); return; }
    const fw = screenW - 48;
    const fh = screenH - 160;
    const fx = 24;
    const fy = 80;
    const startCx = x + w / 2;
    const startCy = y + h / 2;
    const finalCx = fx + fw / 2;
    const finalCy = fy + fh / 2;
    Animated.parallel([
      Animated.timing(expandX, { toValue: startCx - finalCx, duration: 150, useNativeDriver: true }),
      Animated.timing(expandY, { toValue: startCy - finalCy, duration: 150, useNativeDriver: true }),
      Animated.timing(expandScaleX, { toValue: w / fw, duration: 150, useNativeDriver: true }),
      Animated.timing(expandScaleY, { toValue: h / fh, duration: 150, useNativeDriver: true }),
      Animated.timing(expandOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(navSlideAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => { setSelectedNews(null); setExpandedNews(null); });
  };

  useEffect(() => {
    const ONE_DAY = 86400000;
    if (Date.now() - lastFetch < ONE_DAY) return;
    import('../services/supabase').then(({ supabase }) => {
      if (!supabase) return;
      supabase.from('current_affairs').select('*').order('published_at', { ascending: false }).limit(20).then(({ data }) => {
        if (data && data.length > 0) {
          const mapped = data.map((r: any) => ({
            id: r.id,
            title: r.title,
            summary: r.summary,
            category: r.category,
            date: r.published_at ? r.published_at.split('T')[0] : '',
            source: r.source || '',
            isImportant: false,
            url: r.url || '',
            image_url: r.image_url || '',
          }));
          setDbAffairs(mapped);
          setLastFetch(Date.now());
        }
      });
    });
  }, []);

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

  const dailyAccuracy: number[] = (() => {
    const sums = [0, 0, 0, 0, 0, 0, 0];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    for (const outcome of sessionOutcomes) {
      const d = new Date(outcome.startTime);
      const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
      if (diff >= 0 && diff < 7) {
        sums[6 - diff] += outcome.accuracy;
        counts[6 - diff]++;
      }
    }
    return sums.map((sum, i) => (counts[i] > 0 ? Math.round((sum / counts[i]) * 100) : 0));
  })();

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

  const hour = new Date().getHours();
  const greetingText = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const displayName = userName || 'there';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Quick Access Row */}
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: '#2563EB10' }]}
            onPress={() => navigation.navigate('Retention')}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 20, marginBottom: 4 }}>📊</Text>
            <Text style={[typography.caption, { color: '#2563EB', fontWeight: '700' }]}>Retention</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: '#8B5CF610' }]}
            onPress={() => navigation.navigate('Bookmarks')}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 20, marginBottom: 4 }}>🔖</Text>
            <Text style={[typography.caption, { color: '#8B5CF6', fontWeight: '700' }]}>Bookmarks</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Focus */}
        <View style={styles.headerBlock}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>{greetingText}, {displayName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <Text style={styles.subtitle}>Here's what we recommend for today.</Text>
                {dueSummary.count > 0 && (
                  <View style={styles.dueBadge}>
                    <Text style={styles.dueBadgeText}>{dueSummary.count} due</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profile')}>
              <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <Path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <Path d="M20 21C20 18.8783 19.1571 16.8434 17.6569 15.3431C16.1566 13.8429 14.1217 13 12 13C9.87827 13 7.84344 13.8429 6.34315 15.3431C4.84285 16.8434 4 18.8783 4 21" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </Svg>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.focusCard} activeOpacity={0.9} onPress={() => {}}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.focusTag}>
                <Text style={styles.focusTagText}>TODAY'S FOCUS</Text>
              </View>
              <View style={styles.stageBadge}>
                <Text style={styles.stageBadgeText}>{learnerProfile.stage}</Text>
              </View>
            </View>
            <Text style={styles.focusTitle}>
              Review <Text style={styles.focusHighlight}>{subjects.reduce((a, b) => a.percent < b.percent ? a : b).subject}</Text> today.
            </Text>
            <Text style={styles.focusSubtext}>
              {learnerProfile.totalQuestions >= 5
                ? `This is your weakest area at ${subjects.reduce((a, b) => a.percent < b.percent ? a : b).percent}% accuracy with ${cognitiveSummary.openGaps} open gaps. ${learnerProfile.totalQuestions} questions answered across ${learnerProfile.sessionCount} sessions.`
                : 'Based on your recent performance and accuracy trends, this topic is likely to deliver the highest score improvement.'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* This Week Section */}
        <View style={styles.weekSection}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.weekCards}>
            <QuestionsPracticedCard total={interactionSignals.length} weekly={weeklyQuestions} />
            <OverallAccuracyCard data={dailyAccuracy} overallAccuracy={accuracy} />
          </View>
        </View>

        {/* Subject Accuracy Section */}
        <View style={styles.subjectSection}>
          <Text style={styles.sectionTitle}>Subject Accuracy</Text>
          <View style={styles.subjectCard}>
            {subjects.map((s, i) => (
              <React.Fragment key={s.subject}>
                {i > 0 && <View style={styles.divider} />}
                <SubjectProgress
                  name={s.subject}
                  percentage={s.percent}
                  color={statColor(s.percent / 100)}
                />
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Current Affairs */}
        <View style={styles.caSection}>
          <Text style={styles.caSectionTitle}>Current Affairs</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.caScroll}>
            {currentAffairs.map((item, index) => (
              <TouchableOpacity key={item.id} style={styles.caCard} onPress={() => handleCardPress(item, index)} activeOpacity={0.95}>
                <View ref={el => { cardRefs.current[index] = el; }} collapsable={false} style={{ flex: 1 }}>
                  <View style={styles.caImageWrap}>
                    {item.image_url ? (
                      <Image source={{ uri: item.image_url }} style={styles.caImage} />
                    ) : (
                      <View style={styles.caImagePlaceholder}>
                        <Text style={styles.caImagePlaceholderText}>{item.category[0].toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.caContentWrap}>
                    <Text style={styles.caCategory}>{item.category}</Text>
                    <Text style={styles.caTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.caMeta}>{item.source} · {item.date}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* News Detail Expansion Overlay */}
      {(expandedNews || selectedNews) && (
        <View style={StyleSheet.absoluteFill} pointerEvents={selectedNews ? 'auto' : 'none'}>
          <Animated.View style={[styles.expandOverlay, { opacity: expandOpacity }]}>
            <TouchableWithoutFeedback onPress={handleCloseNews}>
              <View style={{ flex: 1 }} />
            </TouchableWithoutFeedback>
          </Animated.View>
          <Animated.View
            style={[
              styles.expandContent,
              {
                left: 24,
                top: 80,
                width: screenW - 48,
                height: screenH - 160,
                transform: [
                  { translateX: expandX },
                  { translateY: expandY },
                  { scaleX: expandScaleX },
                  { scaleY: expandScaleY },
                ],
              },
            ]}
          >
            <TouchableOpacity style={styles.modalCloseBtn} onPress={handleCloseNews}>
              <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <Path d="M15 5L5 15M5 5L15 15" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
            {(expandedNews || selectedNews) && (
              <>
                {(expandedNews?.image_url || selectedNews?.image_url) ? (
                  <Image source={{ uri: (expandedNews || selectedNews)!.image_url }} style={styles.modalImage} />
                ) : (
                  <View style={styles.modalImagePlaceholder}>
                    <Text style={styles.modalImagePlaceholderText}>{(expandedNews || selectedNews)!.category[0].toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.modalBody}>
                  <View style={styles.modalMeta}>
                    <Text style={styles.modalCategory}>{(expandedNews || selectedNews)!.category}</Text>
                    <Text style={styles.modalSource}>{(expandedNews || selectedNews)!.source} · {(expandedNews || selectedNews)!.date}</Text>
                  </View>
                  <Text style={styles.modalTitle}>{(expandedNews || selectedNews)!.title}</Text>
                  <Text style={styles.modalSummary}>{(expandedNews || selectedNews)!.summary}</Text>
                  {(expandedNews || selectedNews)!.url ? (
                <TouchableOpacity onPress={() => { Linking.openURL((expandedNews || selectedNews)!.url!); }}>
                  <Text style={styles.modalLinkText}>Read full article →</Text>
                </TouchableOpacity>
                  ) : null}
                </View>
              </>
            )}
          </Animated.View>
        </View>
      )}

      {/* Bottom Navigation */}
      <Animated.View style={[styles.bottomNav, { transform: [{ translateY: navSlideAnim }] }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <View style={styles.navIconActive}>
            <Svg width="16" height="16" viewBox="0 0 16 18" fill="none">
              <Path d="M2 15.5H5V10.5C5 10.2167 5.096 9.97933 5.288 9.788C5.48 9.59667 5.71733 9.50067 6 9.5H10C10.2833 9.5 10.521 9.596 10.713 9.788C10.905 9.98 11.0007 10.2173 11 10.5V15.5H14V6.5L8 2L2 6.5V15.5ZM0 15.5V6.5C0 6.18333 0.0709998 5.88333 0.213 5.6C0.355 5.31667 0.550667 5.08333 0.8 4.9L6.8 0.4C7.15 0.133333 7.55 0 8 0C8.45 0 8.85 0.133333 9.2 0.4L15.2 4.9C15.45 5.08333 15.646 5.31667 15.788 5.6C15.93 5.88333 16.0007 6.18333 16 6.5V15.5C16 16.05 15.804 16.521 15.412 16.913C15.02 17.305 14.5493 17.5007 14 17.5H10C9.71667 17.5 9.47933 17.404 9.288 17.212C9.09667 17.02 9.00067 16.7827 9 16.5V11.5H7V16.5C7 16.7833 6.904 17.021 6.712 17.213C6.52 17.405 6.28267 17.5007 6 17.5H2C1.45 17.5 0.979333 17.3043 0.588 16.913C0.196666 16.5217 0.000666667 16.0507 0 15.5Z" fill="black"/>
            </Svg>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Chatbot')}>
          <View style={styles.navIcon}>
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <Path d="M9.5 9H9.51M14.5 9H14.51M18 4C18.7956 4 19.5587 4.31607 20.1213 4.87868C20.6839 5.44129 21 6.20435 21 7V15C21 15.7956 20.6839 16.5587 20.1213 17.1213C19.5587 17.6839 18.7956 18 18 18H13L8 21V18H6C5.20435 18 4.44129 17.6839 3.87868 17.1213C3.31607 16.5587 3 15.7956 3 15V7C3 6.20435 3.31607 5.44129 3.87868 4.87868C4.44129 4.31607 5.20435 4 6 4H18Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <Path d="M9.5 13C9.82588 13.3326 10.2148 13.5968 10.6441 13.7772C11.0734 13.9576 11.5344 14.0505 12 14.0505C12.4656 14.0505 12.9266 13.9576 13.3559 13.7772C13.7852 13.5968 14.1741 13.3326 14.5 13" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Learn')}>
          <View style={styles.navIcon}>
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <Path d="M12 3L1 9L5 11.18V17.18L12 21L19 17.18V11.18L21 10.09V17H23V9L12 3ZM18.82 9L12 12.72L5.18 9L12 5.28L18.82 9ZM17 16L12 18.72L7 16V12.27L12 15L17 12.27V16Z" fill="black"/>
            </Svg>
          </View>
        </TouchableOpacity>

      </Animated.View>
    </View>
  );
}

function SubjectProgress({ name, percentage, color }: { name: string; percentage: number; color: string }) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, { toValue: percentage, duration: 600, delay: 200, useNativeDriver: false }).start();
  }, []);

  return (
    <View style={styles.subjectRow}>
      <View style={styles.subjectInfo}>
        <Text style={styles.subjectName}>{name}</Text>
        <Text style={styles.subjectPct}>{percentage}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }), backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F0EF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 170,
    gap: 40,
  },
  headerBlock: {
    gap: 16,
    alignSelf: 'stretch',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 40,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '500',
    color: '#000000',
    lineHeight: 32,
    fontFamily: fontFamily.bodyMedium,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(0, 0, 0, 0.5)',
    lineHeight: 19,
    fontFamily: fontFamily.body,
  },
  avatar: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  caSection: {
    gap: 10,
    alignSelf: 'stretch',
  },
  caSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    fontFamily: fontFamily.bodyMedium,
  },
  caScroll: {
    gap: 10,
    paddingRight: 24,
  },
  caCard: {
    width: 200,
    height: 270,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 12,
    overflow: 'hidden',
  },
  caImageWrap: {
    height: 167,
    backgroundColor: '#4b5d80',
  },
  caContentWrap: {
    height: 103,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  caCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5f6f8c',
    fontFamily: fontFamily.bodyMedium,
    marginBottom: 3,
  },
  caTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111111',
    lineHeight: 17,
    fontFamily: fontFamily.bodySemiBold,
    marginBottom: 3,
  },
  caMeta: {
    fontSize: 11,
    fontWeight: '400',
    color: '#9a9a9a',
    fontFamily: fontFamily.body,
  },
  caImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
  },
  caImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#4b5d80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  caImagePlaceholderText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: fontFamily.bodyBold,
  },
  expandOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  expandContent: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F0F0F0',
  },
  modalImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#42526E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImagePlaceholderText: {
    fontSize: 48,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: fontFamily.bodyMedium,
  },
  modalBody: {
    padding: 24,
    gap: 12,
  },
  modalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalCategory: {
    fontSize: 11,
    fontWeight: '500',
    color: '#42526E',
    textTransform: 'capitalize',
    fontFamily: fontFamily.bodyMedium,
  },
  modalSource: {
    fontSize: 10,
    fontWeight: '400',
    color: 'rgba(0, 0, 0, 0.35)',
    fontFamily: fontFamily.body,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',
    lineHeight: 24,
    fontFamily: fontFamily.bodyMedium,
  },
  modalSummary: {
    fontSize: 14,
    fontWeight: '300',
    color: 'rgba(0, 0, 0, 0.7)',
    lineHeight: 20,
    fontFamily: fontFamily.body,
  },
  modalLinkText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#42526E',
    fontFamily: fontFamily.bodyMedium,
    textDecorationLine: 'underline',
  },
  focusCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 28,
    padding: 20,
    gap: 14,
    alignSelf: 'stretch',
  },
  focusTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#4D5F81',
    borderRadius: 999,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    height: 28,
  },
  focusTagText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: 0.88,
    fontFamily: fontFamily.bodyMedium,
  },
  focusTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1D1D1F',
    lineHeight: 24,
    letterSpacing: -0.16,
    fontFamily: fontFamily.bodyMedium,
  },
  focusHighlight: {
    fontWeight: '500',
    color: '#1D1D1F',
  },
  focusSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6E6E73',
    lineHeight: 21.7,
    fontFamily: fontFamily.body,
  },
  stageBadge: {
    backgroundColor: '#E8EDF5',
    borderRadius: 999,
    paddingHorizontal: 10,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4D5F81',
    letterSpacing: 0.5,
    textTransform: 'capitalize',
    fontFamily: fontFamily.bodyMedium,
  },
  dueBadge: {
    backgroundColor: '#2563EB20',
    borderRadius: 999,
    paddingHorizontal: 8,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dueBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
    fontFamily: fontFamily.bodyMedium,
  },
  quickCard: {
    flex: 1,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 70,
  },
  weekSection: {
    gap: 24,
    alignSelf: 'stretch',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    lineHeight: 22,
    fontFamily: fontFamily.bodyMedium,
  },
  weekCards: {
    flexDirection: 'row',
    gap: 16,
    height: 180,
  },
  questionsCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 16,
    gap: 10,
    height: 180,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  questionsLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#000000',
    lineHeight: 16,
    fontFamily: fontFamily.body,
    alignSelf: 'stretch',
  },
  questionsValue: {
    fontSize: 32,
    fontWeight: '500',
    color: '#000000',
    lineHeight: 43,
    fontFamily: fontFamily.bodyMedium,
    alignSelf: 'stretch',
  },
  barChartWrapper: {
    gap: 4,
    width: 112,
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
    color: '#000000',
    textAlign: 'center',
    lineHeight: 14,
    fontFamily: fontFamily.body,
  },
  accuracyCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 16,
    gap: 10,
    height: 180,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  accuracyTop: {
    gap: 8,
    alignSelf: 'stretch',
  },
  accuracyLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#000000',
    lineHeight: 16,
    fontFamily: fontFamily.body,
    alignSelf: 'stretch',
  },
  accuracyValue: {
    fontSize: 32,
    fontWeight: '500',
    color: '#000000',
    lineHeight: 43,
    fontFamily: fontFamily.bodyMedium,
    alignSelf: 'stretch',
  },
  graphWrap: {
    gap: 4,
    width: 130,
  },
  graphDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 130,
  },
  graphDayLabel: {
    width: 16,
    fontSize: 10,
    fontWeight: '400',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 14,
    fontFamily: fontFamily.body,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 49,
  },
  bar: {
    width: 16,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  subjectSection: {
    gap: 16,
    alignSelf: 'stretch',
  },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    gap: 16,
    alignSelf: 'stretch',
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subjectInfo: {
    width: 80,
    gap: 0,
  },
  subjectName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
    opacity: 0.8,
    lineHeight: 16,
    fontFamily: fontFamily.bodyMedium,
  },
  subjectPct: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    lineHeight: 19,
    fontFamily: fontFamily.bodyMedium,
  },
  progressTrack: {
    flex: 1,
    height: 14,
    backgroundColor: '#D9D9D9',
  },
  progressFill: {
    height: 14,
    backgroundColor: '#F7B11A',
  },
  divider: {
    height: 0.5,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignSelf: 'stretch',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    height: 76,
    backgroundColor: '#F6F6F6',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 78,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    boxShadow: '0 0 115px rgba(0,0,0,0.12)',
    elevation: 5,
  },
  navItem: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIcon: {
    width: 44,
    height: 44,
    borderRadius: 86,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIconActive: {
    width: 44,
    height: 44,
    borderRadius: 86,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

});
