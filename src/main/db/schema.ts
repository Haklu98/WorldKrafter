// Database schema definitions
// These mirror the SQL schema and serve as the TypeScript source of truth.

export interface Profile {
  id: number;
  display_name: string;
  created_at: string;
}

export interface World {
  id: number;
  name: string;
  description: string | null;
  cover_color: string; // hex color for world card accent
  created_at: string;
  updated_at: string;
}

export interface Calendar {
  id: number;
  world_id: number;
  name: string;
  // JSON: { eras: Era[], months: Month[], days_per_week: number, day_names: string[] }
  config: string;
  created_at: string;
}

export interface Card {
  id: number;
  world_id: number;
  title: string;
  type: CardType;
  content: string | null; // rich text as markdown
  tags: string | null;    // JSON array of strings
  cover_color: string | null;
  created_at: string;
  updated_at: string;
}

export type CardType =
  | 'character'
  | 'event'
  | 'kingdom'
  | 'location'
  | 'lore'
  | 'cult'
  | 'magic'
  | 'artifact'
  | 'creature'
  | 'note';

export interface CardRelation {
  id: number;
  from_card_id: number;
  to_card_id: number;
  label: string | null; // e.g. "founded", "enemy of", "discovered"
}

export interface Timeline {
  id: number;
  world_id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface TimelineEntry {
  id: number;
  timeline_id: number;
  card_id: number;
  // World-calendar date stored as JSON: { era?: string, year: number, month?: number, day?: number }
  world_date: string;
  label: string | null;
  sort_key: number; // numeric for ordering on timeline
}
