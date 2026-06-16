import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet } from 'react-native';
import { colors } from '../theme';

import { HomeScreen } from '../screens/HomeScreen';
import { KnowledgeRepositoryScreen } from '../screens/KnowledgeRepositoryScreen';
import { MCQEngineScreen } from '../screens/MCQEngineScreen';
import { FlashcardsScreen } from '../screens/FlashcardsScreen';
import { AITutorScreen } from '../screens/AITutorScreen';
import { LearnScreen } from '../screens/LearnScreen';
import { RevisionHubScreen } from '../screens/RevisionHubScreen';
import { KnowledgeMapScreen } from '../screens/KnowledgeMapScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { CurrentAffairsScreen } from '../screens/CurrentAffairsScreen';
import { GoalTrackerScreen } from '../screens/GoalTrackerScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PostSessionScreen } from '../screens/PostSessionScreen';
import { NoteDetailScreen } from '../screens/NoteDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

type IconMap = Record<string, { active: string; inactive: string }>;

const icons: IconMap = {
  Home: { active: '🏠', inactive: '🏡' },
  Learn: { active: '📖', inactive: '📖' },
  AITutor: { active: '🤖', inactive: '🤖' },
  Revision: { active: '🔄', inactive: '🔄' },
  Map: { active: '🗺️', inactive: '🗺️' },
  Analytics: { active: '📊', inactive: '📊' },
  Affairs: { active: '📰', inactive: '📰' },
  Goals: { active: '🎯', inactive: '🎯' },
  Profile: { active: '🧑‍🎓', inactive: '🧑‍🎓' },
  Knowledge: { active: '📚', inactive: '📕' },
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icon = icons[name] || { active: '📌', inactive: '📌' };
  return (
    <View style={tabStyles.iconWrap}>
      <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.6 }}>
        {focused ? icon.active : icon.inactive}
      </Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: { justifyContent: 'center', alignItems: 'center', marginTop: 4 },
});

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 10, marginBottom: 4 },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Learn" component={LearnScreen} />
      <Tab.Screen name="AITutor" component={AITutorScreen} />
      <Tab.Screen name="Revision" component={RevisionHubScreen} />
    </Tab.Navigator>
  );
}

const screenHeaderStyle = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.bgCard },
  headerTintColor: colors.text,
  headerTitleStyle: { color: colors.text, fontSize: 17, fontWeight: '600' as const },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
};

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={HomeTabs} />
        <Stack.Screen name="MCQ" component={MCQEngineScreen} options={{ ...screenHeaderStyle, title: 'Practice', animation: 'slide_from_right' }} />
        <Stack.Screen name="Flashcards" component={FlashcardsScreen} options={{ ...screenHeaderStyle, title: 'Flashcards', animation: 'slide_from_right' }} />
        <Stack.Screen name="Knowledge" component={KnowledgeRepositoryScreen} options={{ ...screenHeaderStyle, title: 'Notes', animation: 'slide_from_right' }} />
        <Stack.Screen name="Map" component={KnowledgeMapScreen} options={{ ...screenHeaderStyle, title: 'Knowledge Map', animation: 'slide_from_right' }} />
        <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ ...screenHeaderStyle, title: 'Statistics', animation: 'slide_from_right' }} />
        <Stack.Screen name="Affairs" component={CurrentAffairsScreen} options={{ ...screenHeaderStyle, title: 'Current Affairs', animation: 'slide_from_right' }} />
        <Stack.Screen name="Goals" component={GoalTrackerScreen} options={{ ...screenHeaderStyle, title: 'Goals', animation: 'slide_from_right' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ ...screenHeaderStyle, title: 'Profile', animation: 'slide_from_right' }} />
        <Stack.Screen name="NoteDetail" component={NoteDetailScreen} options={{ ...screenHeaderStyle, title: 'Note', animation: 'slide_from_right' }} />
        <Stack.Screen name="PostSession" component={PostSessionScreen} options={{ animation: 'slide_from_bottom' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
