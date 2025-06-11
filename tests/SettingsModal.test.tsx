// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import SettingsModal from '../src/renderer/components/SettingsModal'

vi.mock('../src/renderer/components/instructions/InstructionTemplate', () => ({
  default: () => <div>InstructionTemplate</div>
}))
vi.mock('../src/renderer/components/overlay-testing/OverlayTestSuite', () => ({
  default: () => <div>OverlayTestSuite</div>
}))

const mockUseStore = vi.fn()
vi.mock('../src/renderer/stores/sync-store', () => ({
  useSyncGameCoachStore: () => mockUseStore()
}))

const settings = {
  llmProvider: 'gemini',
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
  customInstructions: { systemPrompt: '', gameSpecificPrompts: {}, activeTemplate: '', enableVariableSubstitution: true, customTemplates: [] },
  captureSettings: { selectedSource: null, region: null, quality: 'medium', frameRate: 30, compression: 80, autoDetectGames: true },
  overlayTesting: { testPosition:{x:0,y:0}, testSize:{width:0,height:0}, testDuration:0, testStyle:{backgroundColor:'',textColor:'',fontSize:0,borderRadius:0,padding:0}, enableMultiMonitor:false, savedPositions:[] },
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

  it('renders overlay testing suite within overlay tab', () => {
    mockUseStore.mockReturnValue({
      settings,
      updateSettings: vi.fn(),
      isSettingsModalOpen: true,
      setSettingsModalOpen: vi.fn(),
      isLoading: false,
      error: null
    })

    render(<SettingsModal />)

    fireEvent.click(screen.getByText('Overlay'))
    expect(screen.getByText('OverlayTestSuite')).toBeInTheDocument()
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
