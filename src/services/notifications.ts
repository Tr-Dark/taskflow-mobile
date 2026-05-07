import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { PermissionStatus } from 'expo-modules-core';
import { RootState } from '../types';
import { combineDateAndTime, isFutureDateTime } from '../utils/date';

const CHANNEL_ID = 'taskflow-reminders';

export type NotificationPermissionState = 'granted' | 'denied' | 'undetermined';

type NotificationsModule = typeof import('expo-notifications');

function isExpoGoRuntime() {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

async function loadNotificationsModule(): Promise<NotificationsModule | null> {
  if (isExpoGoRuntime()) {
    return null;
  }
  return await import('expo-notifications');
}

function mapPermissionStatus(status: PermissionStatus): NotificationPermissionState {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export async function setupNotificationsInRuntimeAsync() {
  const Notifications = await loadNotificationsModule();
  if (!Notifications) {
    return false;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  return true;
}

export async function configureNotificationChannelAsync() {
  const Notifications = await loadNotificationsModule();
  if (!Notifications) {
    return false;
  }

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'TaskFlow reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 120, 200],
    lightColor: '#5B3DF5',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });

  return true;
}

export async function getNotificationPermissionStateAsync(): Promise<NotificationPermissionState> {
  const Notifications = await loadNotificationsModule();
  if (!Notifications) {
    return 'undetermined';
  }

  const settings = await Notifications.getPermissionsAsync();
  return mapPermissionStatus(settings.status);
}

export async function requestNotificationPermissionAsync(): Promise<NotificationPermissionState> {
  const Notifications = await loadNotificationsModule();
  if (!Notifications) {
    return 'undetermined';
  }

  const settings = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return mapPermissionStatus(settings.status);
}

export function isNotificationsLimitedInExpoGo() {
  return isExpoGoRuntime();
}

function buildTaskTrigger(Notifications: NotificationsModule, dateString: string, timeString?: string) {
  const target = combineDateAndTime(dateString, timeString ?? '09:00');
  if (!isFutureDateTime(target)) {
    return null;
  }

  return {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: target,
    channelId: CHANNEL_ID,
  } as const;
}

function buildBirthdayTrigger(Notifications: NotificationsModule, dateString: string) {
  const date = new Date(`${dateString}T09:00:00`);
  return {
    type: Notifications.SchedulableTriggerInputTypes.YEARLY,
    month: date.getMonth(),
    day: date.getDate(),
    hour: 9,
    minute: 0,
    channelId: CHANNEL_ID,
  } as const;
}

function buildWellnessTrigger(Notifications: NotificationsModule, minutes: number) {
  return {
    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: minutes * 60,
    repeats: true,
    channelId: CHANNEL_ID,
  } as const;
}

export async function syncScheduledNotificationsAsync(state: RootState) {
  const Notifications = await loadNotificationsModule();
  if (!Notifications) {
    return false;
  }

  const activeData = state.datasets[state.activeMode];
  await configureNotificationChannelAsync();
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const task of activeData.tasks) {
    if (task.status === 'completed' || !task.dueDate) {
      continue;
    }

    const trigger = buildTaskTrigger(Notifications, task.dueDate, task.scheduledStartTime);
    if (!trigger) {
      continue;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: task.scheduledStartTime ? 'Nadchodzi zaplanowane zadanie' : 'Przypomnienie o zadaniu',
        body: task.title,
        data: {
          entityType: 'task',
          taskId: task.id,
        },
        sound: true,
      },
      trigger,
    });
  }

  for (const note of activeData.notes) {
    if (note.section !== 'birthdays' || !note.reminderEnabled || !note.reminderDate) {
      continue;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Przypomnienie o urodzinach',
        body: note.personName ? `${note.personName}: ${note.title}` : note.title,
        data: {
          entityType: 'note',
          noteId: note.id,
        },
        sound: true,
      },
      trigger: buildBirthdayTrigger(Notifications, note.reminderDate),
    });
  }

  for (const reminder of activeData.reminders) {
    if (!reminder.enabled) {
      continue;
    }

    const body =
      reminder.type === 'water'
        ? 'Napij się wody i zadbaj o koncentrację.'
        : reminder.type === 'movement'
          ? 'Krótki ruch dobrze zrobi Twojemu ciału.'
          : 'Zrób krótką przerwę i odetchnij.';

    await Notifications.scheduleNotificationAsync({
      content: {
        title:
          reminder.type === 'water'
            ? 'Pora na wodę'
            : reminder.type === 'movement'
              ? 'Pora się poruszać'
              : 'Pora na przerwę',
        body,
        data: {
          entityType: 'wellness',
          reminderType: reminder.type,
        },
        sound: true,
      },
      trigger: buildWellnessTrigger(Notifications, reminder.interval),
    });
  }

  return true;
}
