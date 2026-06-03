const { app, BrowserWindow, ipcMain, shell } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const { isSupportedPrintLink, parseMakerWorldMetadata } = require('./shared/metadataParser');

const DATA_FILE = 'spooler-data.json';

const defaultState = {
  printers: [
    {
      id: 'printer-bambu-a1',
      name: 'Bambu Lab A1',
      model: 'A1',
      address: '192.168.178.50',
      bedSize: '256 x 256 x 256 mm',
      notes: 'Beispieldrucker – im Drucker-Dialog anpassen.'
    }
  ],
  jobs: []
};

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 720,
    title: 'FilamentDB 3D Printer Spooler',
    backgroundColor: '#0f172a',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

async function getDataPath() {
  await app.whenReady();
  return path.join(app.getPath('userData'), DATA_FILE);
}

async function readState() {
  const dataPath = await getDataPath();

  try {
    const raw = await fs.readFile(dataPath, 'utf8');
    const parsed = JSON.parse(raw);

    return {
      printers: Array.isArray(parsed.printers) ? parsed.printers : defaultState.printers,
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : defaultState.jobs
    };
  } catch {
    return defaultState;
  }
}

async function writeState(nextState) {
  const dataPath = await getDataPath();
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  await fs.writeFile(dataPath, JSON.stringify(nextState, null, 2), 'utf8');
  return nextState;
}

async function fetchPrintLinkMetadata(url) {
  if (!isSupportedPrintLink(url)) {
    throw new Error('Aktuell werden nur Links von makerworld.com unterstützt.');
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'FilamentDB-Spooler/0.1 (+https://makerworld.com)'
    }
  });

  if (!response.ok) {
    throw new Error(`MakerWorld konnte nicht geladen werden: HTTP ${response.status}`);
  }

  const html = await response.text();
  return parseMakerWorldMetadata(html, url);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('state:load', readState);
ipcMain.handle('state:save', (_, nextState) => writeState(nextState));
ipcMain.handle('makerworld:fetch', (_, url) => fetchPrintLinkMetadata(url));
ipcMain.handle('link:openExternal', (_, url) => shell.openExternal(url));
