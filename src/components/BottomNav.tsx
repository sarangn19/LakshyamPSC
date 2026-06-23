import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeIcon, LearnIcon, AIIcon } from './Icons';
import { colors } from '../theme';

export type TabName = 'Home' | 'Learn' | 'AITutor' | 'Profile';

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
  { name: 'AITutor', label: 'AI Tutor', icon: (c) => <AIIcon width={20} height={20} color={c} /> },
];

export const BOTTOM_NAV_HEIGHT = 80;
export const TAB_BAR_TOTAL_HEIGHT = BOTTOM_NAV_HEIGHT;

export function BottomNav({ activeTab }: Props) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const handlePress = (tab: TabName) => {
    if (tab === activeTab) return;
    navigation.navigate(tab);
  };

  return (
    <View style={[styles.bottomNav, { paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }]}>
      <View style={styles.navItems}>
        {TABS.map((tab) => {
          const isActive = tab.name === activeTab;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.navItem}
              onPress={() => handlePress(tab.name)}
              activeOpacity={0.7}
            >
              <View style={isActive ? styles.activeIconBg : styles.inactiveIconBg}>
                {tab.icon(isActive ? colors.primary : '#999999')}
              </View>
              <Text style={[styles.navLabel, { color: isActive ? '#000000' : '#999999' }]}>
                {tab.label}
              </Text>
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
    left: 0,
    right: 0,
    bottom: 0,
    height: BOTTOM_NAV_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 115,
    elevation: 12,
    zIndex: 10,
  },
  navItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 48,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconBg: {
    width: 60.9,
    height: 60.9,
    borderRadius: 30.45,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  inactiveIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.3,
  },
});
