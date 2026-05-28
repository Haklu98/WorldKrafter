import type { CardType } from './cardTypes';

// Each entry defines the named timestamp slots for a card type.
// 'single' = one timestamp, 'range' = start + end pair.
export type TimestampSlot = {
  label: string;
  hint: string;
  required?: boolean;
};

export const CARD_TIMESTAMP_SLOTS: Record<CardType, TimestampSlot[]> = {
  'Character':   [
    { label: 'Born',     hint: 'Date of birth',  required: true },
    { label: 'Deceased', hint: 'Date of death' },
  ],
  'Noble House': [
    { label: 'Founded',   hint: 'When the house was established', required: true },
    { label: 'Dissolved', hint: 'When the house fell or ended' },
  ],
  'Tribe': [
    { label: 'Founded',   hint: 'When the tribe formed', required: true },
    { label: 'Dissolved', hint: 'When the tribe disbanded or was destroyed' },
  ],
  'Landmark': [
    { label: 'Built',     hint: 'When the landmark was created', required: true },
    { label: 'Destroyed', hint: 'When it was destroyed or lost' },
  ],
  'Religion': [
    { label: 'Founded',   hint: 'When the religion was established', required: true },
    { label: 'Dissolved', hint: 'When it ceased to exist' },
  ],
  'Region': [
    { label: 'Established', hint: 'When the region was defined or settled', required: true },
    { label: 'Dissolved',   hint: 'When the region ceased to exist' },
  ],
  'Kingdom': [
    { label: 'Formed',    hint: 'When the kingdom was established', required: true },
    { label: 'Dissolved', hint: 'When the kingdom fell or was absorbed' },
  ],
  'Guild': [
    { label: 'Founded',   hint: 'When the guild was established', required: true },
    { label: 'Dissolved', hint: 'When the guild disbanded' },
  ],
  'Order': [
    { label: 'Founded',   hint: 'When the order was established', required: true },
    { label: 'Dissolved', hint: 'When the order was disbanded or destroyed' },
  ],
  'Faction': [
    { label: 'Founded',   hint: 'When the faction formed', required: true },
    { label: 'Dissolved', hint: 'When the faction disbanded' },
  ],
  'Cult': [
    { label: 'Founded',   hint: 'When the cult was formed', required: true },
    { label: 'Dissolved', hint: 'When the cult was destroyed or disbanded' },
  ],
  'Event': [
    { label: 'Occurred',  hint: 'When this event took place', required: true },
  ],
  'Battle': [
    { label: 'Started', hint: 'When the battle began', required: true },
    { label: 'Ended',   hint: 'When the battle concluded' },
  ],
  'Festival': [
    { label: 'First held', hint: 'When the festival was first celebrated', required: true },
    { label: 'Last held',  hint: 'When it was last celebrated (if ended)' },
  ],
  'Location': [
    { label: 'Discovered', hint: 'When the location was first discovered', required: true },
    { label: 'Abandoned',  hint: 'When it was abandoned or destroyed' },
  ],
  'Dungeon': [
    { label: 'Created',   hint: 'When the dungeon was built or formed', required: true },
    { label: 'Collapsed', hint: 'When it was destroyed or sealed' },
  ],
};
