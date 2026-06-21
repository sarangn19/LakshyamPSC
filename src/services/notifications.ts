import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getDueSummary } from './spacedRepetition';
import { getLearnerStageName } from './learnerStage';

let initialized = false;

const isWeb = Platform.OS === 'web';

if (!isWeb) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function initNotifications(): Promise<void> {
  if (isWeb || initialized) return;
  initialized = true;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Study Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await scheduleReviewReminders();
}

async function cancelAll(): Promise<void> {
  if (isWeb) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleReviewReminders(): Promise<void> {
  if (isWeb) return;
  await cancelAll();

  const due = getDueSummary();
  if (due.count > 0) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Review Time',
        body: `You have ${due.count} items due for review`,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3600, repeats: true },
    });
  } else {
    const stage = getLearnerStageName();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Great Progress!',
        body: stage === 'polishing'
          ? 'You\'re on top of everything — try a mock test today'
          : 'Keep the momentum — 10 quick MCQs will strengthen your memory',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 43200,
        repeats: true,
      },
    });
  }
}

export async function getNotificationPermission(): Promise<Notifications.PermissionStatus | 'web'> {
  if (isWeb) return 'web';
  const r = await Notifications.getPermissionsAsync();
  return r.status;
}
