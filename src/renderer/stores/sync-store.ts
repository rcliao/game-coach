import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { AppSettings, GameState, Advice } from '@shared/types'

type AnySettings = AppSettings & Record<string, any>
import { LLMService, type LLMConfig, type AnalysisResponse } from '../services/llm-service'
import { GameDetectorService, type GameDetectionResult } from '../services/game-detector'
import { type StateClient, ElectronStateClient } from '../ipc/state-client'

interface SyncGameCoachState {
  // Core state - synchronized with main process
  gameDetection: GameDetectionResult | null
  gameState: GameState
  isAnalyzing: boolean
  lastAnalysis: AnalysisResponse | null
  settings: AnySettings
  isOverlayVisible: boolean

  // Local UI state - not synchronized
  isSettingsModalOpen: boolean
  isLoading: boolean
  error: string | null

  // Screen capture state
  selectedSourceId: string | null
  captureActive: boolean
  lastCaptureTime: number

  // Advice history
  adviceHistory: Advice[]

  // V1: Instruction Editor state (local UI state)
  instructionEditor: {
    isDirty: boolean
    activeTemplate: string | null
    previewMode: boolean
    testScenario: string
  }

  // V1: Overlay Testing state (local UI state)
  overlayTesting: {
    isTestActive: boolean
    currentTestType: 'position' | 'style' | 'duration' | 'multimonitor' | null
    testStartTime: number
  }

  // Services
  llmService: LLMService | null
  gameDetector: GameDetectorService

  // Actions
  initializeStore: () => Promise<void>
  syncToMainProcess: () => Promise<void>
  
  // State setters that update main process
  setGameDetection: (detection: GameDetectionResult | null) => Promise<void>
  setGameState: (gameState: Partial<GameState>) => Promise<void>
  setAnalyzing: (analyzing: boolean) => Promise<void>
  setLastAnalysis: (analysis: AnalysisResponse | null) => Promise<void>
  updateSettings: (settings: Partial<AnySettings>) => Promise<void>
  setOverlayVisible: (visible: boolean) => Promise<void>

  // Game detection actions
  startGameDetection: () => void
  stopGameDetection: () => void
  
  // Overlay actions
  showOverlay: () => Promise<void>
  hideOverlay: () => Promise<void>

  // LLM actions
  initializeLLMService: () => Promise<void>

  // Screen capture actions
  setSelectedSource: (sourceId: string | null) => void
  setCaptureActive: (active: boolean) => void
  setLastCaptureTime: (time: number) => void

  // Advice actions
  addAdvice: (advice: Advice) => void
  clearAdviceHistory: () => void

  // V1: Instruction Editor actions
  setInstructionEditorState: (state: Partial<SyncGameCoachState['instructionEditor']>) => void
  markInstructionEditorDirty: (dirty: boolean) => void
  setActiveTemplate: (templateId: string | null) => void
  setPreviewMode: (enabled: boolean) => void
  setTestScenario: (scenario: string) => void

  // V1: Overlay Testing actions
  setOverlayTestingState: (state: Partial<SyncGameCoachState['overlayTesting']>) => void
  startOverlayTest: (testType: 'position' | 'style' | 'duration' | 'multimonitor') => void
  stopOverlayTest: () => void

  // Local UI actions
  setSettingsModalOpen: (open: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export function createSyncGameCoachStore(client: StateClient = new ElectronStateClient()) {
  return create<SyncGameCoachState>()(
    subscribeWithSelector((set, get) => ({    // Initial state
    gameDetection: null,
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
      systemInstruction:
        'You are an expert gaming coach for Ravenswatch. Provide concise, actionable advice based on what you see in the game.',
      captureSourceId: null,
      overlayEnabled: true,
      overlayOpacity: 0.9
    },
    isOverlayVisible: false,    // Local UI state
    isSettingsModalOpen: false,
    isLoading: false,
    error: null,

    // Screen capture state
    selectedSourceId: null,
    captureActive: false,
    lastCaptureTime: 0,

    // Advice history
    adviceHistory: [],

    // V1: Instruction Editor state (local UI state)
    instructionEditor: {
      isDirty: false,
      activeTemplate: null,
      previewMode: false,
      testScenario: ''
    },

    // V1: Overlay Testing state (local UI state)
    overlayTesting: {
      isTestActive: false,
      currentTestType: null,
      testStartTime: 0
    },

    // Services
    llmService: null,
    gameDetector: new GameDetectorService(),

    // Initialize store and sync with main process
    initializeStore: async () => {
      console.log('SyncStore: Initializing store...')
      
      try {
        // Get current state from main process
        const currentState = await client.stateGetCurrent()
        console.log('SyncStore: Received current state from main:', currentState)
        
        // Update local state to match main process
        set({
          gameDetection: currentState.gameDetection,
          gameState: currentState.gameState,
          isAnalyzing: currentState.isAnalyzing,
          lastAnalysis: currentState.lastAnalysis,
          settings: currentState.settings,
          isOverlayVisible: currentState.isOverlayVisible,
        })

        // Subscribe to state updates from main process
        const unsubscribe = client.onStateUpdated((newState) => {
          console.log('SyncStore: Received state update from main:', newState)
          set({
            gameDetection: newState.gameDetection,
            gameState: newState.gameState,
            isAnalyzing: newState.isAnalyzing,
            lastAnalysis: newState.lastAnalysis,
            settings: newState.settings,
            isOverlayVisible: newState.isOverlayVisible,
          })
        })

        // Store cleanup function for later use
        ;(window as any).__stateUpdateUnsubscribe = unsubscribe

        console.log('SyncStore: Store initialized successfully')
      } catch (error) {
        console.error('SyncStore: Failed to initialize store:', error)
        set({ error: 'Failed to initialize store' })
      }
    },

    syncToMainProcess: async () => {
      const { gameDetection, gameState, isAnalyzing, lastAnalysis, settings, isOverlayVisible } = get()
      
      try {
        await client.stateUpdateBulk({
          gameDetection,
          gameState,
          isAnalyzing,
          lastAnalysis,
          settings,
          isOverlayVisible,
        })
        console.log('SyncStore: Successfully synced to main process')
      } catch (error) {
        console.error('SyncStore: Failed to sync to main process:', error)
      }
    },

    // State setters that update main process
    setGameDetection: async (detection: GameDetectionResult | null) => {
      console.log('SyncStore: Setting game detection:', detection)
      try {
        await client.stateSetGameDetection(detection)
        // State will be updated via the event listener
      } catch (error) {
        console.error('SyncStore: Failed to set game detection:', error)
        set({ error: 'Failed to update game detection' })
      }
    },

    setGameState: async (gameState: Partial<GameState>) => {
      console.log('SyncStore: Setting game state:', gameState)
      try {
        await client.stateSetGameState(gameState)
        // State will be updated via the event listener
      } catch (error) {
        console.error('SyncStore: Failed to set game state:', error)
        set({ error: 'Failed to update game state' })
      }
    },

    setAnalyzing: async (analyzing: boolean) => {
      console.log('SyncStore: Setting analyzing:', analyzing)
      try {
        await client.stateSetAnalyzing(analyzing)
        // State will be updated via the event listener
      } catch (error) {
        console.error('SyncStore: Failed to set analyzing:', error)
        set({ error: 'Failed to update analyzing state' })
      }
    },

    setLastAnalysis: async (analysis: AnalysisResponse | null) => {
      console.log('SyncStore: Setting last analysis:', analysis)
      try {
        await client.stateSetLastAnalysis(analysis)
        // State will be updated via the event listener
      } catch (error) {
        console.error('SyncStore: Failed to set last analysis:', error)
        set({ error: 'Failed to update last analysis' })
      }
    },

    updateSettings: async (newSettings: Partial<AnySettings>) => {
      console.log('SyncStore: Updating settings:', Object.keys(newSettings))
      try {
        await client.stateSetSettings(newSettings)
        // State will be updated via the event listener
      } catch (error) {
        console.error('SyncStore: Failed to update settings:', error)
        set({ error: 'Failed to update settings' })
      }
    },

    setOverlayVisible: async (visible: boolean) => {
      console.log('SyncStore: Setting overlay visible:', visible)
      try {
        await client.stateSetOverlayVisible(visible)
        // State will be updated via the event listener
      } catch (error) {
        console.error('SyncStore: Failed to set overlay visible:', error)
        set({ error: 'Failed to update overlay visibility' })
      }
    },

    // Game detection actions
    startGameDetection: () => {
      console.log('SyncStore: Starting game detection')
      const { gameDetector, setGameDetection, setGameState } = get()
      
      gameDetector.startDetection(async (detection) => {
        console.log('SyncStore: Game detection callback received:', detection)
        await setGameDetection(detection)
        await setGameState({ isRavenswatchDetected: detection.isGameRunning })
      })
    },

    stopGameDetection: () => {
      console.log('SyncStore: Stopping game detection')
      const { gameDetector, setGameDetection, setGameState } = get()
      
      gameDetector.stopDetection()
      setGameDetection(null)
      setGameState({ isRavenswatchDetected: false })
    },

    // Overlay actions
    showOverlay: async () => {
      try {
        console.log('SyncStore: Showing overlay')
        await client.showOverlay()
        // Overlay visibility will be updated via state manager
      } catch (error) {
        console.error('SyncStore: Failed to show overlay:', error)
        set({ error: 'Failed to show overlay' })
      }
    },

    hideOverlay: async () => {
      try {
        console.log('SyncStore: Hiding overlay')
        await client.hideOverlay()
        // Overlay visibility will be updated via state manager
      } catch (error) {
        console.error('SyncStore: Failed to hide overlay:', error)
        set({ error: 'Failed to hide overlay' })
      }
    },    // LLM actions
    initializeLLMService: async () => {
      const { settings } = get()
      
      console.log('SyncStore: Preparing LLM config', {
        hasGemini: !!settings.geminiApiKey
      })

      const config: LLMConfig = {
        geminiApiKey: settings.geminiApiKey,
        maxRetries: 3,
        timeout: 30000,
      }

      try {
        console.log('SyncStore: Initializing LLM service with config:', {
          hasGemini: !!config.geminiApiKey
        })
        const llmService = new LLMService(config)
        
        console.log('SyncStore: LLM service created, checking readiness...')
        console.log('SyncStore: LLM service ready:', llmService.isReady())
        console.log('SyncStore: Available providers:', llmService.getAvailableProviders())
        
        set({ llmService })
        console.log('SyncStore: LLM service initialized successfully')
      } catch (error) {
        console.error('SyncStore: Failed to initialize LLM service:', error)
        set({ error: 'Failed to initialize LLM service' })
      }
    },

    // Screen capture actions
    setSelectedSource: (sourceId: string | null) => set({ selectedSourceId: sourceId }),
    setCaptureActive: (active: boolean) => set({ captureActive: active }),
    setLastCaptureTime: (time: number) => set({ lastCaptureTime: time }),

    // Advice actions
    addAdvice: (advice: Advice) => {
      set((state) => ({
        adviceHistory: [advice, ...state.adviceHistory].slice(0, get().settings.maxAdviceHistory)
      }))
    },
    clearAdviceHistory: () => set({ adviceHistory: [] }),

    // V1: Instruction Editor actions
    setInstructionEditorState: (state: Partial<SyncGameCoachState['instructionEditor']>) => set((prev) => ({
      instructionEditor: { ...prev.instructionEditor, ...state }
    })),
    markInstructionEditorDirty: (dirty: boolean) => set((prev) => ({
      instructionEditor: { ...prev.instructionEditor, isDirty: dirty }
    })),
    setActiveTemplate: (templateId: string | null) => set((prev) => ({
      instructionEditor: { ...prev.instructionEditor, activeTemplate: templateId }
    })),
    setPreviewMode: (enabled: boolean) => set((prev) => ({
      instructionEditor: { ...prev.instructionEditor, previewMode: enabled }
    })),
    setTestScenario: (scenario: string) => set((prev) => ({
      instructionEditor: { ...prev.instructionEditor, testScenario: scenario }
    })),

    // V1: Overlay Testing actions
    setOverlayTestingState: (state: Partial<SyncGameCoachState['overlayTesting']>) => set((prev) => ({
      overlayTesting: { ...prev.overlayTesting, ...state }
    })),
    startOverlayTest: (testType: 'position' | 'style' | 'duration' | 'multimonitor') => set((prev) => ({
      overlayTesting: { ...prev.overlayTesting, isTestActive: true, currentTestType: testType, testStartTime: Date.now() }
    })),
    stopOverlayTest: () => set((prev) => ({
      overlayTesting: { ...prev.overlayTesting, isTestActive: false }
    })),

    // Local UI actions
    setSettingsModalOpen: (open: boolean) => set({ isSettingsModalOpen: open }),
    setLoading: (loading: boolean) => set({ isLoading: loading }),
    setError: (error: string | null) => set({ error }),
  }))
  )
}

export const useSyncGameCoachStore = createSyncGameCoachStore()
