// Shared types between main and renderer processes

export interface ScreenSource {
  id: string
  name: string
  thumbnail: string
}

export interface AppSettings {
  llmProvider: 'openai' | 'gemini'
  openaiApiKey: string
  geminiApiKey: string
  overlayEnabled: boolean
  ttsEnabled: boolean
  adviceFrequency: number // seconds between advice
  // Overlay position as percentages of the screen
  // Values represent the center of the overlay (0 = top/left, 100 = bottom/right)
  overlayPosition: {
    x: number
    y: number
  }
  // Phase 3: Advanced TTS Settings
  ttsVoice: string
  ttsSpeed: number
  ttsVolume: number
  ttsOnlyUrgent: boolean
  // Phase 3: Advanced Overlay Settings
  overlayTheme: 'dark' | 'light' | 'minimal'
  overlaySize: 'small' | 'medium' | 'large'
  overlayOpacity: number
  showConfidenceScore: boolean
  autoHideDelay: number // seconds
  // Phase 3: Performance Settings
  frameProcessingQuality: 'low' | 'medium' | 'high'
  enableHUDRegionDetection: boolean
  maxAdviceHistory: number
  // V1: Capture Settings
  captureSettings: {
    selectedSource: ScreenSource | null
    region: CaptureRegion | null
    quality: 'low' | 'medium' | 'high'
    frameRate: number
    compression: number
    autoDetectGames: boolean
  }
  // V1: Setup Progress
  setupProgress: {
    isComplete: boolean
    completedSteps: string[]
    setupStartTime: number
    setupCompletionTime: number
    firstSessionComplete: boolean
  }
}

export interface GameState {
  isRavenswatchDetected: boolean
  isCapturing: boolean
  currentSourceId: string | null
  lastFrameTime: number
}

export interface Advice {
  id: string
  content: string
  category?: 'combat' | 'exploration' | 'items' | 'general'
  confidence: number
  timestamp: number
  provider: 'openai' | 'gemini'
  analysisTime?: number
}

export interface PerformanceMetrics {
  latency: number // ms
  cpuUsage: number // percentage
  memoryUsage: number // MB
  frameRate: number // fps
}

// LLM Response types
export interface LLMResponse {
  advice: string
  category: string
  confidence: number
  reasoning?: string
}

// LLM Analysis types
export interface AnalysisRequest {
  imageBuffer: Buffer
  gameContext: string
  analysisType: 'tactical' | 'strategic' | 'immediate'
  hudRegions?: HUDRegion[]
}

export interface AnalysisResponse {
  advice: string
  confidence: number
  provider: 'openai' | 'gemini'
  timestamp: number
  analysisTime: number
}

// Game detection types
export interface GameWindow {
  id: string
  name: string
  executable: string
  isActive: boolean
  bounds?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface GameDetectionResult {
  isGameRunning: boolean
  gameWindow?: GameWindow
  confidence: number
  detectionMethod: string
}

export interface HUDRegion {
  name: string
  coordinates: {
    x: number
    y: number
    width: number
    height: number
  }
  priority: 'low' | 'medium' | 'high' | 'critical'
  analysisType: string
}

export interface GameTemplate {
  name: string
  hudRegions: Record<string, HUDRegion>
  prompts: {
    systemPrompt: string
    basePrompt: string
    contextPrompts: Record<string, any>
  }
}

// Events
export type IPCEvents = {
  'screen-capture-frame': { frame: Buffer; timestamp: number }
  'advice-received': Advice
  'performance-update': PerformanceMetrics
  'game-state-changed': GameState
}

// V1: Custom Instructions Types
export interface InstructionTemplate {
  id: string
  name: string
  description: string
  systemPrompt: string
  variables: Record<string, string>
  category: 'combat' | 'exploration' | 'speedrun' | 'general'
  isBuiltIn: boolean
}

// V1: Capture Region Types
export interface CaptureRegion {
  x: number
  y: number
  width: number
  height: number
}

// V1: Global State Extensions for Main Process
