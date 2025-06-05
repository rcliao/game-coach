import type { BrowserWindow as ElectronBrowserWindow, BrowserWindowConstructorOptions } from 'electron'
import { screen } from 'electron'
import * as path from 'path'
import { stateManager, type StateManager } from './state-manager'

export interface WindowManagerOptions {
  isDev?: boolean
  stateManager?: StateManager
}

export class WindowManager {
  private BrowserWindow: typeof ElectronBrowserWindow
  private isDev: boolean
  private stateManager: StateManager
  private mainWindow: ElectronBrowserWindow | null = null
  private overlayWindow: ElectronBrowserWindow | null = null

  constructor(BrowserWindowClass: typeof ElectronBrowserWindow, options: WindowManagerOptions = {}) {
    this.BrowserWindow = BrowserWindowClass
    this.isDev = options.isDev ?? process.env.NODE_ENV === 'development'
    this.stateManager = options.stateManager ?? stateManager
  }

  createMainWindow(): ElectronBrowserWindow {
    const opts: BrowserWindowConstructorOptions = {
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload/preload.js'),
      },
      icon: path.join(__dirname, '../../assets/icons/icon.png'),
      title: 'Ravenswatch Game Coach',
    }

    this.mainWindow = new this.BrowserWindow(opts)
    this.stateManager.setMainWindow(this.mainWindow)

    if (this.isDev) {
      this.mainWindow.loadURL('http://localhost:5173')
      this.mainWindow.webContents.openDevTools()
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
    }

    return this.mainWindow
  }

  createOverlayWindow(): ElectronBrowserWindow {
    if (this.overlayWindow) {
      this.overlayWindow.focus()
      return this.overlayWindow
    }

    const { width } = screen.getPrimaryDisplay().workAreaSize
    const overlayWidth = 300
    const overlayHeight = 150
    const overlayX = Math.max(0, width - overlayWidth - 20)
    const overlayY = 20

    const opts: BrowserWindowConstructorOptions = {
      width: overlayWidth,
      height: overlayHeight,
      x: overlayX,
      y: overlayY,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      focusable: false,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload/preload.js'),
      },
    }

    this.overlayWindow = new this.BrowserWindow(opts)

    if (this.isDev) {
      this.overlayWindow.loadURL('http://localhost:5173#overlay')
    } else {
      this.overlayWindow.loadFile(path.join(__dirname, '../renderer/index.html'), { hash: 'overlay' })
    }

    this.overlayWindow.on('closed', () => {
      this.overlayWindow = null
      this.stateManager.setOverlayWindow(null)
      this.stateManager.setOverlayVisible(false)
    })

    this.overlayWindow.once('ready-to-show', () => {
      this.stateManager.setOverlayWindow(this.overlayWindow!)
      this.overlayWindow!.show()
      this.overlayWindow!.setAlwaysOnTop(true)
      this.overlayWindow!.moveTop()
      this.stateManager.setOverlayVisible(true)
    })

    this.overlayWindow.webContents.on('did-fail-load', (_event, code, desc) => {
      // eslint-disable-next-line no-console
      console.error('Overlay window failed to load:', code, desc)
    })

    this.overlayWindow.webContents.once('did-finish-load', () => {
      if (this.isDev) {
        this.overlayWindow?.webContents.openDevTools()
      }
    })

    return this.overlayWindow
  }

  closeOverlayWindow(): void {
    if (this.overlayWindow) {
      this.overlayWindow.close()
      this.overlayWindow = null
      this.stateManager.setOverlayWindow(null)
      this.stateManager.setOverlayVisible(false)
    }
  }

  getMainWindow(): ElectronBrowserWindow | null {
    return this.mainWindow
  }

  getOverlayWindow(): ElectronBrowserWindow | null {
    return this.overlayWindow
  }
}

export default WindowManager
