function getNotifications(): any {
  try {
    return require('expo-notifications');
  } catch {
    return null;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch { return false; }
}

export async function cancelAllStudyNotifications() {
  const Notifications = getNotifications();
  if (!Notifications) return;
  try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch {}
}

async function scheduleDailyGoalReminderLocal(hour: number, minute: number, target: number) {
  const Notifications = getNotifications();
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync('daily-goal');
    await Notifications.scheduleNotificationAsync({
      identifier: 'daily-goal',
      content: {
        title: 'Study Goal Reminder',
        body: `You're ${target} MCQ away from today's goal. Keep going!`,
      },
      trigger: { type: 'daily', hour, minute },
    });
  } catch {}
}

async function scheduleDueReviewNotificationLocal(dueCount: number) {
  const Notifications = getNotifications();
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync('due-review');
    if (dueCount === 0) return;
    await Notifications.scheduleNotificationAsync({
      identifier: 'due-review',
      content: {
        title: 'Review Time',
        body: `You have ${dueCount} topic${dueCount > 1 ? 's' : ''} due for review. Quick session?`,
      },
      trigger: { type: 'timeInterval', seconds: 3600, repeats: true },
    });
  } catch {}
}

async function scheduleStreakReminderLocal(streakDays: number) {
  const Notifications = getNotifications();
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync('streak');
    if (streakDays === 0) {
      await Notifications.scheduleNotificationAsync({
        identifier: 'streak',
        content: {
          title: 'Start Your Streak',
          body: "You haven't practiced today. One question keeps the streak alive!",
        },
        trigger: { type: 'daily', hour: 19, minute: 0 },
      });
    }
  } catch {}
}

async function scheduleWeeklyReportLocal(totalQuestions: number, accuracy: number, gapsClosed: number) {
  const Notifications = getNotifications();
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync('weekly-report');
    await Notifications.scheduleNotificationAsync({
      identifier: 'weekly-report',
      content: {
        title: 'Weekly Study Report',
        body: `${totalQuestions} questions answered, ${accuracy}% accuracy, ${gapsClosed} gaps closed this week.`,
      },
      trigger: { type: 'weekday', weekday: 1, hour: 10, minute: 0 },
    });
  } catch {}
}

export async function updateAllNotifications(config: {
  dailyGoalHour: number;
  dailyGoalMinute: number;
  dailyTarget: number;
  dueCount: number;
  streakDays: number;
  weekQuestions: number;
  weekAccuracy: number;
  weekGapsClosed: number;
}) {
  const Notifications = getNotifications();
  if (!Notifications) return;
  try {
    await cancelAllStudyNotifications();
    await scheduleDailyGoalReminderLocal(config.dailyGoalHour, config.dailyGoalMinute, config.dailyTarget);
    await scheduleDueReviewNotificationLocal(config.dueCount);
    await scheduleStreakReminderLocal(config.streakDays);
    await scheduleWeeklyReportLocal(config.weekQuestions, config.weekAccuracy, config.weekGapsClosed);
  } catch {}
}
