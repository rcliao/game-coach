import { app, BrowserWindow, ipcMain, desktopCapturer, globalShortcut } from 'electron'
import { setupIPCHandlers } from './ipc-handlers'
import WindowManager from './window-manager'

const isDev = process.env.NODE_ENV === 'development'

class GameCoachApp {
  private windowManager: WindowManager

  constructor() {
    this.windowManager = new WindowManager(BrowserWindow, { isDev })
    this.setupApp()
  }

  private setupApp() {
    app.whenReady().then(() => {
      this.windowManager.createMainWindow()
      this.setupIPC()
      globalShortcut.register('Control+Shift+O', () => {
        this.toggleOverlayWindow()
      })
    })

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.windowManager.createMainWindow()
      }
    })

    app.on('will-quit', () => {
      globalShortcut.unregisterAll()
    })
  }

  public createOverlayWindow() {
    this.windowManager.createOverlayWindow()
  }

  public closeOverlayWindow() {
    this.windowManager.closeOverlayWindow()
  }

  public toggleOverlayWindow() {
    if (this.windowManager.getOverlayWindow()) {
      this.closeOverlayWindow()
    } else {
      this.createOverlayWindow()
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
    return this.windowManager.getMainWindow()
  }

  public getOverlayWindow() {
    return this.windowManager.getOverlayWindow()
  }
}

// Create and export the app instance
const gameCoachApp = new GameCoachApp()
export default gameCoachApp
