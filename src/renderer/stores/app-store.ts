import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { AppSettings, GameState, Advice, ScreenSource } from '@shared/types'
import { LLMService, type LLMConfig, type AnalysisResponse, createOpenAIClient, createGeminiClient } from '../services/llm-service'
import { GameDetectorService, type GameDetectionResult, createDefaultScreenCaptureAPI } from '../services/game-detector'

interface GameCoachState {
  // Settings
  settings: AppSettings
  updateSettings: (settings: Partial<AppSettings>) => void
  loadSettings: () => Promise<void>
  saveSettings: () => Promise<void>

  // Game state
  gameState: GameState
  updateGameState: (state: Partial<GameState>) => void

  // Screen sources
  screenSources: ScreenSource[]
  loadScreenSources: () => Promise<void>
  selectedSourceId: string | null
  setSelectedSource: (sourceId: string) => void

  // Advice history
  adviceHistory: Advice[]
  addAdvice: (advice: Advice) => void
  clearAdviceHistory: () => void

  // LLM state
  llmService: LLMService | null
  initializeLLMService: () => void
  llmProviders: string[]
  isAnalyzing: boolean
  setAnalyzing: (analyzing: boolean) => void
  lastAnalysis: AnalysisResponse | null
  setLastAnalysis: (analysis: AnalysisResponse | null) => void  // Game detection
  gameDetector: GameDetectorService
  gameDetection: GameDetectionResult | null
  setGameDetection: (detection: GameDetectionResult | null) => void
  startGameDetection: () => void
  stopGameDetection: () => void
  debugGameDetection: () => Promise<any>
  testCaptureSourcesRaw: () => Promise<any[]>
  runGameDetectorDiagnostic: () => Promise<void>

  // Screen capture state
  isCaptureActive: boolean
  setCaptureActive: (active: boolean) => void
  captureFrameRate: number
  lastCaptureTime: number
  setLastCaptureTime: (time: number) => void

  // UI state
  isSettingsModalOpen: boolean
  setSettingsModalOpen: (open: boolean) => void
  isOverlayVisible: boolean
  setOverlayVisible: (visible: boolean) => void
  showOverlay: () => Promise<void>
  hideOverlay: () => Promise<void>

  // App state
  isLoading: boolean
  setLoading: (loading: boolean) => void
  error: string | null
  setError: (error: string | null) => void
}

// Helper: Sync state to overlay if in main window

export const useGameCoachStore = create<GameCoachState>()(
  subscribeWithSelector((set, get) => ({    // Initial settings
      settings: {
        llmProvider: 'openai',
        openaiApiKey: '',
        geminiApiKey: '',
        overlayEnabled: true,
        ttsEnabled: false,
        adviceFrequency: 5,
        overlayPosition: { x: 20, y: 20 },
      // Phase 3: Advanced TTS Settings
      ttsVoice: 'default',
      ttsSpeed: 1.0,
      ttsVolume: 0.8,
      ttsOnlyUrgent: false,
      // Phase 3: Advanced Overlay Settings
      overlayTheme: 'dark',
      overlaySize: 'medium',
      overlayOpacity: 0.9,
      showConfidenceScore: true,
      autoHideDelay: 8,
      // Phase 3: Performance Settings
      frameProcessingQuality: 'medium',
        enableHUDRegionDetection: true,
        maxAdviceHistory: 50,
        customInstructions: {
          systemPrompt: '',
          gameSpecificPrompts: {},
          activeTemplate: '',
          enableVariableSubstitution: true,
          customTemplates: [],
        },
        captureSettings: {
          selectedSource: null,
          region: null,
          quality: 'medium',
          frameRate: 30,
          compression: 80,
          autoDetectGames: true,
        },
        overlayTesting: {
          testPosition: { x: 100, y: 100 },
          testSize: { width: 300, height: 100 },
          testDuration: 5000,
          testStyle: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            textColor: 'white',
            fontSize: 14,
            borderRadius: 8,
            padding: 16,
          },
          enableMultiMonitor: false,
          savedPositions: [],
        },
        setupProgress: {
          isComplete: false,
          completedSteps: [],
          setupStartTime: 0,
          setupCompletionTime: 0,
          firstSessionComplete: false,
        },
      },

    updateSettings: (newSettings) =>
      set((state) => ({
        settings: { ...state.settings, ...newSettings },
      })),

    loadSettings: async () => {
      try {
        set({ isLoading: true, error: null })
        const settings = await window.electronAPI.loadSettings()
        set({ settings })
      } catch (error) {
        set({ error: 'Failed to load settings' })
        console.error('Error loading settings:', error)
      } finally {
        set({ isLoading: false })
      }
    },    saveSettings: async () => {
      try {
        console.log('Store: Starting saveSettings...')
        console.log('Store: window object exists:', !!window)
        console.log('Store: electronAPI exists:', !!window.electronAPI)
        
        // Wait for electronAPI to be available with timeout
        let retryCount = 0
        const maxRetries = 10
        while (!window.electronAPI && retryCount < maxRetries) {
          console.log(`Store: electronAPI not ready, waiting... (attempt ${retryCount + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, 100))
          retryCount++
        }
        
        if (!window.electronAPI) {
          throw new Error('electronAPI is not available after waiting')
        }
        
        console.log('Store: electronAPI.saveSettings exists:', !!window.electronAPI.saveSettings)
        
        set({ isLoading: true, error: null })
        const { settings } = get()
        console.log('Store: Current settings:', settings)
        
        const result = await window.electronAPI.saveSettings(settings)
        console.log('Store: Save result:', result)
        
        set({ error: null })
        console.log('Store: Settings saved successfully')
      } catch (error) {
        console.error('Store: Error saving settings:', error)
        set({ error: 'Failed to save settings' })
      } finally {
        set({ isLoading: false })
        console.log('Store: saveSettings completed')
      }
    },

    // Initial game state
    gameState: {
      isRavenswatchDetected: false,
      isCapturing: false,
      currentSourceId: null,
      lastFrameTime: 0,
    },

    updateGameState: (newState) =>
      set((state) => ({
        gameState: { ...state.gameState, ...newState },
      })),

    // Screen sources
    screenSources: [],
    selectedSourceId: null,    loadScreenSources: async () => {
      try {
        set({ isLoading: true, error: null })
        const sources = await window.electronAPI.getCaptureSource()
        set({ screenSources: sources })
      } catch (error) {
        set({ error: 'Failed to load screen sources' })
        console.error('Error loading screen sources:', error)
      } finally {
        set({ isLoading: false })
      }
    },

    setSelectedSource: (sourceId) => set({ selectedSourceId: sourceId }),

    // Advice
    adviceHistory: [],

    addAdvice: (advice) =>
      set((state) => ({
        adviceHistory: [advice, ...state.adviceHistory].slice(0, 50), // Keep last 50
      })),

    clearAdviceHistory: () => set({ adviceHistory: [] }),

    // LLM state initialization
    llmService: null,
    llmProviders: [],
    isAnalyzing: false,
    lastAnalysis: null,    initializeLLMService: () => {
      console.log('Store: Initializing LLM service...')
      const { settings } = get()
      console.log('Store: Settings for LLM:', {
        hasOpenAI: !!settings.openaiApiKey,
        hasGemini: !!settings.geminiApiKey,
        provider: settings.llmProvider
      })
      
      const config: LLMConfig = {
        openaiApiKey: settings.openaiApiKey,
        geminiApiKey: settings.geminiApiKey,
        preferredProvider: settings.llmProvider as 'openai' | 'gemini' | 'auto',
        maxRetries: 3,
        timeout: 30000,
      }

      try {
        console.log('Store: Creating LLM service instance...')
        const service = new LLMService(config, {
          openAIFactory: createOpenAIClient,
          geminiFactory: createGeminiClient,
        })
        console.log('Store: LLM service created, setting in store...')
        
        set({
          llmService: service,
          llmProviders: service.getAvailableProviders(),
        })
        
        console.log('Store: LLM service initialized successfully')
      } catch (error) {
        console.error('Store: Error initializing LLM service:', error)
        set({ error: 'Failed to initialize LLM service' })
      }
    },

    setAnalyzing: (analyzing) => {
      set({ isAnalyzing: analyzing })
      
      // Auto-show overlay when analysis starts if game is detected and overlay is enabled
      if (analyzing) {
        const { gameDetection, settings, showOverlay } = get()
        if (gameDetection?.isGameRunning && settings.overlayEnabled) {
          console.log('Store: Analysis started with game detected, showing overlay...')
          showOverlay()
        }
      }
    },
    setLastAnalysis: (analysis) => {
      set({ lastAnalysis: analysis })
    },

    // Game detection initialization
    gameDetector: new GameDetectorService(createDefaultScreenCaptureAPI()),
    gameDetection: null,
    setGameDetection: (detection) => {
      set({ gameDetection: detection })
    },    startGameDetection: () => {
      console.log('Store: startGameDetection() called')
      const { gameDetector, updateGameState } = get()
      console.log('Store: Calling gameDetector.startDetection()...')
      gameDetector.startDetection((detection) => {
        console.log('Store: Game detection callback received:', detection)
        set({ gameDetection: detection })
        
        // Update gameState.isRavenswatchDetected based on detection result
        console.log('Store: Updating gameState.isRavenswatchDetected to:', detection.isGameRunning)
        updateGameState({ isRavenswatchDetected: detection.isGameRunning })

        // Auto-show overlay when game is detected and overlay is enabled
        const { settings, showOverlay } = get()
        if (detection.isGameRunning && settings.overlayEnabled) {
          console.log('Store: Game detected and overlay enabled, showing overlay...')
          showOverlay()
        }
      })
    },    stopGameDetection: () => {
      console.log('Store: stopGameDetection() called')
      const { gameDetector, updateGameState, hideOverlay } = get()
      gameDetector.stopDetection()
      
      // Reset detection state
      set({ gameDetection: null })
      updateGameState({ isRavenswatchDetected: false })
      
      // Hide overlay when game detection stops
      hideOverlay()
      console.log('Store: Game detection stopped, overlay hidden, and state reset')
    },// Debug game detection
    debugGameDetection: async () => {
      const { gameDetector } = get()
      return await gameDetector.debugDetection()
    },    // Test raw capture sources
    testCaptureSourcesRaw: async () => {
      const { gameDetector } = get()
      return await gameDetector.testCaptureSourcesRaw()
    },

    // Run comprehensive diagnostic
    runGameDetectorDiagnostic: async () => {
      const { gameDetector } = get()
      return await gameDetector.runDiagnostic()
    },

    // Screen capture state
    isCaptureActive: false,
    setCaptureActive: (active) => set({ isCaptureActive: active }),
    captureFrameRate: 30,
    lastCaptureTime: 0,
    setLastCaptureTime: (time) => set({ lastCaptureTime: time }),

    // UI state
    isSettingsModalOpen: false,
    setSettingsModalOpen: (open) => set({ isSettingsModalOpen: open }),

    isOverlayVisible: false,
    setOverlayVisible: (visible) => set({ isOverlayVisible: visible }),    // Overlay window management
    showOverlay: async () => {
      try {
        console.log('Store: showOverlay() called')
        console.log('Store: Current settings.overlayEnabled:', get().settings.overlayEnabled)
        
        // Check if electronAPI is available
        if (!window.electronAPI) {
          throw new Error('electronAPI not available')
        }
        if (typeof window.electronAPI.showOverlay !== 'function') {
          throw new Error('showOverlay method not available')
        }
        
        console.log('Store: Calling window.electronAPI.showOverlay()...')
        await window.electronAPI.showOverlay()
        
        set({ isOverlayVisible: true })
        console.log('Store: Overlay window shown, isOverlayVisible set to true')
        
        // Additional debugging - log current state
        const currentState = get()
        console.log('Store: Current overlay state after show:', {
          isOverlayVisible: currentState.isOverlayVisible,
          overlayEnabled: currentState.settings.overlayEnabled,
          gameDetected: currentState.gameDetection?.isGameRunning
        })
      } catch (error) {
        console.error('Store: Error showing overlay:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        set({ error: `Failed to show overlay: ${errorMessage}` })
      }
    },

    hideOverlay: async () => {
      try {
        console.log('Store: hideOverlay() called')
        await window.electronAPI.hideOverlay()
        set({ isOverlayVisible: false })
        console.log('Store: Overlay window hidden')
      } catch (error) {
        console.error('Store: Error hiding overlay:', error)
        set({ error: 'Failed to hide overlay' })
      }
    },

    // App state
    isLoading: false,
    setLoading: (loading) => set({ isLoading: loading }),

    error: null,
    setError: (error) => set({ error }),
  }))
)

// Auto-save settings when they change
useGameCoachStore.subscribe(
  (state) => state.settings,
  () => {
    // Debounce auto-save to avoid too frequent saves
    const saveSettings = useGameCoachStore.getState().saveSettings
    setTimeout(saveSettings, 500)
  },
  { equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) }
)
