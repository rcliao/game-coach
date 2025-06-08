// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ConfigPanel from '../src/renderer/components/ConfigPanel'
import { type ScreenSourceClient } from '../src/renderer/ipc/screen-source-client'

const mockUseStore = vi.fn()
vi.mock('../src/renderer/stores/sync-store', () => ({
  useSyncGameCoachStore: () => mockUseStore()
}))

beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('ConfigPanel component', () => {
  it('opens settings modal when settings button clicked', () => {
    const setSettingsModalOpen = vi.fn()
    const client: ScreenSourceClient = {
      getCaptureSources: vi.fn().mockResolvedValue([]),
    }
    mockUseStore.mockReturnValue({
      settings: { overlayEnabled: true, llmProvider: 'openai', openaiApiKey: 'k', geminiApiKey: '' },
      isAnalyzing: false,
      gameDetection: null,
      lastAnalysis: null,
      error: null,
      startGameDetection: vi.fn(),
      stopGameDetection: vi.fn(),
      setSettingsModalOpen,
      initializeLLMService: vi.fn(),
      setAnalyzing: vi.fn(),
      gameState: { isRavenswatchDetected: false },
      selectedSourceId: '1',
      setSelectedSource: vi.fn(),
      llmService: null,
    })

    render(<ConfigPanel screenSourceClient={client} />)

    const btn = screen.getByText('Settings')
    fireEvent.click(btn)
    expect(setSettingsModalOpen).toHaveBeenCalledWith(true)
  })
})
