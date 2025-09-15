import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import fs from 'fs'
import path from 'path'
import { desktopCapturer } from 'electron'


import pkg from 'electron-store'
const Store = pkg.default
const store = new Store()

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}


// Save API credentials
ipcMain.on('save-api-credentials', (_, { serverUrl, apiKey, apiSecret }) => {
  store.set('apiCreds', { serverUrl, apiKey, apiSecret })
})

// Get API credentials
ipcMain.handle('get-api-credentials', () => {
  return store.get('apiCreds') || null
})

// Clear credentials
ipcMain.on('clear-api-credentials', () => {
  store.delete('apiCreds')
})

// Helper to make authenticated requests
ipcMain.handle('fetch-api', async (_, { endpoint, options = {} }) => {
  const creds = store.get('apiCreds')
  if (!creds) throw new Error('API credentials not set')

  options.headers = options.headers || {}
  options.headers['Authorization'] = `token ${creds.apiKey}:${creds.apiSecret}` // use Bearer

  const axios = await import('axios').then(m => m.default)

  // Ensure serverUrl includes protocol
  const baseUrl = creds.serverUrl.startsWith('http')
    ? creds.serverUrl
    : `http://${creds.serverUrl}`
    
       // Safety check 
    if (typeof endpoint !== 'string') {
      console.error('[fetch-api] Invalid endpoint:', endpoint)
      throw new Error('Endpoint must be a string')
    }
  const url = `${baseUrl}${endpoint}`

    console.log('[fetch-api] URL being called:', url)
    // console.log('[fetch-api] Headers:', options.headers)



  try {
    const res = await axios({ url, ...options })
    return res.data
  } catch (err) {
    throw err.response?.data || err.message
  }
})

ipcMain.handle('take-screenshot', async () => {
  try {
    const sources = await desktopCapturer.getSources({ types: ['screen'] });
    const screenSource = sources[0];
    const imageBuffer = screenSource.thumbnail.toPNG();

    // Save file (optional, can be used to send to ERPNext)
    const screenshotsDir = path.join(app.getPath('userData'), 'screenshots');
    if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(screenshotsDir, `screenshot_${timestamp}.png`);
    fs.writeFileSync(filePath, imageBuffer);

    // Return as base64 for renderer
    return `data:image/png;base64,${imageBuffer.toString('base64')}`;
  } catch (err) {
    console.error('Screenshot error:', err);
    return null;
  }
});

ipcMain.handle('get-screenshots', async () => {
  const screenshotsDir = path.join(app.getPath('userData'), 'screenshots');
  if (!fs.existsSync(screenshotsDir)) return [];

  const files = fs.readdirSync(screenshotsDir)
    .filter(f => f.endsWith('.png'))
    .sort((a, b) => fs.statSync(path.join(screenshotsDir, b)).mtimeMs - fs.statSync(path.join(screenshotsDir, a)).mtimeMs)
    .slice(0, 3); // latest 3

  // Return both thumbnail (small) and full image
  return files.map(f => {
    const fullPath = path.join(screenshotsDir, f);
    const fullData = fs.readFileSync(fullPath, { encoding: 'base64' });
    return {
      thumbnail: `data:image/png;base64,${fullData}`, // we can later resize for thumbnail if needed
      filePath: `data:image/png;base64,${fullData}`, // full image for modal
    };
  });
});

ipcMain.handle('clear-screenshots', () => {
  const screenshotsDir = path.join(app.getPath('userData'), 'screenshots')
  if (fs.existsSync(screenshotsDir)) {
    fs.readdirSync(screenshotsDir).forEach(f => {
      fs.unlinkSync(path.join(screenshotsDir, f))
    })
  }
})



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
