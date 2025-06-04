// Type definitions for the renderer process
export * from '@shared/types'

// Additional renderer-specific types
export interface UIState {
  isLoading: boolean
  error: string | null
  isSettingsModalOpen: boolean
  isOverlayVisible: boolean
}

export interface ScreenCaptureState {
  sources: ScreenSource[]
  selectedSourceId: string | null
  isCapturing: boolean
}

// Component prop types
export interface ConfigPanelProps {
  className?: string
}

export interface GameOverlayProps {
  position?: { x: number; y: number }
  size?: { width: number; height: number }
}

export interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export interface AdviceDisplayProps {
  advice: Advice
  onDismiss: () => void
  autoHide?: boolean
  autoHideDelay?: number
}

// Store types
export interface StoreActions {
  // Settings
  updateSettings: (settings: Partial<AppSettings>) => void
  loadSettings: () => Promise<void>
  saveSettings: () => Promise<void>
  
  // Screen capture
  loadScreenSources: () => Promise<void>
  setSelectedSource: (sourceId: string) => void
  
  // Game state
  updateGameState: (state: Partial<GameState>) => void
    // Advice
  addAdvice: (advice: Advice) => void
  clearAdviceHistory: () => void
  
  // UI
  setSettingsModalOpen: (open: boolean) => void
  setOverlayVisible: (visible: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}
