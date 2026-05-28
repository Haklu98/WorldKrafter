export type TrackingType = 'before_after' | 'era' | 'age';

export type TimeFormat = {
  id: string;
  name: string;
  is_gregorian: boolean;
  hours_per_day: number;
  days_per_week: number;
  weeks_per_year: number;
  months_per_year: number;
  lunar_cycle_days: number | null;
  day_names: string[] | null;
  month_names: string[] | null;
};

export type Timeline = {
  id: string;
  name: string;
  time_format_id: string | null;
  tracking_type: TrackingType;
  pivot_card_id: string | null;
  before_label: string;
  after_label: string;
};

export type TimelinePeriod = {
  id: string;
  position: number;
  name: string | null;
  years: number;
  months: number;
  days: number;
};

// Used only inside the wizard form state (string inputs before parsing)
export type PeriodDraft = {
  name: string;
  years: string;
  months: string;
  days: string;
};

// A dated entry on the visual timeline
export type CardTimestamp = {
  id: string;
  card_id: string;
  timeline_id: string;
  label: string;
  year: number;
  month: number | null;
  day: number | null;
  sort_key: number;
  // joined from cards table
  card_title: string;
  card_type: string;
};

export type TimelineOrientation = 'vertical' | 'horizontal';
