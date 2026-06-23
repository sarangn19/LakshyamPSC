import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Animated } from 'react-native';
import { useAuthStore, USER_SCOPED_STORAGE_KEYS } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { useKnowledgeStore } from '../store/knowledgeStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, fontFamily, radius } from '../theme';
import { supabase } from '../services/supabase';
import { useTranslation } from '../i18n/useTranslation';
import { fetchUserProfile, fetchNotes } from '../services/dataSync';
import type { Role } from '../store/authStore';
import { Logo } from '../components/Logo';

const features = [
  { icon: '🧠', key: 'login.featureAiTutor' },
  { icon: '📝', key: 'login.featureMCQs' },
  { icon: '📰', key: 'login.featureCurrentAffairs' },
  { icon: '📊', key: 'login.featureAnalytics' },
];

function resetUserStores() {
  const setupComplete = useUserStore.getState().setupComplete;
  const locale = useUserStore.getState().locale;
  useUserStore.setState({
    userName: '',
    targetExams: [],
    primaryExam: '',
    examDate: '',
    dailyTargetMCQs: 10,
    dailyTargetFlashcards: 10,
    streak: { current: 0, longest: 0, lastStudyDate: '', dates: [] },
    masteredTopics: [],
    accuracyImprovement: 0,
    currentAffairs: [],
    dailyGoal: null,
    examReadiness: [],
    setupComplete,
    locale,
  });
  useKnowledgeStore.setState({
    notes: [],
    selectedSubject: '',
    searchQuery: '',
  });
}

async function fetchAndApplyProfile(userId: string, displayName: string) {
  try {
    const profile = await fetchUserProfile(userId);
    if (profile) {
      useUserStore.setState({
        userName: profile.user_name || displayName,
        targetExams: profile.target_exams || [],
        primaryExam: profile.primary_exam || '',
        examDate: profile.exam_date || '',
        ...(profile.setup_complete ? { setupComplete: true } : {}),
      });
    } else {
      useUserStore.setState({ setupComplete: false });
    }
  } catch {
    useUserStore.setState({ setupComplete: false });
  }
}

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

export function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const setUserName = useUserStore((s) => s.setUserName);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const nativeDriver = Platform.OS !== 'web';
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: nativeDriver }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: nativeDriver }),
    ]).start();
  }, []);

  const handleSubmit = async () => {
    setError('');
    if (!email.trim()) { setError(t('login.errorEmailRequired')); return; }
    if (!password || password.length < 6) { setError(t('login.errorPasswordLength')); return; }
    if (isSignup && !name.trim()) { setError(t('login.errorNameRequired')); return; }

    setLoading(true);
    try {
      if (isSignup) {
        const { data, error: signUpError } = await supabase!.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { user_name: name.trim() } },
        });
        if (signUpError) { setError(signUpError.message); return; }
        if (!data?.user) { setError(t('login.errorSignupFailed')); return; }
        const role = await getUserRole(data.user.id);
        await AsyncStorage.multiRemove(USER_SCOPED_STORAGE_KEYS);
        resetUserStores();
        setUserName(name.trim());
        await fetchAndApplyProfile(data.user.id, name.trim());
        await login(email.trim(), password, role, name.trim());
        fetchNotes().then((notes) => {
          if (notes.length > 0) useKnowledgeStore.setState({ notes });
        }).catch(() => {});
      } else {
        const { data: { user }, error: signInError } = await supabase!.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) { setError(signInError.message); return; }
        if (!user) { setError(t('login.errorLoginFailed')); return; }
        const role = await getUserRole(user.id);
        const displayName = user.user_metadata?.user_name || email.trim().split('@')[0];
        setUserName(displayName);
        await fetchAndApplyProfile(user.id, displayName);
        await login(email.trim(), password, role, displayName);
        fetchNotes().then((notes) => {
          if (notes.length > 0) useKnowledgeStore.setState({ notes });
        }).catch(() => {});
      }
    } catch (err: any) {
      setError(err?.message || t('login.errorAuthFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Logo + Badge */}
        <View style={styles.topRow}>
          <Logo size="small" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{t('login.badge')}</Text>
          </View>
        </View>

        {/* Hero */}
        <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.heroTitle}>{t('login.heroTitle')}</Text>
          <Text style={styles.heroSub}>{t('login.heroSubtitle')}</Text>

          {/* Mini Features */}
          <View style={styles.featureRow}>
            {features.map((f) => (
              <View key={f.key} style={styles.featurePill}>
                <Text style={styles.featurePillIcon}>{f.icon}</Text>
                <Text style={styles.featurePillLabel}>{t(f.key)}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Auth Form */}
        <Animated.View style={[styles.formCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.formTitle}>{isSignup ? t('login.createAccount') : t('login.welcomeBack')}</Text>

          {isSignup && (
            <TextInput
              style={styles.input}
              placeholder={t('login.namePlaceholder')}
              placeholderTextColor="rgba(0,0,0,0.35)"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}
          <TextInput
            style={styles.input}
            placeholder={t('login.emailPlaceholder')}
            placeholderTextColor="rgba(0,0,0,0.35)"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder={t('login.passwordPlaceholder')}
            placeholderTextColor="rgba(0,0,0,0.35)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitText}>{isSignup ? t('login.createAccount') : t('login.logIn')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setIsSignup(!isSignup); setError(''); }}>
            <Text style={styles.switchText}>
              {isSignup ? t('login.alreadyHaveAccount') : t('login.dontHaveAccount')} <Text style={styles.switchTextBold}>{isSignup ? t('login.logIn') : t('login.signUp')}</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: Platform.OS === 'ios' ? 56 : 28, paddingBottom: spacing.xl, justifyContent: 'center' },

  /* Top Row */
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { backgroundColor: colors.warning + '20', paddingHorizontal: spacing.sm + 4, paddingVertical: spacing.xs + 1, borderRadius: radius.full },
  badgeText: { fontSize: 11, fontWeight: '600', color: colors.warning, fontFamily: fontFamily.bodyMedium },

  /* Hero */
  hero: { marginBottom: 28 },
  heroTitle: { fontSize: 28, fontWeight: '700', lineHeight: 35, color: colors.text, fontFamily: fontFamily.bodySemiBold, marginBottom: 8 },
  heroSub: { fontSize: 15, lineHeight: 21, color: colors.textSecondary, fontFamily: fontFamily.body, marginBottom: spacing.lg - 4 },

  /* Feature Pills */
  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featurePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.surface, paddingHorizontal: spacing.sm + 4, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  featurePillIcon: { fontSize: 15 },
  featurePillLabel: { fontSize: 12, fontWeight: '500', color: colors.textSecondary, fontFamily: fontFamily.bodyMedium },

  /* Auth Form */
  formCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: 14 },
  formTitle: { fontSize: 18, fontWeight: '700', color: colors.text, fontFamily: fontFamily.bodySemiBold, textAlign: 'center', marginBottom: 2 },
  input: { height: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, fontSize: 15, fontFamily: fontFamily.body, color: colors.text, backgroundColor: colors.bgInput },
  error: { fontSize: 13, color: colors.error, fontFamily: fontFamily.body, textAlign: 'center' },
  submitBtn: { height: 48, backgroundColor: colors.primary, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '600', color: colors.white, fontFamily: fontFamily.bodyMedium },
  switchText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', fontFamily: fontFamily.body, marginTop: 4 },
  switchTextBold: { color: colors.primary, fontWeight: '600', fontFamily: fontFamily.bodyMedium },
});
