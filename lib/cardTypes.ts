export const CARD_TYPES = [
  'Character',
  'Noble House',
  'Tribe',
  'Landmark',
  'Religion',
  'Region',
  'Kingdom',
  'Guild',
  'Order',
  'Faction',
  'Cult',
  'Event',
  'Battle',
  'Festival',
  'Location',
  'Dungeon',
] as const;

export type CardType = (typeof CARD_TYPES)[number];

// Visual accent color per type category
export const CARD_TYPE_COLOR: Record<CardType, string> = {
  'Character':   '#818cf8',
  'Noble House': '#c084fc',
  'Tribe':       '#fb923c',
  'Landmark':    '#34d399',
  'Religion':    '#fbbf24',
  'Region':      '#38bdf8',
  'Kingdom':     '#f472b6',
  'Guild':       '#a3e635',
  'Order':       '#e879f9',
  'Faction':     '#f87171',
  'Cult':        '#94a3b8',
  'Event':       '#fdba74',
  'Battle':      '#ef4444',
  'Festival':    '#facc15',
  'Location':    '#4ade80',
  'Dungeon':     '#a78bfa',
};
