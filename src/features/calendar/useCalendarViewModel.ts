import { useMemo, useState } from 'react';

import type { Session } from '../../domain/types';

export const WEEKDAY_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export type CalendarDay = {
  date: Date;
  label: string;
  hasSession: boolean;
  isToday: boolean;
  isSelected: boolean;
};

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Senin = awal minggu
  return d;
}

/** Kalkulasi tanggal kalender: minggu aktif, hari terpilih, sesi per hari. */
export function useCalendarViewModel(sessions: Session[]) {
  const [selected, setSelected] = useState(() => new Date());

  return useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(selected);
    const days: CalendarDay[] = WEEKDAY_SHORT.map((label, i) => {
      const date = addDays(weekStart, i);
      return {
        date,
        label,
        hasSession: sessions.some((s) => sameDay(new Date(s.startsAt), date)),
        isToday: sameDay(date, today),
        isSelected: sameDay(date, selected),
      };
    });
    const daySessions = sessions
      .filter((s) => sameDay(new Date(s.startsAt), selected))
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );

    return {
      days,
      daySessions,
      selected,
      monthYear: `${MONTHS[selected.getMonth()]} ${selected.getFullYear()}`,
      isCurrentWeek: sameDay(weekStart, startOfWeek(today)),
      select: setSelected,
      prevWeek: () => setSelected(addDays(selected, -7)),
      nextWeek: () => setSelected(addDays(selected, 7)),
      goToday: () => setSelected(new Date()),
    };
  }, [sessions, selected]);
}
