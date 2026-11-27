import type {
  DashboardPeriod,
  PeriodRange,
} from '../../domain/labDashboardRules';
import {
  formatDayMonth,
  formatMonthYear,
  formatWeekdayDayMonth,
} from '../../shared/format/date';
import type { SegmentedOption } from '../../shared/ui';

export const PERIOD_OPTIONS: SegmentedOption<DashboardPeriod>[] = [
  { value: 'day', label: 'Hari' },
  { value: 'week', label: 'Minggu' },
  { value: 'month', label: 'Bulan' },
];

const RELATIVE: Record<DashboardPeriod, Record<number, string>> = {
  day: { [-1]: 'Kemarin', 0: 'Hari ini', 1: 'Besok' },
  week: { [-1]: 'Minggu lalu', 0: 'Minggu ini', 1: 'Minggu depan' },
  month: { [-1]: 'Bulan lalu', 0: 'Bulan ini', 1: 'Bulan depan' },
};

/** Judul relatif ("Minggu ini") dan rentang tanggal yang tepat. */
export function periodLabel(
  period: DashboardPeriod,
  offset: number,
  range: PeriodRange,
): { title: string; detail: string } {
  const lastDay = new Date(range.end.getTime() - 1);
  const detail =
    period === 'day'
      ? formatWeekdayDayMonth(range.start)
      : period === 'week'
        ? `${formatDayMonth(range.start)} – ${formatDayMonth(lastDay)}`
        : formatMonthYear(range.start);
  return { title: RELATIVE[period][offset] ?? detail, detail };
}
