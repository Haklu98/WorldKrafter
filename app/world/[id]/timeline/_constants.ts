import type { TrackingType } from './_types';

export const GREGORIAN_PRESET = {
  name: 'Gregorian Calendar',
  is_gregorian: true,
  hours_per_day: 24,
  days_per_week: 7,
  weeks_per_year: 52,
  months_per_year: 12,
  lunar_cycle_days: 29.53,
  day_names: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  month_names: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
} as const;

export const TRACKING_TYPE_LABELS: Record<TrackingType, string> = {
  before_after: 'Before & After',
  era: 'Era based',
  age: 'Age based',
};
