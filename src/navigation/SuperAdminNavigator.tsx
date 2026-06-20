import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { useTranslation } from '../i18n/useTranslation';

import { ExecutiveDashboardScreen } from '../screens/superadmin/ExecutiveDashboardScreen';
import { CognitiveTwinControlScreen } from '../screens/superadmin/CognitiveTwinControlScreen';
import { RecommendationEngineAnalyticsScreen } from '../screens/superadmin/RecommendationEngineAnalyticsScreen';
import { UserManagementScreen } from '../screens/superadmin/UserManagementScreen';
import { AccessControlScreen } from '../screens/superadmin/AccessControlScreen';
import { SystemMonitoringScreen } from '../screens/superadmin/SystemMonitoringScreen';
import { ExperimentCenterScreen } from '../screens/superadmin/ExperimentCenterScreen';
import { AuditLogsScreen } from '../screens/superadmin/AuditLogsScreen';
import { BillingDashboardScreen } from '../screens/superadmin/BillingDashboardScreen';
import { SuggestionManagementScreen } from '../screens/admin/SuggestionManagementScreen';

const Tab = createBottomTabNavigator();

const SUPER_ADMIN_TABS = [
  { name: 'ExecDashboard', component: ExecutiveDashboardScreen, icon: '📊', labelKey: 'superadmin.execTab' },
  { name: 'CognitiveTwinControl', component: CognitiveTwinControlScreen, icon: '🧠', labelKey: 'superadmin.cognitiveTab' },
  { name: 'RecEngine', component: RecommendationEngineAnalyticsScreen, icon: '🎯', labelKey: 'superadmin.recTab' },
  { name: 'UserManagement', component: UserManagementScreen, icon: '👥', labelKey: 'superadmin.usersTab' },
  { name: 'AccessControl', component: AccessControlScreen, icon: '🔐', labelKey: 'superadmin.accessTab' },
  { name: 'Billing', component: BillingDashboardScreen, icon: '💰', labelKey: 'superadmin.billingTab' },
  { name: 'SystemMonitoring', component: SystemMonitoringScreen, icon: '⚙️', labelKey: 'superadmin.systemTab' },
  { name: 'ExperimentCenter', component: ExperimentCenterScreen, icon: '🧪', labelKey: 'superadmin.expTab' },
  { name: 'AuditLogs', component: AuditLogsScreen, icon: '📋', labelKey: 'superadmin.auditTab' },
  { name: 'Suggestions', component: SuggestionManagementScreen, icon: '💡', labelKey: 'superadmin.suggestionsTab' },
];

function SuperAdminTabIcon({ name, focused }: { name: string; focused: boolean }) {
  const tab = SUPER_ADMIN_TABS.find((t) => t.name === name);
  return (
    <View style={tabStyles.iconWrap}>
      <Text style={{ fontSize: focused ? 20 : 18, opacity: focused ? 1 : 0.6 }}>
        {tab?.icon || '📌'}
      </Text>
    </View>
  );
}

export function SuperAdminNavigator() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <SuperAdminTabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 9, marginBottom: 4 },
        tabBarLabel: t(SUPER_ADMIN_TABS.find((t) => t.name === route.name)?.labelKey || route.name),
      })}
    >
      {SUPER_ADMIN_TABS.map((tab) => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
      ))}
    </Tab.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: { justifyContent: 'center', alignItems: 'center', marginTop: 4 },
});
