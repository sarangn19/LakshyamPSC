import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fontFamily } from '../theme';
import { useTranslation } from '../i18n/useTranslation';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { useKnowledgeStore } from '../store/knowledgeStore';
import { supabase } from '../services/supabase';
import { fetchUserProfile } from '../services/dataSync';
import type { Role } from '../store/authStore';

const ArrowLeftIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <Path d="M15 17L9 11L15 5" stroke={colors.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

async function getUserRole(userId: string): Promise<Role> {
  try {
    const { data } = await supabase!
      .from('profiles')
      .select('role')
      .eq('auth_user_id', userId)
      .maybeSingle();
    const role = (data as any)?.role;
    if (role === 'superadmin') return 'superadmin';
    if (role === 'admin') return 'admin';
    return 'student';
  } catch {
    return 'student';
  }
}

import { HomeScreen } from '../screens/HomeScreen';
import { LearnScreen } from '../screens/LearnScreen';
import { ChatbotScreen } from '../screens/ChatbotScreen';
import { SavedNotesScreen } from '../screens/SavedNotesScreen';
import { MCQEngineScreen } from '../screens/MCQEngineScreen';
import { FlashcardsScreen } from '../screens/FlashcardsScreen';
import { AITutorScreen } from '../screens/AITutorScreen';
import { RevisionHubScreen } from '../screens/RevisionHubScreen';
import { CurrentAffairsScreen } from '../screens/CurrentAffairsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PostSessionScreen } from '../screens/PostSessionScreen';
import { NoteDetailScreen } from '../screens/NoteDetailScreen';
import { CreateNoteScreen } from '../screens/CreateNoteScreen';
// Consolidated screens (Phase 1)
import { SubjectsScreen } from '../screens/SubjectsScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { AchievementsScreen } from '../screens/AchievementsScreen';
// Redirect wrappers for backward compat (remove after 1 release)
import { KnowledgeRepositoryRedirect } from '../screens/KnowledgeRepositoryRedirect';
import { KnowledgeMapRedirect } from '../screens/KnowledgeMapRedirect';
import { AnalyticsRedirect } from '../screens/AnalyticsRedirect';
import { RetentionDashboardRedirect } from '../screens/RetentionDashboardRedirect';
import { GoalTrackerRedirect } from '../screens/GoalTrackerRedirect';
import { BookmarkedQuestionsScreen } from '../screens/BookmarkedQuestionsScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { SubscriptionScreen } from '../screens/SubscriptionScreen';
import { BulkUploadScreen } from '../screens/admin/BulkUploadScreen';
import { PYQExplorerScreen } from '../screens/PYQExplorerScreen';
import { HighYieldPracticeScreen } from '../screens/HighYieldPracticeScreen';
import { ImpactDashboardScreen } from '../screens/ImpactDashboardScreen';
import { TopicIntelligenceScreen } from '../screens/TopicIntelligenceScreen';
import { CorpusHealthScreen } from '../screens/CorpusHealthScreen';
import { AdminNavigator } from './AdminNavigator';
import { SuperAdminNavigator } from './SuperAdminNavigator';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Learn" component={LearnScreen} />
      <Tab.Screen name="Chatbot" component={ChatbotScreen} />
      <Tab.Screen name="AITutor" component={AITutorScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const screenHeaderStyle = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.bgCard },
  headerTintColor: colors.text,
  headerTitleStyle: { color: colors.text, fontSize: 17, fontWeight: '600' as const, fontFamily: fontFamily.bodyMedium },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
  headerBackImage: () => <View style={{ paddingLeft: Platform.OS === 'web' ? 8 : 0 }}><ArrowLeftIcon /></View>,
};

export function AppNavigator() {
  const { t } = useTranslation();

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const role = await getUserRole(session.user.id);
        useAuthStore.getState().setRole(role);
        useAuthStore.getState().setAuthenticated(true);
        fetchUserProfile(session.user.id).then((profile) => {
          if (profile) {
            useUserStore.setState({
              userName: profile.user_name || session.user.user_metadata?.user_name || '',
              targetExams: profile.target_exams || [],
              primaryExam: profile.primary_exam || '',
              examDate: profile.exam_date || '',
              ...(profile.setup_complete ? { setupComplete: true } : {}),
            });
          }
        }).catch(() => {});
        useKnowledgeStore.getState().loadNotes().catch(() => {});
      }
    });
  }, []);

  if (!supabase) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={HomeTabs} />
          <Stack.Screen name="MCQ" component={MCQEngineScreen} options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="Flashcards" component={FlashcardsScreen} options={{ ...screenHeaderStyle, title: t('flashcards.title'), animation: 'slide_from_right' }} />
          <Stack.Screen name="AITutor" component={AITutorScreen} options={{ headerShown: false, animation: 'slide_from_right' }} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={HomeTabs} />
        <Stack.Screen name="MCQ" component={MCQEngineScreen} options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="Flashcards" component={FlashcardsScreen} options={{ ...screenHeaderStyle, title: t('flashcards.title'), animation: 'slide_from_right' }} />
        <Stack.Screen name="AITutor" component={AITutorScreen} options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="Subjects" component={SubjectsScreen} options={{ ...screenHeaderStyle, title: 'Subjects', animation: 'slide_from_right' }} />
        <Stack.Screen name="Progress" component={ProgressScreen} options={{ ...screenHeaderStyle, title: 'Progress', animation: 'slide_from_right' }} />
        <Stack.Screen name="Achievements" component={AchievementsScreen} options={{ ...screenHeaderStyle, title: 'Achievements', animation: 'slide_from_right' }} />
        <Stack.Screen name="Knowledge" component={KnowledgeRepositoryRedirect} options={{ ...screenHeaderStyle, title: t('knowledge.title'), animation: 'slide_from_right' }} />
        <Stack.Screen name="Map" component={KnowledgeMapRedirect} options={{ ...screenHeaderStyle, title: t('knowledgeMap.title'), animation: 'slide_from_right' }} />
        <Stack.Screen name="Analytics" component={AnalyticsRedirect} options={{ ...screenHeaderStyle, title: t('analytics.title'), animation: 'slide_from_right' }} />
        <Stack.Screen name="Retention" component={RetentionDashboardRedirect} options={{ ...screenHeaderStyle, title: 'Retention Dashboard', animation: 'slide_from_right' }} />
        <Stack.Screen name="Bookmarks" component={BookmarkedQuestionsScreen} options={{ ...screenHeaderStyle, title: 'Bookmarked Questions', animation: 'slide_from_right' }} />
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ ...screenHeaderStyle, title: 'Leaderboard', animation: 'slide_from_right' }} />
        <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ ...screenHeaderStyle, title: 'Subscription', animation: 'slide_from_right' }} />
        <Stack.Screen name="Affairs" component={CurrentAffairsScreen} options={{ ...screenHeaderStyle, title: t('currentAffairs.title'), animation: 'slide_from_right' }} />
        <Stack.Screen name="Goals" component={GoalTrackerRedirect} options={{ ...screenHeaderStyle, title: t('goals.title'), animation: 'slide_from_right' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ ...screenHeaderStyle, title: t('profile.title'), animation: 'slide_from_right' }} />
        <Stack.Screen name="NoteDetail" component={NoteDetailScreen} options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="SavedNotes" component={SavedNotesScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="CreateNote" component={CreateNoteScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="PostSession" component={PostSessionScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="AdminPortal" component={AdminNavigator} options={{ ...screenHeaderStyle, title: 'Admin Portal', animation: 'slide_from_right' }} />
        <Stack.Screen name="SuperAdminPortal" component={SuperAdminNavigator} options={{ ...screenHeaderStyle, title: 'Super Admin Portal', animation: 'slide_from_right' }} />
         <Stack.Screen name="BulkUpload" component={BulkUploadScreen} options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="PYQExplorer" component={PYQExplorerScreen} options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="HighYieldPractice" component={HighYieldPracticeScreen} options={{ ...screenHeaderStyle, title: 'High Yield Practice', animation: 'slide_from_right' }} />
        <Stack.Screen name="ImpactDashboard" component={ImpactDashboardScreen} options={{ ...screenHeaderStyle, title: 'Recommendation Impact', animation: 'slide_from_right' }} />
        <Stack.Screen name="TopicIntelligence" component={TopicIntelligenceScreen} options={{ ...screenHeaderStyle, title: 'Topic Intelligence', animation: 'slide_from_right' }} />
        <Stack.Screen name="CorpusHealth" component={CorpusHealthScreen} options={{ ...screenHeaderStyle, title: 'Corpus Health', animation: 'slide_from_right' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
