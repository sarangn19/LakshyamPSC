import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { fontFamily } from '../theme';

interface LogoProps {
  size?: 'small' | 'large' | 'xl';
  showTagline?: boolean;
}

export function Logo({ size = 'large', showTagline = false }: LogoProps) {
  const imgSize = size === 'small' ? 80 : size === 'large' ? 140 : 200;
  const textSize = size === 'small' ? 18 : size === 'large' ? 28 : 36;

  return (
    <View style={styles.wrap}>
      <Image
        source={require('../../assets/logo.png')}
        style={{ width: imgSize, height: imgSize * 0.3, resizeMode: 'contain' }}
      />
      {showTagline && (
        <Text style={[styles.tagline, { fontSize: size === 'small' ? 11 : 13 }]}>KPSC Exam Prep</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  tagline: {
    color: 'rgba(0,0,0,0.4)',
    fontFamily: fontFamily.body,
    marginTop: 4,
  },
});
