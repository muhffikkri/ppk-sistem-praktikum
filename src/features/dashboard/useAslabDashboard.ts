import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Lab } from '../../domain/geoTypes';
import {
  buildLabDashboard,
  periodRange,
  type DashboardPeriod,
  type LabDashboardSummary,
  type PeriodRange,
} from '../../domain/labDashboardRules';
import type { PracticalClass, Session } from '../../domain/types';
import {
  subscribeClassesForCourses,
  subscribeLabsForCourses,
  subscribeSessionsForCourses,
} from '../../services/firestore/labDashboardService';
import { useAuth } from '../../state';
import { useMinuteClock } from './useMinuteClock';

/** Jendela sesi "saat ini": awal hari ini sampai lima minggu ke depan. */
const CURRENT_WINDOW_DAYS = 35;

type Keyed<T> = { key: string; items: T[] };

export type AslabDashboardViewModel = {
  hasScope: boolean;
  loading: boolean;
  error: string | null;
  /** Data periode terpilih sedang dimuat ulang setelah filter berubah. */
  periodLoading: boolean;
  range: PeriodRange;
  summary: LabDashboardSummary;
  courseIds: string[];
  labs: Lab[];
  now: Date;
  retry: () => void;
};

function useCourseIds(): string[] {
  const { user } = useAuth();
  // Kunci string menjaga referensi array tetap stabil antar-render profil.
  const key = [...(user?.managedCourseIds ?? [])]
    .filter(Boolean)
    .sort()
    .join('|');
  return useMemo(() => (key ? key.split('|') : []), [key]);
}

/**
 * Menggabungkan listener lab, kelas, dan sesi dalam cakupan Aslab.
 * Sesi periode dan sesi "saat ini" diambil terpisah agar mengganti filter
 * tidak memutus status lab yang sedang berlangsung.
 */
export function useAslabDashboard(
  period: DashboardPeriod,
  offset: number,
): AslabDashboardViewModel {
  const courseIds = useCourseIds();
  const now = useMinuteClock();
  const dayKey = now.toDateString();
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [labs, setLabs] = useState<Lab[] | null>(null);
  const [classes, setClasses] = useState<PracticalClass[] | null>(null);
  const [current, setCurrent] = useState<Keyed<Session> | null>(null);
  const [periodData, setPeriodData] = useState<Keyed<Session> | null>(null);

  // `dayKey` menggeser rentang saat tengah malam terlewati.
  const range = useMemo(
    () => periodRange(period, offset),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [period, offset, dayKey],
  );
  const periodKey = `${range.start.toISOString()}|${range.end.toISOString()}`;

  const currentWindow = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + CURRENT_WINDOW_DAYS);
    return { from: start.toISOString(), to: end.toISOString() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey]);
  const currentKey = `${currentWindow.from}|${currentWindow.to}`;

  const onError = useCallback((message: string) => setError(message), []);

  useEffect(() => {
    const offLabs = subscribeLabsForCourses(courseIds, {
      onData: setLabs,
      onError,
    });
    const offClasses = subscribeClassesForCourses(courseIds, {
      onData: setClasses,
      onError,
    });
    return () => {
      offLabs();
      offClasses();
    };
  }, [courseIds, attempt, onError]);

  useEffect(
    () =>
      subscribeSessionsForCourses(
        courseIds,
        currentWindow.from,
        currentWindow.to,
        {
          onData: (items) => setCurrent({ key: currentKey, items }),
          onError,
        },
      ),
    [courseIds, currentWindow, currentKey, attempt, onError],
  );

  useEffect(
    () =>
      subscribeSessionsForCourses(
        courseIds,
        range.start.toISOString(),
        range.end.toISOString(),
        {
          onData: (items) => setPeriodData({ key: periodKey, items }),
          onError,
        },
      ),
    [courseIds, range, periodKey, attempt, onError],
  );

  const periodReady = periodData?.key === periodKey;
  const periodSessions = periodReady ? periodData.items : NO_SESSIONS;
  const currentSessions = current?.items ?? NO_SESSIONS;
  const labList = labs ?? NO_LABS;
  const classList = classes ?? NO_CLASSES;

  const summary = useMemo(
    () =>
      buildLabDashboard({
        labs: labList,
        classes: classList,
        periodSessions,
        currentSessions,
        range,
        now,
      }),
    [labList, classList, periodSessions, currentSessions, range, now],
  );

  const retry = useCallback(() => {
    setError(null);
    setLabs(null);
    setClasses(null);
    setCurrent(null);
    setPeriodData(null);
    setAttempt((n) => n + 1);
  }, []);

  return {
    hasScope: courseIds.length > 0,
    loading: !error && (labs === null || classes === null || current === null),
    error,
    periodLoading: !error && !periodReady,
    range,
    summary,
    courseIds,
    labs: labList,
    now,
    retry,
  };
}

const NO_SESSIONS: Session[] = [];
const NO_LABS: Lab[] = [];
const NO_CLASSES: PracticalClass[] = [];
