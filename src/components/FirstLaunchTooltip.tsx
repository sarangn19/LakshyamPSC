import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fontFamily } from '../theme';

const STORAGE_KEY = 'lakshyam-first-launch-tooltip-v1';

export function FirstLaunchTooltip() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val !== 'done') setVisible(true);
    });
  }, []);

  const dismiss = () => {
    setVisible(false);
    AsyncStorage.setItem(STORAGE_KEY, 'done');
  };

  if (!visible) return null;

  return (
    <TouchableWithoutFeedback onPress={dismiss}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback>
          <View style={styles.container}>
            <Text style={styles.title}>Welcome to Lakshyam!</Text>

            <View style={styles.tipCard}>
              <View style={styles.tipDot} />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Adaptive Learning</Text>
                <Text style={styles.tipText}>Tap Start for AI-personalized MCQs that adapt to your skill level.</Text>
              </View>
            </View>

            <View style={styles.tipCard}>
              <View style={[styles.tipDot, { backgroundColor: '#FF8C00' }]} />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Current Affairs</Text>
                <Text style={styles.tipText}>Stay updated with curated Kerala, national & international news.</Text>
              </View>
            </View>

            <Text style={styles.dismissText}>Tap anywhere to continue →</Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    marginHorizontal: 32,
    width: '85%',
    maxWidth: 360,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    fontFamily: fontFamily.bodyMedium,
    marginBottom: 24,
    textAlign: 'center',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  tipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 5,
    marginRight: 14,
  },
  tipContent: { flex: 1 },
  tipTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    fontFamily: fontFamily.bodyMedium,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.6)',
    fontFamily: fontFamily.body,
    lineHeight: 18,
  },
  dismissText: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.35)',
    fontFamily: fontFamily.body,
    textAlign: 'center',
    marginTop: 8,
  },
});
