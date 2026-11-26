import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import type { NotificationPermissionsStatus } from 'expo-notifications';
import {
  Notifications,
  preparePushChannel,
  pushSupported,
} from '../../services/notifications/pushNotificationService';

export type PermissionState =
  | 'checking'
  | 'ask'
  | 'blocked'
  | 'granted'
  | 'disabled'
  | 'unsupported'
  | 'error';
type PermissionKind = 'location' | 'notifications';

function status(result: {
  granted: boolean;
  canAskAgain: boolean;
}): PermissionState {
  return result.granted ? 'granted' : result.canAskAgain ? 'ask' : 'blocked';
}

async function readLocation(request: boolean): Promise<PermissionState> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return 'unsupported';
  const current = await Location.getForegroundPermissionsAsync();
  const result =
    request && !current.granted && current.canAskAgain
      ? await Location.requestForegroundPermissionsAsync()
      : current;
  if (result.granted && !(await Location.hasServicesEnabledAsync()))
    return 'disabled';
  return status(result);
}

async function readNotifications(request: boolean): Promise<PermissionState> {
  if (!pushSupported || !Notifications) return 'unsupported';
  await preparePushChannel();
  const current = await Notifications.getPermissionsAsync();
  const usable = (value: NotificationPermissionsStatus) =>
    value.granted ||
    value.ios?.status === Notifications.IosAuthorizationStatus?.PROVISIONAL ||
    value.ios?.status === Notifications.IosAuthorizationStatus?.EPHEMERAL;
  const result =
    request && !usable(current) && current.canAskAgain
      ? await Notifications.requestPermissionsAsync()
      : current;
  return usable(result) ? 'granted' : status(result);
}

export function useDevicePermissions() {
  const [permissions, setPermissions] = useState<
    Record<PermissionKind, PermissionState>
  >({
    location: 'checking',
    notifications: 'checking',
  });
  const mounted = useRef(false);
  const pending = useRef<Partial<Record<PermissionKind, Promise<void>>>>({});

  const check = useCallback(
    (kind: PermissionKind, request = false): Promise<void> => {
      const existing = pending.current[kind];
      if (existing && !request) return existing;
      const read = kind === 'location' ? readLocation : readNotifications;
      const operation = (existing ?? Promise.resolve())
        .then(() => read(request))
        .then((value) => {
          if (mounted.current)
            setPermissions((current) => ({ ...current, [kind]: value }));
        })
        .catch(() => {
          if (mounted.current)
            setPermissions((current) => ({ ...current, [kind]: 'error' }));
        })
        .finally(() => {
          if (pending.current[kind] === operation) delete pending.current[kind];
        });
      pending.current[kind] = operation;
      return operation;
    },
    [],
  );

  useEffect(() => {
    mounted.current = true;
    void check('location');
    void check('notifications');
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void check('location');
        void check('notifications');
      }
    });
    return () => {
      mounted.current = false;
      subscription.remove();
    };
  }, [check]);

  const openSettings = async (kind: PermissionKind) => {
    try {
      if (
        kind === 'location' &&
        permissions.location === 'disabled' &&
        Platform.OS === 'android'
      ) {
        await Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
      } else {
        await Linking.openSettings();
      }
    } catch {
      setPermissions((current) => ({ ...current, [kind]: 'error' }));
    }
  };

  return { ...permissions, check, openSettings };
}
