// Shared types between main and renderer processes

export interface ScreenSource {
  id: string
  name: string
  thumbnail: string
}

export interface AppSettings {
  geminiApiKey: string
  systemInstruction: string
  captureSourceId: string | null
  overlayEnabled: boolean
  overlayOpacity: number
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
  provider: 'gemini'
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
  provider: 'gemini'
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
export interface V1GlobalState {
  overlayTesting: {
    isTestMode: boolean
    testPosition: { x: number; y: number }
    testSize: { width: number; height: number }
    testMessage: string
    testDuration: number
    previewStyle: string
  }
  instructionEditor: {
    isOpen: boolean
    currentTemplate: InstructionTemplate | null
    isDirty: boolean
    validationErrors: string[]
  }
}
