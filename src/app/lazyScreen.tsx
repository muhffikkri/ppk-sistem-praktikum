import { lazy, Suspense, type ComponentType } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BackButton, Screen, SkeletonList } from '../shared/ui';
import type { RootStackParamList } from './navigation';

/**
 * Memuat modul layar saat pertama kali dibuka, bukan saat aplikasi start.
 * Saat chunk masih diunduh, skeleton menampilkan bentuk halaman agar
 * pengguna tetap mendapat feedback dan tombol kembali tetap tersedia.
 */
export function lazyScreen<Name extends keyof RootStackParamList>(
  load: () => Promise<unknown>,
  exportName: string,
  label: string,
): ComponentType<NativeStackScreenProps<RootStackParamList, Name>> {
  const Lazy = lazy(() =>
    load().then((module) => ({
      default: (module as Record<string, ComponentType<any>>)[exportName],
    })),
  );

  return function LazyScreen(
    props: NativeStackScreenProps<RootStackParamList, Name>,
  ) {
    return (
      <Suspense
        fallback={
          <Screen withDock={false}>
            <BackButton onPress={props.navigation.goBack} />
            <SkeletonList label={label} />
          </Screen>
        }
      >
        <Lazy {...props} />
      </Suspense>
    );
  };
}
