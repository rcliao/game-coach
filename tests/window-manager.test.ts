// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { EventEmitter } from 'events'
import { WindowManager } from '../src/main/window-manager'
import { StateManager } from '../src/main/state-manager'

class MockBrowserWindow extends EventEmitter {
  public webContents = {
    on: vi.fn(),
    once: vi.fn(),
    send: vi.fn(),
    openDevTools: vi.fn(),
  }
  public loadURL = vi.fn()
  public loadFile = vi.fn()
  public focus = vi.fn()
  public show = vi.fn()
  public setAlwaysOnTop = vi.fn()
  public moveTop = vi.fn()
  public close = vi.fn()
  public isVisible = vi.fn(() => true)
  public isDestroyed = vi.fn(() => false)
  constructor(public options: any) {
    super()
  }
  getBounds() {
    return { x: this.options.x ?? 0, y: this.options.y ?? 0, width: this.options.width, height: this.options.height }
  }
}

vi.mock('electron', () => ({
  screen: {
    getPrimaryDisplay: () => ({ workAreaSize: { width: 800, height: 600 } })
  },
  ipcMain: { handle: vi.fn() },
  app: { getPath: vi.fn(() => '/tmp') },
  BrowserWindow: class {},
}))

describe('WindowManager', () => {
  it('creates overlay window and updates state on ready', () => {
    const sm = new StateManager({ enableIPC: false, loadSettings: false })
    const wm = new WindowManager(MockBrowserWindow as any, { isDev: false, stateManager: sm })
    const overlay = wm.createOverlayWindow() as unknown as MockBrowserWindow

    expect(overlay).toBeInstanceOf(MockBrowserWindow)
    expect(sm.getState().isOverlayVisible).toBe(false)

    overlay.emit('ready-to-show')
    expect(sm.getState().isOverlayVisible).toBe(true)
  })

  it('positions overlay using offsets', () => {
    const sm = new StateManager({ enableIPC: false, loadSettings: false })
    sm.setSettings({ overlayOffsetX: 30, overlayOffsetY: 40 })
    const wm = new WindowManager(MockBrowserWindow as any, { isDev: false, stateManager: sm })
    const overlay = wm.createOverlayWindow() as unknown as MockBrowserWindow

    expect(overlay.options.x).toBe(800 - 640 - 30)
    expect(overlay.options.y).toBe(40)
  })

  it('closing overlay window hides overlay', () => {
    const sm = new StateManager({ enableIPC: false, loadSettings: false })
    const wm = new WindowManager(MockBrowserWindow as any, { isDev: false, stateManager: sm })
    const overlay = wm.createOverlayWindow() as unknown as MockBrowserWindow
    overlay.emit('ready-to-show')

    wm.closeOverlayWindow()
    expect(sm.getState().isOverlayVisible).toBe(false)
    expect(wm.getOverlayWindow()).toBeNull()
  })
})
