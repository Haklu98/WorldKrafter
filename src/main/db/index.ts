import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

export function initDb(): void {
  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'data');
  const dbPath = path.join(dbDir, 'worldkrafter.db');

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  migrate(db);
}

function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id           INTEGER PRIMARY KEY,
      display_name TEXT    NOT NULL,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS worlds (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL,
      description  TEXT,
      cover_color  TEXT    NOT NULL DEFAULT '#6366f1',
      created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS calendars (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      world_id  INTEGER NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
      name      TEXT    NOT NULL,
      config    TEXT    NOT NULL DEFAULT '{}',
      created_at TEXT   NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cards (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      world_id     INTEGER NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
      title        TEXT    NOT NULL,
      type         TEXT    NOT NULL DEFAULT 'note',
      content      TEXT,
      tags         TEXT,
      cover_color  TEXT,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS card_relations (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      from_card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      to_card_id   INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      label        TEXT
    );

    CREATE TABLE IF NOT EXISTS timelines (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      world_id    INTEGER NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
      name        TEXT    NOT NULL,
      description TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS timeline_entries (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      timeline_id INTEGER NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
      card_id     INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      world_date  TEXT    NOT NULL DEFAULT '{}',
      label       TEXT,
      sort_key    REAL    NOT NULL DEFAULT 0
    );
  `);
}
