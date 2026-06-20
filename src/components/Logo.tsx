import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fontFamily } from '../theme';

interface LogoProps {
  size?: 'small' | 'large' | 'xl';
  showTagline?: boolean;
}

export function Logo({ size = 'large', showTagline = false }: LogoProps) {
  const dim = size === 'small' ? 34 : size === 'large' ? 56 : 80;
  const fontSize = size === 'small' ? 17 : size === 'large' ? 28 : 40;
  const textSize = size === 'small' ? 20 : size === 'large' ? 28 : 36;

  return (
    <View style={styles.wrap}>
      <View style={[styles.circle, { width: dim, height: dim, borderRadius: dim * 0.28 }]}>
        <Text style={[styles.letter, { fontSize }]}>L</Text>
      </View>
      <Text style={[styles.name, { fontSize: textSize }]}>Lakshyam</Text>
      {showTagline && (
        <Text style={styles.tagline}>KPSC Exam Prep</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  circle: {
    backgroundColor: '#F7B11A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  letter: {
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: fontFamily.bodyBold,
  },
  name: {
    fontWeight: '700',
    color: '#000000',
    fontFamily: fontFamily.bodyBold,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.4)',
    fontFamily: fontFamily.body,
    marginTop: 2,
  },
});
