import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, Text } from 'react-native';
import { colors, fontFamily } from '../theme';
import { useTranslation } from '../i18n/useTranslation';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { useKnowledgeStore } from '../store/knowledgeStore';
import { supabase } from '../services/supabase';
import { fetchUserProfile, fetchNotes } from '../services/dataSync';
import type { Role } from '../store/authStore';

async function getUserRole(userId: string): Promise<Role> {
  try {
    const { data } = await supabase!
      .from('user_roles')
      .select('roles!inner(name)')
      .eq('auth_user_id', userId)
      .maybeSingle();
    return (data as any)?.roles?.name || 'student';
  } catch {
    return 'student';
  }
}

import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LearnScreen } from '../screens/LearnScreen';
import { ChatbotScreen } from '../screens/ChatbotScreen';
import { SavedNotesScreen } from '../screens/SavedNotesScreen';
import { KnowledgeRepositoryScreen } from '../screens/KnowledgeRepositoryScreen';
import { MCQEngineScreen } from '../screens/MCQEngineScreen';
import { FlashcardsScreen } from '../screens/FlashcardsScreen';
import { AITutorScreen } from '../screens/AITutorScreen';
import { RevisionHubScreen } from '../screens/RevisionHubScreen';
import { KnowledgeMapScreen } from '../screens/KnowledgeMapScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { CurrentAffairsScreen } from '../screens/CurrentAffairsScreen';
import { GoalTrackerScreen } from '../screens/GoalTrackerScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PostSessionScreen } from '../screens/PostSessionScreen';
import { NoteDetailScreen } from '../screens/NoteDetailScreen';
import { CreateNoteScreen } from '../screens/CreateNoteScreen';
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
  ...(Platform.OS === 'web' ? { headerBackImage: () => <Text style={{ fontSize: 22, color: colors.text, paddingLeft: 4 }}>{'‹'}</Text> } : {}),
};

export function AppNavigator() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user && !isAuthenticated) {
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
              setupComplete: profile.setup_complete || false,
            });
          }
        }).catch(() => {});
        fetchNotes().then((notes) => {
          if (notes.length > 0) useKnowledgeStore.setState({ notes });
        }).catch(() => {});
      }
    });
  }, []);

  if (!supabase) {
    // No Supabase configured — skip auth, go straight to main app
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={HomeTabs} />
          <Stack.Screen name="MCQ" component={MCQEngineScreen} options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="Flashcards" component={FlashcardsScreen} options={{ ...screenHeaderStyle, title: t('flashcards.title'), animation: 'slide_from_right' }} />
          <Stack.Screen name="Knowledge" component={KnowledgeRepositoryScreen} options={{ ...screenHeaderStyle, title: t('knowledge.title'), animation: 'slide_from_right' }} />
          <Stack.Screen name="Map" component={KnowledgeMapScreen} options={{ ...screenHeaderStyle, title: t('knowledgeMap.title'), animation: 'slide_from_right' }} />
          <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ ...screenHeaderStyle, title: t('analytics.title'), animation: 'slide_from_right' }} />
          <Stack.Screen name="Affairs" component={CurrentAffairsScreen} options={{ ...screenHeaderStyle, title: t('currentAffairs.title'), animation: 'slide_from_right' }} />
          <Stack.Screen name="Goals" component={GoalTrackerScreen} options={{ ...screenHeaderStyle, title: t('goals.title'), animation: 'slide_from_right' }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ ...screenHeaderStyle, title: t('profile.title'), animation: 'slide_from_right' }} />
          <Stack.Screen name="NoteDetail" component={NoteDetailScreen} options={{ ...screenHeaderStyle, title: t('noteDetail.notFound'), animation: 'slide_from_right' }} />
          <Stack.Screen name="SavedNotes" component={SavedNotesScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="CreateNote" component={CreateNoteScreen} options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="PostSession" component={PostSessionScreen} options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="AdminPortal" component={AdminNavigator} options={{ headerShown: false, title: 'Admin Portal', animation: 'slide_from_right' }} />
          <Stack.Screen name="SuperAdminPortal" component={SuperAdminNavigator} options={{ headerShown: false, title: 'Super Admin Portal', animation: 'slide_from_right' }} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MainTabs" component={HomeTabs} />
            <Stack.Screen name="MCQ" component={MCQEngineScreen} options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="Flashcards" component={FlashcardsScreen} options={{ ...screenHeaderStyle, title: t('flashcards.title'), animation: 'slide_from_right' }} />
            <Stack.Screen name="Knowledge" component={KnowledgeRepositoryScreen} options={{ ...screenHeaderStyle, title: t('knowledge.title'), animation: 'slide_from_right' }} />
            <Stack.Screen name="Map" component={KnowledgeMapScreen} options={{ ...screenHeaderStyle, title: t('knowledgeMap.title'), animation: 'slide_from_right' }} />
            <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ ...screenHeaderStyle, title: t('analytics.title'), animation: 'slide_from_right' }} />
            <Stack.Screen name="Affairs" component={CurrentAffairsScreen} options={{ ...screenHeaderStyle, title: t('currentAffairs.title'), animation: 'slide_from_right' }} />
            <Stack.Screen name="Goals" component={GoalTrackerScreen} options={{ ...screenHeaderStyle, title: t('goals.title'), animation: 'slide_from_right' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ ...screenHeaderStyle, title: t('profile.title'), animation: 'slide_from_right' }} />
            <Stack.Screen name="NoteDetail" component={NoteDetailScreen} options={{ ...screenHeaderStyle, title: t('noteDetail.notFound'), animation: 'slide_from_right' }} />
            <Stack.Screen name="SavedNotes" component={SavedNotesScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="CreateNote" component={CreateNoteScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="PostSession" component={PostSessionScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="AdminPortal" component={AdminNavigator} options={{ headerShown: false, title: 'Admin Portal', animation: 'slide_from_right' }} />
            <Stack.Screen name="SuperAdminPortal" component={SuperAdminNavigator} options={{ headerShown: false, title: 'Super Admin Portal', animation: 'slide_from_right' }} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
