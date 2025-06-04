import { contextBridge, ipcRenderer } from 'electron'

// Define the API that will be exposed to the renderer process
const electronAPI = {  // Screen capture
  getCaptureSource: () => ipcRenderer.invoke('get-capture-sources'),
  startScreenCapture: (sourceId: string) => ipcRenderer.invoke('start-screen-capture', sourceId),
  stopScreenCapture: () => ipcRenderer.invoke('stop-screen-capture'),
  captureFrame: () => ipcRenderer.invoke('capture-frame'),
  
  // Overlay management
  showOverlay: () => ipcRenderer.invoke('show-overlay'),
  hideOverlay: () => ipcRenderer.invoke('hide-overlay'),

  // Centralized state management
  stateGetCurrent: () => ipcRenderer.invoke('state-get-current'),
  stateGetGameDetection: () => ipcRenderer.invoke('state-get-game-detection'),
  stateGetGameState: () => ipcRenderer.invoke('state-get-game-state'),
  stateGetSettings: () => ipcRenderer.invoke('state-get-settings'),
  stateSetGameDetection: (detection: any) => ipcRenderer.invoke('state-set-game-detection', detection),
  stateSetGameState: (gameState: any) => ipcRenderer.invoke('state-set-game-state', gameState),
  stateSetAnalyzing: (analyzing: boolean) => ipcRenderer.invoke('state-set-analyzing', analyzing),
  stateSetLastAnalysis: (analysis: any) => ipcRenderer.invoke('state-set-last-analysis', analysis),
  stateSetSettings: (settings: any) => ipcRenderer.invoke('state-set-settings', settings),
  stateSetOverlayVisible: (visible: boolean) => ipcRenderer.invoke('state-set-overlay-visible', visible),
  stateUpdateBulk: (updates: any) => ipcRenderer.invoke('state-update-bulk', updates),

  // State change events
  onStateUpdated: (callback: (state: any) => void) => {
    const listener = (_event: any, state: any) => callback(state)
    ipcRenderer.on('state-updated', listener)
    return () => ipcRenderer.removeListener('state-updated', listener)
  },

  // Settings
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('load-settings'),

  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Game detection and templates
  detectRavenswatch: () => ipcRenderer.invoke('detect-ravenswatch'),
  loadGameTemplate: (gameName: string) => ipcRenderer.invoke('load-game-template', gameName),

  // LLM analysis
  analyzeFrame: (frameData: any, analysisRequest: any) => ipcRenderer.invoke('analyze-frame', frameData, analysisRequest),

  // IPC event listeners
  onScreenCaptureFrame: (callback: (frame: any) => void) => {
    ipcRenderer.on('screen-capture-frame', (_event, frame) => callback(frame))
  },
  
  onAdviceReceived: (callback: (advice: any) => void) => {
    ipcRenderer.on('advice-received', (_event, advice) => callback(advice))
  },

  onGameDetected: (callback: (gameInfo: any) => void) => {
    ipcRenderer.on('game-detected', (_event, gameInfo) => callback(gameInfo))
  },
  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  }
}

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// TypeScript declaration for the exposed API
export type ElectronAPI = typeof electronAPI
