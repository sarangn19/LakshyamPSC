import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Easing, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HomeIcon, LearnIcon, ChatbotIcon } from './Icons';

type TabName = 'Home' | 'Learn' | 'Chatbot';

type Props = {
  activeTab: TabName;
};

export function BottomNav({ activeTab }: Props) {
  const navigation = useNavigation<any>();
  const { width: screenW } = useWindowDimensions();
  const [navWidth, setNavWidth] = useState(0);
  const navW = screenW - 48;

  const getTargetLeft = (w: number, tab: TabName) => {
    if (tab === 'Home') return 8;
    if (tab === 'Learn') return (w - 54.32) / 2;
    return w - 54.32 - 9;
  };

  const initialLeft = getTargetLeft(navW, activeTab);
  const indicatorAnim = useRef(new Animated.Value(initialLeft)).current;

  const handlePress = (tab: TabName) => {
    if (tab === activeTab) return;
    const w = navWidth || navW;
    const targetLeft = getTargetLeft(w, tab);
    Animated.timing(indicatorAnim, {
      toValue: targetLeft,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      navigation.navigate(tab);
    });
  };

  return (
    <View style={styles.bottomNav} onLayout={(e) => { setNavWidth(e.nativeEvent.layout.width); }}>
      <Animated.View style={[styles.navActiveBg, { left: indicatorAnim }]} />
      <View style={styles.navItems}>
        <TouchableOpacity style={[styles.navItem, activeTab === 'Home' && styles.navItemActive]} onPress={() => handlePress('Home')}>
          <HomeIcon width={16.25} height={16} color={activeTab === 'Home' ? 'white' : 'black'} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, activeTab === 'Learn' && styles.navItemActive]} onPress={() => handlePress('Learn')}>
          <LearnIcon width={18.97} height={16} color={activeTab === 'Learn' ? 'white' : 'black'} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, activeTab === 'Chatbot' && styles.navItemActive]} onPress={() => handlePress('Chatbot')}>
          <ChatbotIcon width={19} height={16} color={activeTab === 'Chatbot' ? 'white' : 'black'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 24,
    height: 72,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
    justifyContent: 'center',
    zIndex: 10,
  },
  navActiveBg: {
    position: 'absolute',
    top: 8.84,
    width: 54.32,
    height: 54.32,
    borderRadius: 999,
    backgroundColor: '#F7B11A',
  },
  navItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  navItem: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navItemActive: {
    zIndex: 1,
  },
});
