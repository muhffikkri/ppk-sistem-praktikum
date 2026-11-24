import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { ActivityIndicator, AppState } from 'react-native';
import type * as NotificationsType from 'expo-notifications';

const Notifications = (() => {
  try {
    return require('expo-notifications');
  } catch {
    return null;
  }
})();

import { Banner, Button } from '../../shared/ui';
import {
  removeNotificationToken,
  resumePushRegistration,
  saveNotificationToken,
} from '../../services/firestore/notificationTokenService';
import {
  enableForegroundNotifications,
  getPushToken,
  parsePushTarget,
  pushSupported,
  type PushTarget,
} from '../../services/notifications/pushNotificationService';
import { PermissionStatusBanner } from './PermissionStatusBanner';
import { useDevicePermissions } from './useDevicePermissions';

type RegistrationState = 'idle' | 'registering' | 'registered' | 'error';
const PermissionContext = createContext<
  | (ReturnType<typeof useDevicePermissions> & {
      registration: RegistrationState;
      retryRegistration: () => void;
    })
  | null
>(null);

export function usePermissionContext() {
  const value = useContext(PermissionContext);
  if (!value)
    throw new Error('DevicePermissionGate must wrap permission consumers');
  return value;
}

export function DevicePermissionGate({
  uid,
  onTarget,
  children,
}: PropsWithChildren<{
  uid: string | null;
  onTarget: (target: PushTarget) => boolean;
}>) {
  const permissions = useDevicePermissions();
  const [registration, setRegistration] = useState<RegistrationState>('idle');
  const [revision, setRevision] = useState(0);
  const handled = useRef(new Set<string>());

  useEffect(() => {
    if (!uid || !pushSupported) return;
    resumePushRegistration(uid);
    enableForegroundNotifications();
  }, [uid]);

  useEffect(() => {
    if (
      !uid ||
      !pushSupported ||
      permissions.notifications === 'checking' ||
      permissions.notifications === 'error'
    )
      return;
    let active = true;
    let run = 0;
    const register = async (nativeToken?: NotificationsType.DevicePushToken) => {
      const current = ++run;
      setRegistration('registering');
      try {
        const token = await getPushToken(nativeToken);
        if (!active || current !== run) return;
        await saveNotificationToken(uid, token);
        if (active && current === run) setRegistration('registered');
      } catch {
        if (active && current === run) setRegistration('error');
      }
    };

    if (permissions.notifications !== 'granted') {
      void removeNotificationToken(uid).catch(() => {
        if (active) setRegistration('error');
      });
      return () => {
        active = false;
      };
    }

    // Register again when returning to the app or when the native token changes.
    void Promise.resolve().then(() => {
      if (active) void register();
    });
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') void register();
    });
    const tokenChanges = Notifications?.addPushTokenListener?.((token: NotificationsType.DevicePushToken) => {
      void register(token);
    });
    return () => {
      active = false;
      appState.remove();
      tokenChanges?.remove?.();
    };
  }, [uid, permissions.notifications, revision]);

  useEffect(() => {
    if (!uid || !pushSupported || !Notifications) return;
    let active = true;
    let retry: ReturnType<typeof setTimeout> | undefined;
    function receive(
      response: NotificationsType.NotificationResponse,
      attempts = 0,
    ) {
      if (!active) return;
      const { request } = response.notification;
      if (handled.current.has(request.identifier)) return;
      const target = parsePushTarget(request.content.data, uid!);
      if (!target) return;
      if (onTarget(target)) {
        handled.current.add(request.identifier);
        void Notifications?.clearLastNotificationResponseAsync?.().catch(
          () => undefined,
        );
      } else if (attempts < 30) {
        clearTimeout(retry);
        retry = setTimeout(() => receive(response, attempts + 1), 250);
      }
    }

    const subscription = Notifications?.addNotificationResponseReceivedListener?.(
      (response: NotificationsType.NotificationResponse) => receive(response),
    );
    void Notifications?.getLastNotificationResponseAsync?.()
      .then((response: NotificationsType.NotificationResponse | null) => {
        if (response) receive(response);
      })
      .catch(() => undefined);
    return () => {
      active = false;
      clearTimeout(retry);
      subscription?.remove?.();
    };
  }, [uid, onTarget]);

  return (
    <PermissionContext.Provider
      value={{
        ...permissions,
        registration:
          permissions.notifications === 'granted' ? registration : 'idle',
        retryRegistration: () => setRevision((value) => value + 1),
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function LocationPermissionGate({ children }: PropsWithChildren) {
  const permission = usePermissionContext();
  if (permission.location === 'granted') return <>{children}</>;
  if (permission.location === 'checking')
    return <ActivityIndicator accessibilityLabel="Memeriksa izin lokasi" />;
  return (
    <PermissionStatusBanner
      kind="location"
      status={permission.location}
      onRequest={() => void permission.check('location', true)}
      onSettings={() => void permission.openSettings('location')}
      onRetry={() => void permission.check('location')}
    />
  );
}

export function NotificationPermissionStatus() {
  const permission = usePermissionContext();
  if (
    permission.notifications === 'checking' ||
    permission.registration === 'registering'
  ) {
    return <ActivityIndicator accessibilityLabel="Memeriksa notifikasi" />;
  }
  if (permission.registration === 'error') {
    return (
      <Banner
        tone="danger"
        title="Notifikasi belum aktif"
        message="Periksa koneksi lalu coba daftarkan perangkat lagi."
        action={
          <Button label="Coba lagi" onPress={permission.retryRegistration} />
        }
      />
    );
  }
  if (permission.registration === 'registered') {
    return (
      <Banner
        title="Notifikasi aktif"
        message="Perangkat ini siap menerima pembaruan praktikum."
      />
    );
  }
  return (
    <PermissionStatusBanner
      kind="notifications"
      status={permission.notifications}
      onRequest={() => void permission.check('notifications', true)}
      onSettings={() => void permission.openSettings('notifications')}
      onRetry={() => void permission.check('notifications')}
    />
  );
}
