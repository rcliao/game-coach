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

  private calculateOverlayPosition(overlayWidth: number, overlayHeight: number) {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize
    const { x, y } = this.stateManager.getSettings().overlayPosition
    const centerX = (width * x) / 100
    const centerY = (height * y) / 100
    const posX = Math.max(0, Math.min(width - overlayWidth, Math.round(centerX - overlayWidth / 2)))
    const posY = Math.max(0, Math.min(height - overlayHeight, Math.round(centerY - overlayHeight / 2)))
    return { x: posX, y: posY }
  }

  private moveOverlayWindow() {
    if (!this.overlayWindow) return
    const { width, height } = this.overlayWindow.getBounds()
    const { x, y } = this.calculateOverlayPosition(width, height)
    this.overlayWindow.setBounds({ x, y })
  }

  createOverlayWindow(): ElectronBrowserWindow {
    if (this.overlayWindow) {
      this.moveOverlayWindow()
      this.overlayWindow.focus()
      return this.overlayWindow
    }

    const overlayWidth = 540
    const overlayHeight = 200
    const { x: overlayX, y: overlayY } = this.calculateOverlayPosition(
      overlayWidth,
      overlayHeight
    )

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
