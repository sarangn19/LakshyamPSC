import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { fontFamily } from '../../theme';

interface LoadingAnimationProps {
  message?: string;
  subMessage?: string;
  progress?: { current: number; total: number };
  size?: 'small' | 'large';
}

function Spinner({ size = 'large' }: { size?: 'small' | 'large' }) {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [spinAnim]);

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const dim = size === 'small' ? 20 : 32;
  const borderW = size === 'small' ? 2 : 3;

  return (
    <Animated.View
      style={[
        spinnerStyles.spinner,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          borderWidth: borderW,
          transform: [{ rotate }],
        },
      ]}
    />
  );
}

const spinnerStyles = StyleSheet.create({
  spinner: {
    borderColor: 'rgba(0,0,0,0.1)',
    borderTopColor: '#ED9200',
  },
});

function Dots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      );

    anim(dot1, 0).start();
    anim(dot2, 200).start();
    anim(dot3, 400).start();

    return () => {
      dot1.stopAnimation();
      dot2.stopAnimation();
      dot3.stopAnimation();
    };
  }, [dot1, dot2, dot3]);

  const makeDotStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }],
  });

  return (
    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
      <Animated.View style={[{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#ED9200' }, makeDotStyle(dot1)]} />
      <Animated.View style={[{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#ED9200' }, makeDotStyle(dot2)]} />
      <Animated.View style={[{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#ED9200' }, makeDotStyle(dot3)]} />
    </View>
  );
}

export function LoadingAnimation({ message = 'Loading...', subMessage, progress, size = 'large' }: LoadingAnimationProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Spinner size={size} />
        <View style={styles.textGroup}>
          <View style={styles.messageRow}>
            <Text style={[styles.message, size === 'small' && styles.messageSmall]}>{message}</Text>
            <Dots />
          </View>
          {subMessage && <Text style={styles.subMessage}>{subMessage}</Text>}
          {progress && (
            <View style={styles.progressRow}>
              <View style={styles.progressBg}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.round((progress.current / progress.total) * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {progress.current}/{progress.total}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 12,
    gap: 16,
    boxShadow: '0px 0px 24px rgba(0,0,0,0.12)',
    elevation: 8,
    minWidth: 220,
  },
  textGroup: {
    flex: 1,
    gap: 4,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    fontFamily: fontFamily.bodyMedium,
    color: '#000000',
  },
  messageSmall: {
    fontSize: 14,
  },
  subMessage: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    fontFamily: fontFamily.body,
    color: 'rgba(0,0,0,0.5)',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  progressBg: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ED9200',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fontFamily.bodyMedium,
    color: 'rgba(0,0,0,0.4)',
  },
});
