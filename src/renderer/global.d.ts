import type { World, Card } from './types';

declare global {
  interface Window {
    api: {
      getAppInfo: () => Promise<{ name: string; version: string; platform: string }>;
      worlds: {
        getAll: () => Promise<World[]>;
        create: (name: string, description: string, coverColor: string) => Promise<World>;
        update: (id: number, patch: Partial<World>) => Promise<World>;
        delete: (id: number) => Promise<void>;
      };
      cards: {
        getByWorld: (worldId: number) => Promise<Card[]>;
        create: (worldId: number, type: Card['type'], title: string) => Promise<Card>;
        update: (id: number, patch: Partial<Card>) => Promise<Card>;
        delete: (id: number) => Promise<void>;
      };
    };
  }
}
