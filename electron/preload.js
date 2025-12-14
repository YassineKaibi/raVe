const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Desktop audio capture
  startDesktopAudio: () => ipcRenderer.invoke('start-desktop-audio'),
  stopDesktopAudio: () => ipcRenderer.invoke('stop-desktop-audio'),
  onAudioData: (callback) => {
    ipcRenderer.on('audio-data', (event, data) => callback(data))
  },
  removeAudioDataListener: () => {
    ipcRenderer.removeAllListeners('audio-data')
  },

  // Window controls
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  onFullscreenChanged: (callback) => {
    ipcRenderer.on('fullscreen-changed', (event, isFullscreen) => callback(isFullscreen))
  },

  // HDR support detection
  getHDRSupport: () => ipcRenderer.invoke('get-hdr-support'),

  // Check if running in Electron
  isElectron: true,

  // Platform info
  platform: process.platform
})
