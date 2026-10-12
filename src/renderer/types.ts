export interface World {
  id: number;
  name: string;
  description: string | null;
  cover_color: string;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: number;
  world_id: number;
  type: 'character' | 'event' | 'kingdom' | 'lore' | 'cult' | 'magic' | 'location' | 'custom';
  title: string;
  content: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
}
