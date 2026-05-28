import type { CardType } from './cardTypes';

export type TimestampSlot = {
  label: string;       // shown in the form
  hint: string;
  timelineLabel: string; // template for the timeline entry, {name} is replaced with card title
  required?: boolean;
};

export const CARD_TIMESTAMP_SLOTS: Record<CardType, TimestampSlot[]> = {
  'Character': [
    { label: 'Born',     hint: 'Date of birth',  timelineLabel: '{name} was born',  required: true },
    { label: 'Deceased', hint: 'Date of death',   timelineLabel: '{name} died' },
  ],
  'Noble House': [
    { label: 'Founded',   hint: 'When the house was established', timelineLabel: '{name} was founded', required: true },
    { label: 'Dissolved', hint: 'When the house fell or ended',   timelineLabel: '{name} dissolved' },
  ],
  'Tribe': [
    { label: 'Founded',   hint: 'When the tribe formed',                    timelineLabel: '{name} was founded', required: true },
    { label: 'Dissolved', hint: 'When the tribe disbanded or was destroyed', timelineLabel: '{name} disbanded' },
  ],
  'Landmark': [
    { label: 'Built',     hint: 'When the landmark was created', timelineLabel: '{name} was built',     required: true },
    { label: 'Destroyed', hint: 'When it was destroyed or lost', timelineLabel: '{name} was destroyed' },
  ],
  'Religion': [
    { label: 'Founded',   hint: 'When the religion was established', timelineLabel: '{name} was founded', required: true },
    { label: 'Dissolved', hint: 'When it ceased to exist',           timelineLabel: '{name} ceased to exist' },
  ],
  'Region': [
    { label: 'Established', hint: 'When the region was defined or settled', timelineLabel: '{name} was established', required: true },
    { label: 'Dissolved',   hint: 'When the region ceased to exist',        timelineLabel: '{name} ceased to exist' },
  ],
  'Kingdom': [
    { label: 'Formed',    hint: 'When the kingdom was established',      timelineLabel: '{name} was formed',    required: true },
    { label: 'Dissolved', hint: 'When the kingdom fell or was absorbed', timelineLabel: '{name} fell' },
  ],
  'Guild': [
    { label: 'Founded',   hint: 'When the guild was established', timelineLabel: '{name} was founded', required: true },
    { label: 'Dissolved', hint: 'When the guild disbanded',       timelineLabel: '{name} disbanded' },
  ],
  'Order': [
    { label: 'Founded',   hint: 'When the order was established',          timelineLabel: '{name} was founded', required: true },
    { label: 'Dissolved', hint: 'When the order was disbanded or destroyed', timelineLabel: '{name} was disbanded' },
  ],
  'Faction': [
    { label: 'Founded',   hint: 'When the faction formed',    timelineLabel: '{name} was founded', required: true },
    { label: 'Dissolved', hint: 'When the faction disbanded', timelineLabel: '{name} disbanded' },
  ],
  'Cult': [
    { label: 'Founded',   hint: 'When the cult was formed',                  timelineLabel: '{name} was formed', required: true },
    { label: 'Dissolved', hint: 'When the cult was destroyed or disbanded',  timelineLabel: '{name} was destroyed' },
  ],
  'Event': [
    { label: 'Occurred', hint: 'When this event took place', timelineLabel: '{name}', required: true },
  ],
  'Battle': [
    { label: 'Started', hint: 'When the battle began',       timelineLabel: '{name} began',  required: true },
    { label: 'Ended',   hint: 'When the battle concluded',   timelineLabel: '{name} ended' },
  ],
  'Festival': [
    { label: 'First held', hint: 'When the festival was first celebrated', timelineLabel: '{name} — first held', required: true },
    { label: 'Last held',  hint: 'When it was last celebrated (if ended)', timelineLabel: '{name} — last held' },
  ],
  'Location': [
    { label: 'Discovered', hint: 'When the location was first discovered', timelineLabel: '{name} was discovered', required: true },
    { label: 'Abandoned',  hint: 'When it was abandoned or destroyed',     timelineLabel: '{name} was abandoned' },
  ],
  'Dungeon': [
    { label: 'Created',   hint: 'When the dungeon was built or formed',  timelineLabel: '{name} was created',   required: true },
    { label: 'Collapsed', hint: 'When it was destroyed or sealed',       timelineLabel: '{name} collapsed' },
  ],
};
