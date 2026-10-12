import { ipcMain } from 'electron';
import { getDb } from '../db';
import type { World } from '../db/schema';

export function registerWorldHandlers(): void {
  ipcMain.handle('worlds:list', (): World[] => {
    return getDb().prepare('SELECT * FROM worlds ORDER BY updated_at DESC').all() as World[];
  });

  ipcMain.handle('worlds:get', (_e, id: number): World | null => {
    return getDb().prepare('SELECT * FROM worlds WHERE id = ?').get(id) as World | null;
  });

  ipcMain.handle('worlds:create', (_e, data: { name: string; description?: string; cover_color?: string }): World => {
    const db = getDb();
    const result = db.prepare(
      'INSERT INTO worlds (name, description, cover_color) VALUES (?, ?, ?) RETURNING *'
    ).get(data.name, data.description ?? null, data.cover_color ?? '#6366f1') as World;
    return result;
  });

  ipcMain.handle('worlds:update', (_e, id: number, data: Partial<Pick<World, 'name' | 'description' | 'cover_color'>>): World => {
    const db = getDb();
    db.prepare(
      `UPDATE worlds SET
        name        = COALESCE(?, name),
        description = COALESCE(?, description),
        cover_color = COALESCE(?, cover_color),
        updated_at  = datetime('now')
      WHERE id = ?`
    ).run(data.name ?? null, data.description ?? null, data.cover_color ?? null, id);
    return db.prepare('SELECT * FROM worlds WHERE id = ?').get(id) as World;
  });

  ipcMain.handle('worlds:delete', (_e, id: number): void => {
    getDb().prepare('DELETE FROM worlds WHERE id = ?').run(id);
  });
}
