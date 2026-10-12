import { ipcMain } from 'electron';
import { getDb } from '../db';
import type { Profile } from '../db/schema';

export function registerProfileHandlers(): void {
  ipcMain.handle('profile:get', (): Profile | null => {
    return getDb().prepare('SELECT * FROM profile LIMIT 1').get() as Profile | null;
  });

  ipcMain.handle('profile:create', (_e, displayName: string): Profile => {
    const db = getDb();
    db.prepare('INSERT INTO profile (id, display_name) VALUES (1, ?)').run(displayName);
    return db.prepare('SELECT * FROM profile LIMIT 1').get() as Profile;
  });

  ipcMain.handle('profile:update', (_e, displayName: string): Profile => {
    const db = getDb();
    db.prepare('UPDATE profile SET display_name = ? WHERE id = 1').run(displayName);
    return db.prepare('SELECT * FROM profile LIMIT 1').get() as Profile;
  });
}
