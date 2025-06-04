// Application constants

export const APP_CONFIG = {
  name: 'Ravenswatch Game Coach',
  version: '0.1.0',
  author: 'Eric',
} as const

export const CAPTURE_CONFIG = {
  defaultWidth: 1280,
  defaultHeight: 720,
  targetFPS: 30,
  jpegQuality: 80,
  maxFrameSize: 1024 * 1024, // 1MB
} as const

export const LLM_CONFIG = {
  maxTokens: 150,
  temperature: 0.3,
  adviceRateLimit: 5000, // 5 seconds in ms
  confidenceThreshold: 0.7,
} as const

export const OVERLAY_CONFIG = {
  defaultWidth: 300,
  defaultHeight: 150,
  autoHideDelay: 5000, // 5 seconds
  maxAdviceLength: 200,
} as const

export const GAME_CONFIG = {
  ravenswatch: {
    processName: 'Ravenswatch.exe',
    windowTitle: 'Ravenswatch',
    hudRegions: {
      health: { x: 50, y: 50, width: 200, height: 50 },
      mana: { x: 50, y: 100, width: 200, height: 30 },
      inventory: { x: 1100, y: 600, width: 180, height: 180 },
      minimap: { x: 1150, y: 50, width: 130, height: 130 },
    },
  },
} as const

export const API_ENDPOINTS = {
  openai: {
    chat: 'https://api.openai.com/v1/chat/completions',
    tts: 'https://api.openai.com/v1/audio/speech',
  },
  gemini: {
    chat: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent',
  },
} as const

export const ERROR_MESSAGES = {
  noApiKey: 'API key is required. Please configure it in settings.',
  captureError: 'Failed to capture screen. Please try selecting a different source.',
  llmError: 'Failed to get advice from AI. Please check your internet connection.',
  gameNotDetected: 'Ravenswatch is not currently running or detected.',
} as const
