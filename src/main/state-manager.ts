import { BrowserWindow, ipcMain, app } from 'electron'
import * as path from 'path'
import * as fs from 'fs/promises'
import type { AppSettings, GameState, Advice, GameDetectionResult } from '../shared/types'

// Centralized state interface for the main process
interface GlobalState {
  gameDetection: GameDetectionResult | null
  gameState: GameState
  isAnalyzing: boolean
  lastAnalysis: Advice | null
  settings: AppSettings
  isOverlayVisible: boolean
}

class StateManager {
  private state: GlobalState
  private mainWindow: BrowserWindow | null = null
  private overlayWindow: BrowserWindow | null = null
  private listeners: Set<(state: GlobalState) => void> = new Set()

  constructor() {
    this.state = {
      gameDetection: null,
      gameState: {
        isRavenswatchDetected: false,
        isCapturing: false,
        currentSourceId: null,
        lastFrameTime: 0,
      },
      isAnalyzing: false,
      lastAnalysis: null,      settings: {
        llmProvider: 'openai',
        openaiApiKey: '',
        geminiApiKey: '',
        overlayEnabled: true,
        ttsEnabled: false,
        adviceFrequency: 5,
        overlayPosition: { x: 20, y: 20 },
        ttsVoice: 'default',
        ttsSpeed: 1.0,
        ttsVolume: 0.8,        ttsOnlyUrgent: false,
        overlayTheme: 'dark',
        overlaySize: 'medium',
        overlayOpacity: 0.9,
        showConfidenceScore: true,
        autoHideDelay: 8,
        frameProcessingQuality: 'medium',
        enableHUDRegionDetection: true,
        maxAdviceHistory: 10,
        // V1: Custom Instructions defaults
        customInstructions: {
          systemPrompt: 'You are an expert gaming coach for Ravenswatch. Provide concise, actionable advice based on what you see in the game.',
          gameSpecificPrompts: {},
          activeTemplate: 'tactical-coach',
          enableVariableSubstitution: true,
          customTemplates: []
        },
        // V1: Capture Settings defaults
        captureSettings: {
          selectedSource: null,
          region: null,
          quality: 'medium',
          frameRate: 30,
          compression: 80,
          autoDetectGames: true
        },
        // V1: Testing Settings defaults
        overlayTesting: {
          testPosition: { x: 100, y: 100 },
          testSize: { width: 300, height: 100 },
          testDuration: 5,
          testStyle: 'dark',
          enableMultiMonitor: false,
          savedPositions: []
        },
        // V1: Setup Progress defaults
        setupProgress: {
          isComplete: false,
          completedSteps: [],
          setupStartTime: 0,
          setupCompletionTime: 0,
          firstSessionComplete: false
        }
      },
      isOverlayVisible: false,
    }

    this.setupIPCHandlers()
    this.loadSettingsFromDisk()
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

  getGameDetection(): GameDetectionResult | null {
    return this.state.gameDetection
  }

  getGameState(): GameState {
    return { ...this.state.gameState }
  }

  getSettings(): AppSettings {
    return { ...this.state.settings }
  }

  // State setters with automatic synchronization
  setGameDetection(detection: GameDetectionResult | null) {
    console.log('StateManager: Setting game detection:', detection)
    this.state.gameDetection = detection
    this.state.gameState.isRavenswatchDetected = detection?.isGameRunning || false
    
    // Auto-show overlay logic
    if (detection?.isGameRunning && this.state.settings.overlayEnabled && !this.state.isOverlayVisible) {
      console.log('StateManager: Game detected, auto-showing overlay')
      this.setOverlayVisible(true)
    }
    
    this.broadcastStateUpdate()
  }

  setGameState(gameState: Partial<GameState>) {
    console.log('StateManager: Setting game state:', gameState)
    this.state.gameState = { ...this.state.gameState, ...gameState }
    this.broadcastStateUpdate()
  }

  setAnalyzing(analyzing: boolean) {
    console.log('StateManager: Setting analyzing:', analyzing)
    this.state.isAnalyzing = analyzing
    
    // Auto-show overlay when analysis starts if game is detected
    if (analyzing && this.state.gameDetection?.isGameRunning && this.state.settings.overlayEnabled && !this.state.isOverlayVisible) {
      console.log('StateManager: Analysis started with game detected, auto-showing overlay')
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
      const userDataPath = app.getPath('userData')
      const settingsPath = path.join(userDataPath, 'settings.json')
      await fs.writeFile(settingsPath, JSON.stringify(this.state.settings, null, 2))
      console.log('StateManager: Settings saved to disk')
    } catch (error) {
      console.error('StateManager: Failed to save settings:', error)
    }
  }

  private async loadSettingsFromDisk(): Promise<void> {
    try {
      const userDataPath = app.getPath('userData')
      const settingsPath = path.join(userDataPath, 'settings.json')
      const settingsData = await fs.readFile(settingsPath, 'utf-8')
      const savedSettings = JSON.parse(settingsData)
      
      // Merge saved settings with defaults to handle new settings properties
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

    ipcMain.handle('state-get-game-detection', () => {
      return this.getGameDetection()
    })

    ipcMain.handle('state-get-game-state', () => {
      return this.getGameState()
    })

    ipcMain.handle('state-get-settings', () => {
      return this.getSettings()
    })

    // State setters
    ipcMain.handle('state-set-game-detection', (event, detection: GameDetectionResult | null) => {
      this.setGameDetection(detection)
      return { success: true }
    })

    ipcMain.handle('state-set-game-state', (event, gameState: Partial<GameState>) => {
      this.setGameState(gameState)
      return { success: true }
    })

    ipcMain.handle('state-set-analyzing', (event, analyzing: boolean) => {
      this.setAnalyzing(analyzing)
      return { success: true }
    })

    ipcMain.handle('state-set-last-analysis', (event, analysis: Advice | null) => {
      this.setLastAnalysis(analysis)
      return { success: true }
    })

    ipcMain.handle('state-set-settings', (event, settings: Partial<AppSettings>) => {
      this.setSettings(settings)
      return { success: true }
    })

    ipcMain.handle('state-set-overlay-visible', (event, visible: boolean) => {
      this.setOverlayVisible(visible)
      return { success: true }
    })

    // Bulk state update
    ipcMain.handle('state-update-bulk', (event, updates: Partial<GlobalState>) => {
      if (updates.gameDetection !== undefined) {
        this.setGameDetection(updates.gameDetection)
      }
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
