import { app, BrowserWindow, ipcMain, desktopCapturer, screen } from 'electron'
import * as path from 'path'
import { setupIPCHandlers } from './ipc-handlers'
import { stateManager } from './state-manager'

const isDev = process.env.NODE_ENV === 'development'

class GameCoachApp {
  private mainWindow: BrowserWindow | null = null
  private overlayWindow: BrowserWindow | null = null

  constructor() {
    this.setupApp()
  }

  private setupApp() {
    app.whenReady().then(() => {
      this.createMainWindow()
      this.setupIPC()
    })

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow()
      }
    })
  }

  private createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload/preload.js'),
      },
      icon: path.join(__dirname, '../../assets/icons/icon.png'),
      title: 'Ravenswatch Game Coach',
    })

    // Register window with state manager
    stateManager.setMainWindow(this.mainWindow)

    // Load the React app
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:5173')
      this.mainWindow.webContents.openDevTools()
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
    }
  }

  public createOverlayWindow() {
    console.log('Main: createOverlayWindow() called')
    
    if (this.overlayWindow) {
      console.log('Main: Overlay window already exists, focusing...')
      this.overlayWindow.focus()
      return
    }    console.log('Main: Creating new overlay window...')
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.workAreaSize
    console.log('Main: Primary display size:', width, 'x', height)

    // Calculate position to ensure visibility
    const overlayWidth = 300
    const overlayHeight = 150
    const overlayX = Math.max(0, width - overlayWidth - 20)  // Ensure not off-screen
    const overlayY = 20

    console.log('Main: Overlay position:', { x: overlayX, y: overlayY, width: overlayWidth, height: overlayHeight })

    this.overlayWindow = new BrowserWindow({
      width: overlayWidth,
      height: overlayHeight,
      x: overlayX,
      y: overlayY,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      focusable: false,  // Don't steal focus
      show: false,       // Don't show immediately
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload/preload.js'),
      },
    })

    console.log('Main: Overlay window created, loading content...')    // Load overlay content
    if (isDev) {
      const overlayURL = 'http://localhost:5173#overlay'
      console.log('Main: Loading overlay URL (dev):', overlayURL)
      this.overlayWindow.loadURL(overlayURL)
    } else {
      const overlayFile = path.join(__dirname, '../renderer/index.html')
      console.log('Main: Loading overlay file (prod):', overlayFile)
      this.overlayWindow.loadFile(overlayFile, {
        hash: 'overlay'
      })
    }

    this.overlayWindow.on('closed', () => {
      console.log('Main: Overlay window closed')
      this.overlayWindow = null
      stateManager.setOverlayWindow(null)
      stateManager.setOverlayVisible(false)
    })

    // Add ready-to-show event for debugging
    this.overlayWindow.once('ready-to-show', () => {
      console.log('Main: Overlay window ready to show')
      
      // Register window with state manager
      stateManager.setOverlayWindow(this.overlayWindow!)
      
      // Ensure window is properly positioned and visible
      const bounds = this.overlayWindow?.getBounds()
      console.log('Main: Overlay window bounds:', bounds)
      
      // Make sure it's visible and on top
      this.overlayWindow?.show()
      this.overlayWindow?.setAlwaysOnTop(true)
      this.overlayWindow?.moveTop()
      
      // Update state manager
      stateManager.setOverlayVisible(true)
      
      console.log('Main: Overlay window shown and moved to top')
      console.log('Main: Overlay window visible:', this.overlayWindow?.isVisible())
    })

    // Add error handling
    this.overlayWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('Main: Overlay window failed to load:', errorCode, errorDescription)
    })

    this.overlayWindow.webContents.once('did-finish-load', () => {
      console.log('Main: Overlay window finished loading')
      // Open DevTools for overlay window to debug React issues
      if (isDev) {
        this.overlayWindow?.webContents.openDevTools()
      }
    })
  }

  public closeOverlayWindow() {
    if (this.overlayWindow) {
      this.overlayWindow.close()
      this.overlayWindow = null
      stateManager.setOverlayWindow(null)
      stateManager.setOverlayVisible(false)
    }
  }

  private setupIPC() {
    setupIPCHandlers()
    
    // Screen capture sources
    ipcMain.handle('get-screen-sources', async () => {
      try {
        const sources = await desktopCapturer.getSources({
          types: ['window', 'screen'],
          thumbnailSize: { width: 320, height: 180 }
        })
        
        return sources.map(source => ({
          id: source.id,
          name: source.name,
          thumbnail: source.thumbnail.toDataURL()
        }))
      } catch (error) {
        console.error('Error getting screen sources:', error)
        throw error
      }
    })
    
    // Overlay window management - simplified to use state manager
    ipcMain.handle('show-overlay', () => {
      console.log('Main: IPC show-overlay called')
      this.createOverlayWindow()
      console.log('Main: IPC show-overlay completed')
      return { success: true }
    })
    ipcMain.handle('hide-overlay', () => {
      console.log('Main: IPC hide-overlay called')
      this.closeOverlayWindow()
      console.log('Main: IPC hide-overlay completed')
      return { success: true }
    })

    console.log('Main: IPC handlers setup complete')
  }

  public getMainWindow() {
    return this.mainWindow
  }

  public getOverlayWindow() {
    return this.overlayWindow
  }
}

// Create and export the app instance
const gameCoachApp = new GameCoachApp()
export default gameCoachApp
