import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { DevicePushToken } from 'expo-notifications';
import { Platform } from 'react-native';

const Notifications = (() => {
  try {
    return require('expo-notifications');
  } catch {
    return null;
  }
})();

export const PUSH_CHANNEL = 'practicum';
export const pushSupported =
  Boolean(Notifications) &&
  (Platform.OS === 'android' || Platform.OS === 'ios') &&
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

export type PushTarget =
  | {
      type: 'session_opened' | 'session_scheduled' | 'schedule_changed';
      sessionId: string;
    }
  | { type: 'leave_decided'; leaveId: string };

export function parsePushTarget(
  data: Record<string, unknown> | undefined,
  uid: string,
): PushTarget | null {
  if (data?.recipientUid !== uid) return null;
  switch (data.type) {
    case 'session_opened':
    case 'session_scheduled':
    case 'schedule_changed':
      return typeof data.sessionId === 'string' && data.sessionId
        ? { type: data.type, sessionId: data.sessionId }
        : null;
    case 'leave_decided':
      return typeof data.leaveId === 'string' && data.leaveId
        ? { type: data.type, leaveId: data.leaveId }
        : null;
    default:
      return null;
  }
}

export async function preparePushChannel() {
  if (pushSupported && Notifications && Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(PUSH_CHANNEL, {
      name: 'Praktikum',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

export async function getPushToken(devicePushToken?: DevicePushToken) {
  if (!Notifications) {
    throw new Error('Notifications module not available');
  }
  const projectId =
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof projectId !== 'string' || !projectId) {
    throw new Error('EAS project ID is missing');
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      Notifications.getExpoPushTokenAsync({ projectId, devicePushToken }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('Push registration timed out')),
          12_000,
        );
      }),
    ]);
    return result.data;
  } finally {
    clearTimeout(timer);
  }
}

export function enableForegroundNotifications() {
  if (!pushSupported || !Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}
