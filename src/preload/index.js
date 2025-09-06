import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  saveCredentials: (serverUrl, apiKey, apiSecret) =>
    ipcRenderer.send('save-api-credentials', { serverUrl, apiKey, apiSecret }),

  getCredentials: () => ipcRenderer.invoke('get-api-credentials'),

  clearCredentials: () => ipcRenderer.send('clear-api-credentials'),

  fetchAPI: (endpoint, options = {}) => ipcRenderer.invoke('fetch-api', { endpoint, options })
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
