import { ipcMain } from 'electron';
import { getDb } from '../db';
import type { Card, CardRelation } from '../db/schema';

export function registerCardHandlers(): void {
  ipcMain.handle('cards:list', (_e, worldId: number): Card[] => {
    return getDb().prepare('SELECT * FROM cards WHERE world_id = ? ORDER BY updated_at DESC').all(worldId) as Card[];
  });

  ipcMain.handle('cards:get', (_e, id: number): Card | null => {
    return getDb().prepare('SELECT * FROM cards WHERE id = ?').get(id) as Card | null;
  });

  ipcMain.handle('cards:create', (_e, data: {
    world_id: number;
    title: string;
    type: Card['type'];
    content?: string;
    tags?: string[];
    cover_color?: string;
  }): Card => {
    const db = getDb();
    return db.prepare(
      `INSERT INTO cards (world_id, title, type, content, tags, cover_color)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING *`
    ).get(
      data.world_id,
      data.title,
      data.type,
      data.content ?? null,
      data.tags ? JSON.stringify(data.tags) : null,
      data.cover_color ?? null
    ) as Card;
  });

  ipcMain.handle('cards:update', (_e, id: number, data: Partial<Pick<Card, 'title' | 'type' | 'content' | 'tags' | 'cover_color'>>): Card => {
    const db = getDb();
    db.prepare(
      `UPDATE cards SET
        title       = COALESCE(?, title),
        type        = COALESCE(?, type),
        content     = COALESCE(?, content),
        tags        = COALESCE(?, tags),
        cover_color = COALESCE(?, cover_color),
        updated_at  = datetime('now')
      WHERE id = ?`
    ).run(
      data.title ?? null,
      data.type ?? null,
      data.content ?? null,
      data.tags ? JSON.stringify(data.tags) : null,
      data.cover_color ?? null,
      id
    );
    return db.prepare('SELECT * FROM cards WHERE id = ?').get(id) as Card;
  });

  ipcMain.handle('cards:delete', (_e, id: number): void => {
    getDb().prepare('DELETE FROM cards WHERE id = ?').run(id);
  });

  // Relations
  ipcMain.handle('cards:relations', (_e, cardId: number): CardRelation[] => {
    return getDb().prepare(
      'SELECT * FROM card_relations WHERE from_card_id = ? OR to_card_id = ?'
    ).all(cardId, cardId) as CardRelation[];
  });

  ipcMain.handle('cards:relate', (_e, fromId: number, toId: number, label?: string): CardRelation => {
    const db = getDb();
    return db.prepare(
      'INSERT INTO card_relations (from_card_id, to_card_id, label) VALUES (?, ?, ?) RETURNING *'
    ).get(fromId, toId, label ?? null) as CardRelation;
  });

  ipcMain.handle('cards:unrelate', (_e, relationId: number): void => {
    getDb().prepare('DELETE FROM card_relations WHERE id = ?').run(relationId);
  });
}
