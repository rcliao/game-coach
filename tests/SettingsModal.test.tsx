// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import SettingsModal from '../src/renderer/components/SettingsModal'

vi.mock('../src/renderer/components/instructions/InstructionTemplate', () => ({
  default: () => <div>InstructionTemplate</div>
}))

const mockUseStore = vi.fn()
vi.mock('../src/renderer/stores/sync-store', () => ({
  useSyncGameCoachStore: () => mockUseStore()
}))

const settings = {
  geminiApiKey: '',
  systemInstruction: '',
  captureSourceId: null,
  overlayEnabled: true,
  overlayOpacity: 1,
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
