import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { World } from '../../../main/db/schema';
import styles from './Dashboard.module.css';

const ACCENT_COLORS = [
  '#6366f1', '#a78bfa', '#f59e0b', '#10b981',
  '#3b82f6', '#ec4899', '#ef4444', '#f97316',
];

type Props = {
  displayName: string;
};

export default function DashboardPage({ displayName }: Props) {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(ACCENT_COLORS[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.worlds.list().then(w => { setWorlds(w); setLoading(false); });
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const world = await api.worlds.create({ name: newName.trim(), cover_color: newColor });
    setWorlds(prev => [world, ...prev]);
    setNewName('');
    setCreating(false);
  }

  async function handleDelete(id: number) {
    await api.worlds.delete(id);
    setWorlds(prev => prev.filter(w => w.id !== id));
  }

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <span className={styles.logoMark}>W</span>
          <span className={styles.logoText}>WorldKrafter</span>
        </div>
        <nav className={styles.nav}>
          <span className={`${styles.navItem} ${styles.navItemActive}`}>Worlds</span>
        </nav>
        <div className={styles.sidebarFooter}>
          <div className={styles.avatar}>{displayName[0]?.toUpperCase()}</div>
          <span className={styles.displayName}>{displayName}</span>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.heading}>Your Worlds</h1>
            <p className={styles.subheading}>Each world is its own universe — cards, timelines, and lore.</p>
          </div>
          <button className={styles.createBtn} onClick={() => setCreating(true)}>
            + New World
          </button>
        </header>

        {/* New world form */}
        {creating && (
          <form className={styles.createForm} onSubmit={handleCreate}>
            <input
              className={styles.input}
              type="text"
              placeholder="World name…"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              autoFocus
              maxLength={60}
            />
            <div className={styles.colorPicker}>
              {ACCENT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`${styles.colorSwatch} ${newColor === c ? styles.colorSwatchActive : ''}`}
                  style={{ background: c }}
                  onClick={() => setNewColor(c)}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
            <div className={styles.createFormActions}>
              <button type="submit" className={styles.createBtn}>Create</button>
              <button type="button" className={styles.cancelBtn} onClick={() => setCreating(false)}>Cancel</button>
            </div>
          </form>
        )}

        {/* Worlds grid */}
        {loading ? (
          <p className={styles.empty}>Loading…</p>
        ) : worlds.length === 0 && !creating ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyIcon}>🌍</p>
            <p className={styles.emptyTitle}>No worlds yet</p>
            <p className={styles.emptyText}>Create your first world to get started.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {worlds.map(world => (
              <div key={world.id} className={styles.worldCard} style={{ '--accent-color': world.cover_color } as React.CSSProperties}>
                <div className={styles.worldCardAccent} />
                <div className={styles.worldCardBody}>
                  <h2 className={styles.worldName}>{world.name}</h2>
                  {world.description && <p className={styles.worldDesc}>{world.description}</p>}
                  <p className={styles.worldMeta}>
                    Created {new Date(world.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className={styles.worldCardFooter}>
                  <button className={styles.openBtn}>Open</button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(world.id)}
                    aria-label="Delete world"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
