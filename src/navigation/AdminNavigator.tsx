import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { useTranslation } from '../i18n/useTranslation';

import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { QuestionManagementScreen } from '../screens/admin/QuestionManagementScreen';
import { CurrentAffairsManagementScreen } from '../screens/admin/CurrentAffairsManagementScreen';
import { ContentQualityCenterScreen } from '../screens/admin/ContentQualityCenterScreen';
import { LearnerSupportScreen } from '../screens/admin/LearnerSupportScreen';
import { LearningAnalyticsScreen } from '../screens/admin/LearningAnalyticsScreen';
import { QuestionAuditScreen } from '../screens/admin/QuestionAuditScreen';
import { BulkUploadScreen } from '../screens/admin/BulkUploadScreen';
import { SubscriptionManagementScreen } from '../screens/admin/SubscriptionManagementScreen';
import { SuggestionManagementScreen } from '../screens/admin/SuggestionManagementScreen';

const Tab = createBottomTabNavigator();

const ADMIN_TABS = [
  { name: 'AdminDashboard', component: AdminDashboardScreen, icon: '📊', labelKey: 'admin.dashboardTab' },
  { name: 'QuestionMgmt', component: QuestionManagementScreen, icon: '❓', labelKey: 'admin.questionMgmtTab' },
  { name: 'CurrentAffairsMgmt', component: CurrentAffairsManagementScreen, icon: '📰', labelKey: 'admin.caTab' },
  { name: 'ContentQuality', component: ContentQualityCenterScreen, icon: '✨', labelKey: 'admin.qualityTab' },
  { name: 'QuestionAudit', component: QuestionAuditScreen, icon: '🔍', labelKey: 'admin.auditTab' },
  { name: 'BulkUpload', component: BulkUploadScreen, icon: '📤', labelKey: 'admin.bulkUploadTab' },
  { name: 'SubscriptionMgmt', component: SubscriptionManagementScreen, icon: '💳', labelKey: 'admin.subscriptionTab' },
  { name: 'LearnerSupport', component: LearnerSupportScreen, icon: '🎫', labelKey: 'admin.supportTab' },
  { name: 'Suggestions', component: SuggestionManagementScreen, icon: '💡', labelKey: 'admin.suggestionsTab' },
  { name: 'LearningAnalytics', component: LearningAnalyticsScreen, icon: '📈', labelKey: 'admin.analyticsTab' },
];

function AdminTabIcon({ name, focused }: { name: string; focused: boolean }) {
  const tab = ADMIN_TABS.find((t) => t.name === name);
  return (
    <View style={tabStyles.iconWrap}>
      <Text style={{ fontSize: focused ? 20 : 18, opacity: focused ? 1 : 0.6 }}>
        {tab?.icon || '📌'}
      </Text>
    </View>
  );
}

export function AdminNavigator() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <AdminTabIcon name={route.name} focused={focused} />,
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
        tabBarLabel: t(ADMIN_TABS.find((t) => t.name === route.name)?.labelKey || route.name),
      })}
    >
      {ADMIN_TABS.map((tab) => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
      ))}
    </Tab.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: { justifyContent: 'center', alignItems: 'center', marginTop: 4 },
});
