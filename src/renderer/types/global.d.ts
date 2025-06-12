// Global type declarations for the renderer process

declare global {
  interface Window {
    electronAPI: {
      // Screen capture
      getCaptureSource: () => Promise<any[]>
      startScreenCapture: (sourceId: string) => Promise<boolean>
      stopScreenCapture: () => Promise<boolean>
      captureFrame: () => Promise<any>

      // Overlay management
      showOverlay: () => Promise<void>
      hideOverlay: () => Promise<void>

      // Centralized state management
      stateGetCurrent: () => Promise<any>
      stateGetGameState: () => Promise<any>
      stateGetSettings: () => Promise<any>
      stateSetGameState: (gameState: any) => Promise<{success: boolean}>
      stateSetAnalyzing: (analyzing: boolean) => Promise<{success: boolean}>
      stateSetLastAnalysis: (analysis: any) => Promise<{success: boolean}>
      stateSetSettings: (settings: any) => Promise<{success: boolean}>
      stateSetOverlayVisible: (visible: boolean) => Promise<{success: boolean}>
      stateUpdateBulk: (updates: any) => Promise<{success: boolean}>

      // State change events
      onStateUpdated: (callback: (state: any) => void) => () => void

      // Settings
      saveSettings: (settings: any) => Promise<boolean>
      loadSettings: () => Promise<any>

      // App info
      getAppVersion: () => Promise<string>

      // Game templates
      loadGameTemplate: (gameName: string) => Promise<any>

      // LLM analysis
      analyzeFrame: (frameData: any, analysisRequest: any) => Promise<any>

      // IPC event listeners
      onScreenCaptureFrame: (callback: (frame: any) => void) => void
      onAdviceReceived: (callback: (advice: any) => void) => void
      removeAllListeners: (channel: string) => void
    }
  }
}

export {}
