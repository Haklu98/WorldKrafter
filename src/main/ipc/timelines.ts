import { ipcMain } from 'electron';
import { getDb } from '../db';
import type { Timeline, TimelineEntry } from '../db/schema';

export function registerTimelineHandlers(): void {
  ipcMain.handle('timelines:list', (_e, worldId: number): Timeline[] => {
    return getDb().prepare('SELECT * FROM timelines WHERE world_id = ? ORDER BY created_at ASC').all(worldId) as Timeline[];
  });

  ipcMain.handle('timelines:create', (_e, data: { world_id: number; name: string; description?: string }): Timeline => {
    const db = getDb();
    return db.prepare(
      'INSERT INTO timelines (world_id, name, description) VALUES (?, ?, ?) RETURNING *'
    ).get(data.world_id, data.name, data.description ?? null) as Timeline;
  });

  ipcMain.handle('timelines:delete', (_e, id: number): void => {
    getDb().prepare('DELETE FROM timelines WHERE id = ?').run(id);
  });

  // Entries
  ipcMain.handle('timeline:entries', (_e, timelineId: number): TimelineEntry[] => {
    return getDb().prepare(
      'SELECT * FROM timeline_entries WHERE timeline_id = ? ORDER BY sort_key ASC'
    ).all(timelineId) as TimelineEntry[];
  });

  ipcMain.handle('timeline:addEntry', (_e, data: {
    timeline_id: number;
    card_id: number;
    world_date: object;
    label?: string;
    sort_key: number;
  }): TimelineEntry => {
    const db = getDb();
    return db.prepare(
      `INSERT INTO timeline_entries (timeline_id, card_id, world_date, label, sort_key)
       VALUES (?, ?, ?, ?, ?) RETURNING *`
    ).get(
      data.timeline_id,
      data.card_id,
      JSON.stringify(data.world_date),
      data.label ?? null,
      data.sort_key
    ) as TimelineEntry;
  });

  ipcMain.handle('timeline:removeEntry', (_e, entryId: number): void => {
    getDb().prepare('DELETE FROM timeline_entries WHERE id = ?').run(entryId);
  });
}
