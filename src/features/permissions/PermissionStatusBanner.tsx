import { Banner, Button } from '../../shared/ui';
import type { PermissionState } from './useDevicePermissions';

const messages = {
  location: {
    ask: 'Izinkan akses lokasi saat memakai fitur presensi atau posisi saya.',
    blocked: 'Aktifkan izin lokasi aplikasi di pengaturan perangkat.',
    disabled: 'Nyalakan layanan lokasi perangkat lalu coba lagi.',
    unsupported: 'Lokasi praktikum tersedia di aplikasi Android atau iOS.',
    error: 'Status lokasi belum dapat diperiksa.',
  },
  notifications: {
    ask: 'Aktifkan notifikasi untuk menerima pembaruan praktikum.',
    blocked: 'Aktifkan izin notifikasi aplikasi di pengaturan perangkat.',
    disabled: 'Nyalakan notifikasi di pengaturan perangkat.',
    unsupported:
      'Push tersedia di development build atau aplikasi Android dan iOS yang sudah dikonfigurasi.',
    error: 'Status izin notifikasi belum dapat diperiksa.',
  },
} as const;

export function PermissionStatusBanner({
  kind,
  status,
  onRequest,
  onSettings,
  onRetry,
}: {
  kind: keyof typeof messages;
  status: PermissionState;
  onRequest: () => void;
  onSettings: () => void;
  onRetry: () => void;
}) {
  if (status === 'granted' || status === 'checking') return null;
  const action = {
    ask: { label: 'Izinkan', run: onRequest },
    blocked: { label: 'Pengaturan', run: onSettings },
    disabled: { label: 'Pengaturan', run: onSettings },
    error: { label: 'Coba lagi', run: onRetry },
    unsupported: null,
  }[status];
  return (
    <Banner
      title={kind === 'location' ? 'Akses lokasi' : 'Notifikasi praktikum'}
      tone={status === 'error' ? 'danger' : 'warning'}
      message={messages[kind][status]}
      action={
        action ? (
          <Button label={action.label} variant="outline" onPress={action.run} />
        ) : undefined
      }
    />
  );
}
