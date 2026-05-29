import type { CardType } from './cardTypes';

/**
 * Raw database row for card timestamps (Supabase / Postgres shape).
 * This is NOT UI-ready data.
 */
export type CardTimestampRow = {
  id: string;
  card_id: string;
  timeline_id: string;

  label: string;

  year: number;
  month: number | null;
  day: number | null;

  sort_key: number | null;
};