import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SetupScreen } from './src/screens/SetupScreen';
import { useUserStore } from './src/store';
import { colors, spacing } from './src/theme';
import { typography } from './src/theme/typography';

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
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });
  const [hydrated, setHydrated] = useState(false);
  const [setupDone, setSetupDone] = useState(false);
  const [checking, setChecking] = useState(true);
  const initDone = useRef(false);

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

  const handleSetupComplete = () => {
    setSetupDone(true);
  };

  if (!fontsLoaded || checking) {
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
