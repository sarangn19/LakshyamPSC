import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useAuthStore, USER_SCOPED_STORAGE_KEYS } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { useKnowledgeStore } from '../store/knowledgeStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, fontFamily } from '../theme';
import { supabase } from '../services/supabase';
import { fetchUserProfile, fetchNotes } from '../services/dataSync';
import type { Role } from '../store/authStore';

function resetUserStores() {
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
    setupComplete: false,
    locale: 'en',
  });
  useKnowledgeStore.setState({
    notes: [],
    selectedSubject: '',
    searchQuery: '',
  });
}

async function getUserRole(userId: string): Promise<Role> {
  try {
    const { data } = await supabase!
      .from('user_roles')
      .select('roles!inner(name)')
      .eq('auth_user_id', userId);
    const roles = (data as any[] | null)?.map((r: any) => r?.roles?.name).filter(Boolean) ?? [];
    if (roles.includes('superadmin')) return 'superadmin';
    if (roles.includes('admin')) return 'admin';
    return 'student';
  } catch {
    return 'student';
  }
}

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const setUserName = useUserStore((s) => s.setUserName);

  const handleSubmit = async () => {
    setError('');
    if (!email.trim()) { setError('Please enter your email'); return; }
    if (!password || password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (isSignup && !name.trim()) { setError('Please enter your name'); return; }

    setLoading(true);
    try {
      if (isSignup) {
        const { data, error: signUpError } = await supabase!.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { user_name: name.trim() } },
        });
        if (signUpError) { setError(signUpError.message); return; }
        if (!data?.user) { setError('Signup failed. Please try again.'); return; }
        const role = await getUserRole(data.user.id);
        await AsyncStorage.multiRemove(USER_SCOPED_STORAGE_KEYS);
        resetUserStores();
        setUserName(name.trim());
        await login(email.trim(), password, role, name.trim());
        fetchUserProfile(data.user.id).then((profile) => {
          if (profile) useUserStore.setState({
            userName: profile.user_name || name.trim(),
            targetExams: profile.target_exams || [],
            primaryExam: profile.primary_exam || '',
            examDate: profile.exam_date || '',
            setupComplete: profile.setup_complete || false,
          });
        }).catch(() => {});
        fetchNotes().then((notes) => {
          if (notes.length > 0) useKnowledgeStore.setState({ notes });
        }).catch(() => {});
      } else {
        const { data: { user }, error: signInError } = await supabase!.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) { setError(signInError.message); return; }
        if (!user) { setError('Login failed. Please try again.'); return; }
        const role = await getUserRole(user.id);
        const displayName = user.user_metadata?.user_name || email.trim().split('@')[0];
        setUserName(displayName);
        await login(email.trim(), password, role, displayName);
        fetchUserProfile(user.id).then((profile) => {
          if (profile) useUserStore.setState({
            userName: profile.user_name || displayName,
            targetExams: profile.target_exams || [],
            primaryExam: profile.primary_exam || '',
            examDate: profile.exam_date || '',
            setupComplete: profile.setup_complete || false,
          });
        }).catch(() => {});
        fetchNotes().then((notes) => {
          if (notes.length > 0) useKnowledgeStore.setState({ notes });
        }).catch(() => {});
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.appName}>Lakshyam</Text>
        <Text style={styles.tagline}>Your Kerala PSC AI Tutor</Text>

        <View style={styles.card}>
          <Text style={styles.title}>{isSignup ? 'Create Account' : 'Welcome Back'}</Text>

          {isSignup && (
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="rgba(0,0,0,0.4)"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="rgba(0,0,0,0.4)"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password (min 6 chars)"
            placeholderTextColor="rgba(0,0,0,0.4)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>{isSignup ? 'Sign Up' : 'Log In'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setIsSignup(!isSignup); setError(''); }}>
            <Text style={styles.switchText}>
              {isSignup ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#F7B11A',
    textAlign: 'center',
    fontFamily: fontFamily.bodyBold,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.5)',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 40,
    fontFamily: fontFamily.body,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
    padding: 28,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    fontFamily: fontFamily.bodyMedium,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: fontFamily.body,
    color: '#000000',
    backgroundColor: '#F9F9F9',
  },
  error: {
    fontSize: 13,
    color: '#E53935',
    fontFamily: fontFamily.body,
    textAlign: 'center',
  },
  submitBtn: {
    height: 50,
    backgroundColor: '#F7B11A',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: fontFamily.bodyMedium,
  },
  switchText: {
    fontSize: 14,
    color: '#F7B11A',
    textAlign: 'center',
    fontFamily: fontFamily.body,
  },
});
