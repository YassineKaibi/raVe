const { app, BrowserWindow, ipcMain, screen } = require('electron')
const path = require('path')
const url = require('url')

// Handle Squirrel events on Windows
if (require('electron-squirrel-startup')) app.quit()

let mainWindow = null
let audioCapture = null

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  mainWindow = new BrowserWindow({
    width: Math.floor(width * 0.8),
    height: Math.floor(height * 0.8),
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      // Enable desktop capture for audio
      webSecurity: true
    },
    show: false,
    frame: true,
    icon: path.join(__dirname, '../public/favicon.ico')
  })

  // Allow desktop capture
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media', 'display-capture', 'audioCapture', 'desktopCapture']
    if (allowedPermissions.includes(permission)) {
      callback(true) // Auto-approve
    } else {
      callback(false)
    }
  })

  // Load the app
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

  if (isDev) {
    // Development mode - load from Vue dev server
    mainWindow.loadURL('http://localhost:8081')
    mainWindow.webContents.openDevTools()
  } else {
    // Production mode - load from built files
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, '../dist/index.html'),
        protocol: 'file:',
        slashes: true
      })
    )
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  // Cleanup on window close
  mainWindow.on('closed', () => {
    if (audioCapture) {
      audioCapture.stop()
      audioCapture = null
    }
    mainWindow = null
  })

  // Handle fullscreen
  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send('fullscreen-changed', true)
  })

  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('fullscreen-changed', false)
  })
}

// App lifecycle
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers for desktop audio capture
ipcMain.handle('start-desktop-audio', async (event) => {
  try {
    if (!audioCapture) {
      audioCapture = require('./audio-capture')
    }

    audioCapture.start((audioData) => {
      if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
        try {
          mainWindow.webContents.send('audio-data', audioData)
        } catch (err) {
          // Ignore errors during page transitions
          if (!err.message.includes('disposed')) {
            console.error('Error sending audio data:', err)
          }
        }
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to start desktop audio capture:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('stop-desktop-audio', async (event) => {
  try {
    if (audioCapture) {
      audioCapture.stop()
    }
    return { success: true }
  } catch (error) {
    console.error('Failed to stop desktop audio capture:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('toggle-fullscreen', async (event) => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen())
    return { fullscreen: mainWindow.isFullScreen() }
  }
  return { fullscreen: false }
})

ipcMain.handle('get-hdr-support', async (event) => {
  if (mainWindow) {
    const display = screen.getDisplayNearestPoint(
      mainWindow.getBounds()
    )

    // Check if display supports HDR (Windows 10/11)
    // Note: This is a simplified check. Full HDR detection may require additional APIs
    const hdrSupported = display.colorDepth >= 30 // 10-bit or higher typically indicates HDR capability

    return {
      supported: hdrSupported,
      colorDepth: display.colorDepth,
      colorSpace: display.colorSpace || 'unknown'
    }
  }
  return { supported: false }
})

// Handle app-level events
app.on('before-quit', () => {
  if (audioCapture) {
    audioCapture.stop()
  }
})
