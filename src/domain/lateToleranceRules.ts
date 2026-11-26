import type { PunctualityStatus, Session } from './types';

/** Durasi toleransi keterlambatan standar (menit) jika tidak ditentukan spesifik pada sesi/lab. */
export const DEFAULT_TOLERANCE_MINUTES = 15;

export type PunctualityEvaluation = {
  isLate: boolean;
  status: PunctualityStatus;
  deadlineIso: string;
  minutesLate: number;
};

/**
 * Menghitung batas akhir toleransi presensi tepat waktu (SRS-4.10).
 * Batas toleransi = startsAt terjadwal + durasi toleransi (menit).
 * Jam buka sesi (openedAt) TIDAK mempengaruhi batas waktu toleransi.
 */
export function calculateToleranceDeadline(
  startsAtIso: string,
  toleranceMinutes: number = DEFAULT_TOLERANCE_MINUTES,
): string {
  const startTime = new Date(startsAtIso).getTime();
  const toleranceMs = Math.max(0, toleranceMinutes) * 60 * 1000;
  return new Date(startTime + toleranceMs).toISOString();
}

/**
 * Menilai ketepatan waktu presensi praktikan terhadap batas toleransi sesi (SRS-4.10).
 * - Presensi sebelum atau tepat di batas: 'ontime' (tepat waktu).
 * - Presensi setelah batas: 'late' (terlambat).
 * - Menghitung jumlah menit keterlambatan (dibulatkan ke atas bila melewati batas).
 */
export function evaluateAttendancePunctuality(
  session: Pick<Session, 'startsAt' | 'toleranceMinutes'>,
  checkedInAtIso: string,
  overrideToleranceMinutes?: number,
): PunctualityEvaluation {
  const toleranceMinutes =
    overrideToleranceMinutes ??
    session.toleranceMinutes ??
    DEFAULT_TOLERANCE_MINUTES;

  const deadlineIso = calculateToleranceDeadline(
    session.startsAt,
    toleranceMinutes,
  );
  const deadlineTime = new Date(deadlineIso).getTime();
  const checkInTime = new Date(checkedInAtIso).getTime();

  if (checkInTime <= deadlineTime) {
    return {
      isLate: false,
      status: 'ontime',
      deadlineIso,
      minutesLate: 0,
    };
  }

  const diffMs = checkInTime - deadlineTime;
  const minutesLate = Math.max(1, Math.ceil(diffMs / (60 * 1000)));

  return {
    isLate: true,
    status: 'late',
    deadlineIso,
    minutesLate,
  };
}
