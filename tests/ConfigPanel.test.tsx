// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ConfigPanel from '../src/renderer/components/ConfigPanel'

const mockUseStore = vi.fn()
vi.mock('../src/renderer/stores/sync-store', () => ({
  useSyncGameCoachStore: () => mockUseStore()
}))

beforeAll(() => {
  (window as any).electronAPI = {
    getCaptureSource: vi.fn().mockResolvedValue([])
  }
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('ConfigPanel component', () => {
  it('calls showOverlay when button clicked', () => {
    const showOverlay = vi.fn()
    mockUseStore.mockReturnValue({
      settings: { overlayEnabled: true, llmProvider: 'openai', openaiApiKey: 'k', geminiApiKey: '' },
      isAnalyzing: false,
      gameDetection: null,
      lastAnalysis: null,
      error: null,
      startGameDetection: vi.fn(),
      stopGameDetection: vi.fn(),
      setSettingsModalOpen: vi.fn(),
      initializeLLMService: vi.fn(),
      setAnalyzing: vi.fn(),
      gameState: { isRavenswatchDetected: false },
      isOverlayVisible: false,
      showOverlay,
      hideOverlay: vi.fn(),
      updateSettings: vi.fn(),
      setGameDetection: vi.fn(),
      setGameState: vi.fn(),
      setLastAnalysis: vi.fn(),
      selectedSourceId: '1',
      setSelectedSource: vi.fn(),
      llmService: null,
    })

    render(<ConfigPanel />)

    const btn = screen.getByText('Show Overlay')
    fireEvent.click(btn)
    expect(showOverlay).toHaveBeenCalled()
  })
})
