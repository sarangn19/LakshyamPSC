import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SetupScreen } from './src/screens/SetupScreen';
import { useUserStore, useKnowledgeStore, usePerformanceStore } from './src/store';
import { useAuthStore } from './src/store/authStore';
import { colors, spacing } from './src/theme';
import { typography } from './src/theme/typography';
import { useSyncSubscriptions, useOfflineQueueFlush } from './src/services/syncSubscriptions';
import { restoreFromRemote, startPeriodicSync } from './src/services/syncService';
import { saveUserProfile, saveNote, removeNote } from './src/services/dataSync';
import { supabase } from './src/services/supabase';

let profileDebounce: ReturnType<typeof setTimeout> | null = null;
function debouncedSaveUserProfile(state: any) {
  if (profileDebounce) clearTimeout(profileDebounce);
  profileDebounce = setTimeout(async () => {
    const { data: { user } } = await supabase!.auth.getUser();
    if (!user) return;
    await saveUserProfile({
      auth_user_id: user.id,
      user_name: state.userName,
      target_exams: state.targetExams,
      primary_exam: state.primaryExam,
      exam_date: state.examDate,
      daily_target_mcqs: state.dailyTargetMCQs,
      daily_target_flashcards: state.dailyTargetFlashcards,
      setup_complete: state.setupComplete,
      updated_at: new Date().toISOString(),
    });
  }, 2000);
}

function LoadingScreen() {
  return (
    <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ fontSize: 48, marginBottom: spacing.lg }}>🎯</Text>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.md }]}>Loading Lakshyam...</Text>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Satoshi': require('./assets/fonts/Satoshi-Regular.otf'),
    'Satoshi-Medium': require('./assets/fonts/Satoshi-Medium.otf'),
    'Satoshi-Bold': require('./assets/fonts/Satoshi-Bold.otf'),
    'Satoshi-Black': require('./assets/fonts/Satoshi-Black.otf'),
    'Satoshi-Light': require('./assets/fonts/Satoshi-Light.otf'),
    'Satoshi-Italic': require('./assets/fonts/Satoshi-Italic.otf'),
  });
  const [hydrated, setHydrated] = useState(false);
  const [setupDone, setSetupDone] = useState(false);
  const [checking, setChecking] = useState(true);
  const [restoring, setRestoring] = useState(true);
  const [restored, setRestored] = useState(false);
  const initDone = useRef(false);

  useSyncSubscriptions();
  useOfflineQueueFlush();

  useEffect(() => {
    const unsubUser = useUserStore.subscribe((state) => {
      debouncedSaveUserProfile(state);
    });
    const unsubNotes = useKnowledgeStore.subscribe((state, prev) => {
      if (prev.notes.length < state.notes.length) {
        const added = state.notes[0];
        if (added) saveNote(added);
      } else if (prev.notes.length > state.notes.length) {
        const removedId = prev.notes.find((n) => !state.notes.some((n2) => n2.id === n.id))?.id;
        if (removedId) removeNote(removedId);
      } else {
        const changed = state.notes.find((n, i) => prev.notes[i] && (prev.notes[i].content !== n.content || prev.notes[i].title !== n.title));
        if (changed) saveNote(changed);
      }
    });

    return () => { unsubUser(); unsubNotes(); };
  }, []);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const check = () => {
      const state = useUserStore.getState();
      setSetupDone(state.setupComplete);
      setHydrated(true);
      setChecking(false);
    };

    const unsub = useUserStore.persist.onFinishHydration(() => check());
    if (useUserStore.persist.hasHydrated()) {
      check();
    }

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubAuth = useAuthStore.subscribe((state) => {
      if (state.isAuthenticated) {
        const userState = useUserStore.getState();
        setSetupDone(userState.setupComplete);
      }
    });
    const unsubUser = useUserStore.subscribe((state) => {
      setSetupDone(state.setupComplete);
    });
    return () => { unsubAuth(); unsubUser(); };
  }, []);

  const handleSetupComplete = () => {
    setSetupDone(true);
  };

  useEffect(() => {
    if (setupDone && hydrated && !restored) {
      setRestored(true);
      const hasCache = usePerformanceStore.getState().interactionSignals.length > 0;
      if (hasCache) setRestoring(false);
      restoreFromRemote().finally(() => setRestoring(false));
      startPeriodicSync();
      // Notifications: install expo-notifications and uncomment below to enable
      // requestNotificationPermission().then((granted) => { ... });
    }
  }, [setupDone, hydrated, restored]);

  if (!fontsLoaded || checking || (setupDone && restoring)) {
    return <LoadingScreen />;
  }

  if (!setupDone) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <SetupScreen onComplete={handleSetupComplete} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return <AppNavigator />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
