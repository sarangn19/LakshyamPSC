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
        useNativeDriver: false,
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

export function LoadingAnimation({ message = 'Loading...', subMessage, progress, size = 'large' }: LoadingAnimationProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Spinner size={size} />
        <View style={styles.textGroup}>
          <Text style={[styles.message, size === 'small' && styles.messageSmall]}>{message}</Text>
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
