import React from 'react';
import { View, TouchableOpacity, StyleSheet, useWindowDimensions, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HomeIcon, LearnIcon, PracticeIcon, AIIcon, ProfileIcon } from './Icons';

export type TabName = 'Home' | 'Learn' | 'Practice' | 'AITutor' | 'Profile';

type Props = {
  activeTab: TabName;
};

type TabConfig = {
  name: TabName;
  label: string;
  icon: (color: string) => React.ReactNode;
};

const TABS: TabConfig[] = [
  { name: 'Home', label: 'Home', icon: (c) => <HomeIcon width={18} height={18} color={c} /> },
  { name: 'Learn', label: 'Learn', icon: (c) => <LearnIcon width={20} height={20} color={c} /> },
  { name: 'Practice', label: 'Practice', icon: (c) => <PracticeIcon width={20} height={20} color={c} /> },
  { name: 'AITutor', label: 'AI Tutor', icon: (c) => <AIIcon width={20} height={20} color={c} /> },
  { name: 'Profile', label: 'Profile', icon: (c) => <ProfileIcon width={18} height={20} color={c} /> },
];

export function BottomNav({ activeTab }: Props) {
  const navigation = useNavigation<any>();
  const { width: screenW } = useWindowDimensions();
  const navWidth = screenW - 48;
  const tabCount = TABS.length;

  const handlePress = (tab: TabName) => {
    if (tab === activeTab) return;
    navigation.navigate(tab);
  };

  return (
    <View style={styles.bottomNav}>
      <View style={styles.navItems}>
        {TABS.map((tab, i) => {
          const isActive = tab.name === activeTab;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.navItem}
              onPress={() => handlePress(tab.name)}
              activeOpacity={0.7}
            >
              {tab.icon(isActive ? '#FFFFFF' : '#8E8E93')}
              <Text style={[styles.navLabel, { color: isActive ? '#FFFFFF' : '#8E8E93' }]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
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
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    justifyContent: 'center',
    zIndex: 10,
  },
  navItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 52,
  },
  navLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F7B11A',
    marginTop: 2,
  },
});
