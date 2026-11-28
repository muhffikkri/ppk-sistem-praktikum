import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

const MINUTE = 60_000;

/**
 * Waktu sekarang yang diperbarui tiap pergantian menit dan saat aplikasi
 * kembali aktif, untuk status "berlangsung" tanpa render per detik.
 */
export function useMinuteClock(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(
        () => {
          setNow(new Date());
          schedule();
        },
        MINUTE - (Date.now() % MINUTE),
      );
    };
    schedule();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      clearTimeout(timer);
      setNow(new Date());
      schedule();
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return now;
}
