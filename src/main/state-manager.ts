import { BrowserWindow, ipcMain } from 'electron'
import type { SettingsStorage } from './settings-storage'
import { defaultSettingsStorage } from './settings-storage'
import type {
  AppSettings,
  GameState,
  Advice,
} from '../shared/types'

// Centralized state interface for the main process
interface GlobalState {
  gameState: GameState
  isAnalyzing: boolean
  lastAnalysis: Advice | null
  settings: AppSettings
  isOverlayVisible: boolean
}

export interface StateManagerOptions {
  enableIPC?: boolean
  loadSettings?: boolean
}

export class StateManager {
  private state: GlobalState
  private mainWindow: BrowserWindow | null = null
  private overlayWindow: BrowserWindow | null = null
  private listeners: Set<(state: GlobalState) => void> = new Set()
  private enableIPC: boolean
  private loadSettings: boolean
  private storage: SettingsStorage

  constructor(options: StateManagerOptions = {}, storage: SettingsStorage = defaultSettingsStorage) {
    this.enableIPC = options.enableIPC !== false
    this.loadSettings = options.loadSettings !== false
    this.storage = storage
    this.state = {
      gameState: {
        isRavenswatchDetected: false,
        isCapturing: false,
        currentSourceId: null,
        lastFrameTime: 0,
      },
      isAnalyzing: false,
      lastAnalysis: null,
      settings: {
        geminiApiKey: '',
        systemInstruction: 'You are an expert gaming coach for Ravenswatch. Provide concise, actionable advice based on what you see in the game.',
        captureSourceId: null,
        overlayEnabled: true,
        overlayOpacity: 0.9,
        overlayOffsetX: 20,
        overlayOffsetY: 20
      },
      isOverlayVisible: false,
    }

    if (this.enableIPC) {
      this.setupIPCHandlers()
    }
    if (this.loadSettings) {
      this.loadSettingsFromDisk()
    }
  }

  // Window management
  setMainWindow(window: BrowserWindow | null) {
    this.mainWindow = window
  }

  setOverlayWindow(window: BrowserWindow | null) {
    this.overlayWindow = window
  }

  // State getters
  getState(): GlobalState {
    return { ...this.state }
  }

  getGameState(): GameState {
    return { ...this.state.gameState }
  }

  getSettings(): AppSettings {
    return { ...this.state.settings }
  }

  // State setters with automatic synchronization

  setGameState(gameState: Partial<GameState>) {
    console.log('StateManager: Setting game state:', gameState)
    this.state.gameState = { ...this.state.gameState, ...gameState }
    this.broadcastStateUpdate()
  }

  setAnalyzing(analyzing: boolean) {
    console.log('StateManager: Setting analyzing:', analyzing)
    this.state.isAnalyzing = analyzing
    
    // Auto-show overlay when analysis starts
    if (analyzing && this.state.settings.overlayEnabled && !this.state.isOverlayVisible) {
      console.log('StateManager: Analysis started, auto-showing overlay')
      this.setOverlayVisible(true)
    }
    
    this.broadcastStateUpdate()
  }

  setLastAnalysis(analysis: Advice | null) {
    console.log('StateManager: Setting last analysis:', analysis?.content?.substring(0, 50) + '...')
    this.state.lastAnalysis = analysis
    this.broadcastStateUpdate()
  }

  setSettings(settings: Partial<AppSettings>) {
    console.log('StateManager: Setting settings:', Object.keys(settings))
    this.state.settings = { ...this.state.settings, ...settings }
    this.broadcastStateUpdate()


    
    // Auto-save settings to disk
    this.saveSettingsToDisk().catch(error => {
      console.error('StateManager: Failed to save settings to disk:', error)
    })
  }

  // Settings persistence methods
  private async saveSettingsToDisk(): Promise<void> {
    try {
      await this.storage.save(this.state.settings)
      console.log('StateManager: Settings saved to disk')
    } catch (error) {
      console.error('StateManager: Failed to save settings:', error)
    }
  }

  private async loadSettingsFromDisk(): Promise<void> {
    try {
      const savedSettings = await this.storage.load()
      this.state.settings = { ...this.state.settings, ...savedSettings }
      console.log('StateManager: Settings loaded from disk')
      // Broadcast the loaded settings to any already-connected windows
      this.broadcastStateUpdate()
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log('StateManager: No saved settings found, using defaults')
      } else {
        console.error('StateManager: Failed to load settings:', error)
      }
    }
  }

  setOverlayVisible(visible: boolean) {
    console.log('StateManager: Setting overlay visible:', visible)
    this.state.isOverlayVisible = visible
    this.broadcastStateUpdate()
  }

  // Broadcast state updates to all renderer processes
  private broadcastStateUpdate() {
    const state = this.getState()
    
    // Send to main window
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('state-updated', state)
    }
    
    // Send to overlay window
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      this.overlayWindow.webContents.send('state-updated', state)
    }
    
    // Notify internal listeners
    this.listeners.forEach(listener => {
      try {
        listener(state)
      } catch (error) {
        console.error('StateManager: Error in state listener:', error)
      }
    })
  }

  // Subscribe to state changes
  subscribe(listener: (state: GlobalState) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // Setup IPC handlers for state management
  private setupIPCHandlers() {
    // State getters
    ipcMain.handle('state-get-current', () => {
      return this.getState()
    })

    ipcMain.handle('state-get-game-state', () => {
      return this.getGameState()
    })

    ipcMain.handle('state-get-settings', () => {
      return this.getSettings()
    })

    // State setters
    ipcMain.handle('state-set-game-state', (_event, gameState: Partial<GameState>) => {
      this.setGameState(gameState)
      return { success: true }
    })

    ipcMain.handle('state-set-analyzing', (_event, analyzing: boolean) => {
      this.setAnalyzing(analyzing)
      return { success: true }
    })

    ipcMain.handle('state-set-last-analysis', (_event, analysis: Advice | null) => {
      this.setLastAnalysis(analysis)
      return { success: true }
    })

    ipcMain.handle('state-set-settings', (_event, settings: Partial<AppSettings>) => {
      this.setSettings(settings)
      return { success: true }
    })

    ipcMain.handle('state-set-overlay-visible', (_event, visible: boolean) => {
      this.setOverlayVisible(visible)
      return { success: true }
    })

    // Bulk state update
    ipcMain.handle('state-update-bulk', (_event, updates: Partial<GlobalState>) => {
      if (updates.gameState !== undefined) {
        this.setGameState(updates.gameState)
      }
      if (updates.isAnalyzing !== undefined) {
        this.setAnalyzing(updates.isAnalyzing)
      }
      if (updates.lastAnalysis !== undefined) {
        this.setLastAnalysis(updates.lastAnalysis)
      }
      if (updates.settings !== undefined) {
        this.setSettings(updates.settings)
      }
      if (updates.isOverlayVisible !== undefined) {
        this.setOverlayVisible(updates.isOverlayVisible)
      }
      return { success: true }
    })

    console.log('StateManager: IPC handlers setup complete')
  }
}

// Export singleton instance
export const stateManager = new StateManager()

export default StateManager
