import { contextBridge, ipcRenderer } from 'electron';
import type { Profile, World, Card, CardRelation, Timeline, TimelineEntry, CardType } from '../main/db/schema';

// Typed API exposed to the renderer
const api = {
  // Profile
  profile: {
    get: (): Promise<Profile | null> => ipcRenderer.invoke('profile:get'),
    create: (displayName: string): Promise<Profile> => ipcRenderer.invoke('profile:create', displayName),
    update: (displayName: string): Promise<Profile> => ipcRenderer.invoke('profile:update', displayName),
  },

  // Worlds
  worlds: {
    list: (): Promise<World[]> => ipcRenderer.invoke('worlds:list'),
    get: (id: number): Promise<World | null> => ipcRenderer.invoke('worlds:get', id),
    create: (data: { name: string; description?: string; cover_color?: string }): Promise<World> =>
      ipcRenderer.invoke('worlds:create', data),
    update: (id: number, data: Partial<Pick<World, 'name' | 'description' | 'cover_color'>>): Promise<World> =>
      ipcRenderer.invoke('worlds:update', id, data),
    delete: (id: number): Promise<void> => ipcRenderer.invoke('worlds:delete', id),
  },

  // Cards
  cards: {
    list: (worldId: number): Promise<Card[]> => ipcRenderer.invoke('cards:list', worldId),
    get: (id: number): Promise<Card | null> => ipcRenderer.invoke('cards:get', id),
    create: (data: { world_id: number; title: string; type: CardType; content?: string; tags?: string[]; cover_color?: string }): Promise<Card> =>
      ipcRenderer.invoke('cards:create', data),
    update: (id: number, data: Partial<Pick<Card, 'title' | 'type' | 'content' | 'tags' | 'cover_color'>>): Promise<Card> =>
      ipcRenderer.invoke('cards:update', id, data),
    delete: (id: number): Promise<void> => ipcRenderer.invoke('cards:delete', id),
    relations: (cardId: number): Promise<CardRelation[]> => ipcRenderer.invoke('cards:relations', cardId),
    relate: (fromId: number, toId: number, label?: string): Promise<CardRelation> =>
      ipcRenderer.invoke('cards:relate', fromId, toId, label),
    unrelate: (relationId: number): Promise<void> => ipcRenderer.invoke('cards:unrelate', relationId),
  },

  // Timelines
  timelines: {
    list: (worldId: number): Promise<Timeline[]> => ipcRenderer.invoke('timelines:list', worldId),
    create: (data: { world_id: number; name: string; description?: string }): Promise<Timeline> =>
      ipcRenderer.invoke('timelines:create', data),
    delete: (id: number): Promise<void> => ipcRenderer.invoke('timelines:delete', id),
    entries: (timelineId: number): Promise<TimelineEntry[]> => ipcRenderer.invoke('timeline:entries', timelineId),
    addEntry: (data: { timeline_id: number; card_id: number; world_date: object; label?: string; sort_key: number }): Promise<TimelineEntry> =>
      ipcRenderer.invoke('timeline:addEntry', data),
    removeEntry: (entryId: number): Promise<void> => ipcRenderer.invoke('timeline:removeEntry', entryId),
  },
};

contextBridge.exposeInMainWorld('api', api);

export type API = typeof api;
