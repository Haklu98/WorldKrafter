import { app, BrowserWindow } from 'electron';
import path from 'path';
import { initDb } from './db';
import { registerProfileHandlers } from './ipc/profile';
import { registerWorldHandlers } from './ipc/worlds';
import { registerCardHandlers } from './ipc/cards';
import { registerTimelineHandlers } from './ipc/timelines';

const isDev = !app.isPackaged;

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0d0d1a',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // required for better-sqlite3 in preload
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../../dist/renderer/index.html'));
  }
}

app.whenReady().then(() => {
  initDb();
  registerProfileHandlers();
  registerWorldHandlers();
  registerCardHandlers();
  registerTimelineHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
