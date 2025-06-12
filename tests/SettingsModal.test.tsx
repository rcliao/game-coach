// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import SettingsModal from '../src/renderer/components/SettingsModal'

const mockUseStore = vi.fn()
vi.mock('../src/renderer/stores/sync-store', () => ({
  useSyncGameCoachStore: () => mockUseStore()
}))

const settings = {
  geminiApiKey: '',
  systemInstruction: '',
  captureSourceId: null,
  overlayEnabled: true,
  overlayOpacity: 1
}

const client = {
  getCaptureSources: vi.fn().mockResolvedValue([])
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
    const { container } = render(<SettingsModal screenSourceClient={client} />)
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

    render(<SettingsModal screenSourceClient={client} />)
    fireEvent.click(screen.getAllByText('Cancel')[0])
    expect(setSettingsModalOpen).toHaveBeenCalledWith(false)
  })

  it('renders basic fields when open', async () => {
    mockUseStore.mockReturnValue({
      settings,
      updateSettings: vi.fn(),
      isSettingsModalOpen: true,
      setSettingsModalOpen: vi.fn(),
      isLoading: false,
      error: null
    })

    render(<SettingsModal screenSourceClient={client} />)

    await waitFor(() => expect(screen.getByText('Google Gemini API Key')).toBeInTheDocument())
    expect(screen.getByText('System Instructions')).toBeInTheDocument()
    expect(screen.getByText('Capture Source')).toBeInTheDocument()
    expect(screen.getByText('Enable Overlay')).toBeInTheDocument()
    expect(screen.getByText(/Overlay Opacity/)).toBeInTheDocument()
  })
})
