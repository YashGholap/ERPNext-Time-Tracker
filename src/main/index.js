import { app, shell, BrowserWindow, ipcMain, desktopCapturer, nativeImage, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/Track-Time-logo.ico?asset'

import fs from 'fs'
import path from 'path'


import pkg from 'electron-store'
const Store = pkg.default
const store = new Store()

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 420,
    height: 600,
    show: false,
    autoHideMenuBar: true,
    title:"ERPNext Time Tracker",
    icon: icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // ...(process.platform === 'linux' ? { icon } : {}),
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

// ensure screenshots dir exists
const screenshotsDir = path.join(app.getPath('userData'), 'screenshots')
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true })

// TAKE A NEW SCREENSHOT (capture at full resolution, save, return data URLs)
ipcMain.handle('take-screenshot', async () => {
  try {
    // Determine primary display size and scale factor
    const disp = screen.getPrimaryDisplay()
    const { width: displayW, height: displayH } = disp.size
    const scale = disp.scaleFactor || 1

    // Ask desktopCapturer for a large thumbnail (use display size * scale)
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: Math.round(displayW * scale), height: Math.round(displayH * scale) }
    })

    if (!sources || !sources.length) return null
    const screenSource = sources[0]

    // screenSource.thumbnail is a nativeImage at requested size
    const fullBuffer = screenSource.thumbnail.toPNG() // full-resolution buffer

    // Save file with timestamp (optional persistence)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `screenshot_${timestamp}.png`
    const filePath = path.join(screenshotsDir, filename)
    fs.writeFileSync(filePath, fullBuffer)

    // Create nativeImage from buffer to produce data URLs and resized thumbnail
    const fullNative = nativeImage.createFromBuffer(fullBuffer)

    // Create thumbnail (width ~ 600 px, keep aspect)
    const THUMB_W = 600
    const thumbNative = fullNative.resize({ width: THUMB_W })

    const fullDataUrl = fullNative.toDataURL()
    const thumbDataUrl = thumbNative.toDataURL()

    // Return object for immediate addition to UI (you can also return filePath if needed)
    return {
      thumbnail: thumbDataUrl,
      fullData: fullDataUrl,
      fileSaved: filePath
    }
  } catch (err) {
    console.error('take-screenshot error', err)
    return null
  }
})

// GET latest screenshots from folder as data URLs (thumbnail + full) - latest 3
ipcMain.handle('get-screenshots', async () => {
  try {
    if (!fs.existsSync(screenshotsDir)) return []

    const files = fs.readdirSync(screenshotsDir)
      .filter(f => f.endsWith('.png'))
      .map(f => ({
        name: f,
        mtime: fs.statSync(path.join(screenshotsDir, f)).mtimeMs
      }))
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 3) // latest 3

    const results = files.map(({ name }) => {
      const fullPath = path.join(screenshotsDir, name)
      const buffer = fs.readFileSync(fullPath)
      const native = nativeImage.createFromBuffer(buffer)

      // Produce a medium-sized thumbnail for the grid (width 600 -> adjust as you like)
      const thumbNative = native.resize({ width: 600 })

      return {
        thumbnail: thumbNative.toDataURL(),
        fullData: native.toDataURL(),
        fileSaved: fullPath,
        name
      }
    })

    return results
  } catch (err) {
    console.error('get-screenshots error', err)
    return []
  }
})

// Optional: clear screenshots folder
ipcMain.handle('clear-screenshots', async () => {
  try {
    if (!fs.existsSync(screenshotsDir)) return true
    const files = fs.readdirSync(screenshotsDir)
    for (const f of files) {
      try { fs.unlinkSync(path.join(screenshotsDir, f)) } catch (_) {}
    }
    return true
  } catch (err) {
    console.error('clear-screenshots error', err)
    return false
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
