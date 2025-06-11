// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import SettingsModal from '../src/renderer/components/SettingsModal'


const mockUseStore = vi.fn()
vi.mock('../src/renderer/stores/sync-store', () => ({
  useSyncGameCoachStore: () => mockUseStore()
}))

const settings = {
  llmProvider: 'openai',
  openaiApiKey: '',
  geminiApiKey: '',
  overlayEnabled: true,
  ttsEnabled: false,
  adviceFrequency: 5,
  overlayPosition: { x: 0, y: 0 },
  ttsVoice: 'default',
  ttsSpeed: 1,
  ttsVolume: 1,
  ttsOnlyUrgent: false,
  overlayTheme: 'dark',
  overlaySize: 'medium',
  overlayOpacity: 1,
  showConfidenceScore: true,
  autoHideDelay: 5,
  frameProcessingQuality: 'medium',
  enableHUDRegionDetection: true,
  maxAdviceHistory: 10,
  captureSettings: { selectedSource: null, region: null, quality: 'medium', frameRate: 30, compression: 80, autoDetectGames: true },
  setupProgress:{ isComplete:false, completedSteps:[], setupStartTime:0, setupCompletionTime:0, firstSessionComplete:false }
}

describe('SettingsModal component', () => {
  it('does not render when closed', () => {
    mockUseStore.mockReturnValue({
      settings,
      updateSettings: vi.fn(),
      isSettingsModalOpen: false,
      setSettingsModalOpen: vi.fn(),
      isLoading: false,
      error: null
    })
    const { container } = render(<SettingsModal />)
    expect(container.firstChild).toBeNull()
  })

  it('calls setSettingsModalOpen(false) on cancel', () => {
    const setSettingsModalOpen = vi.fn()
    mockUseStore.mockReturnValue({
      settings,
      updateSettings: vi.fn(),
      isSettingsModalOpen: true,
      setSettingsModalOpen,
      isLoading: false,
      error: null
    })

    render(<SettingsModal />)
    fireEvent.click(screen.getAllByText('Cancel')[0])
    expect(setSettingsModalOpen).toHaveBeenCalledWith(false)
  })


  it('calls showOverlay when overlay control button clicked', () => {
    const showOverlay = vi.fn()
    mockUseStore.mockReturnValue({
      settings,
      updateSettings: vi.fn(),
      isSettingsModalOpen: true,
      setSettingsModalOpen: vi.fn(),
      isLoading: false,
      error: null,
      isOverlayVisible: false,
      showOverlay,
      hideOverlay: vi.fn(),
      setGameDetection: vi.fn(),
      setGameState: vi.fn(),
      setLastAnalysis: vi.fn(),
      setAnalyzing: vi.fn(),
    })

    render(<SettingsModal />)

    fireEvent.click(screen.getByText('Overlay'))
    fireEvent.click(screen.getByText('Show Overlay'))
    expect(showOverlay).toHaveBeenCalled()
  })
})
