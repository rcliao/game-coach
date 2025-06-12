// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import GameOverlay from '../src/renderer/components/GameOverlay'

const mockUseStore = vi.fn()
vi.mock('../src/renderer/stores/sync-store', () => ({
  useSyncGameCoachStore: () => mockUseStore()
}))

const baseSettings = {
  overlayEnabled: true,
  overlayOpacity: 1,
  geminiApiKey: '',
  systemInstruction: '',
  captureSourceId: null,
}

describe('GameOverlay component', () => {
  it('returns null when overlay not visible', () => {
    mockUseStore.mockReturnValue({
      isOverlayVisible: false,
      lastAnalysis: null,
      isAnalyzing: false,
      settings: baseSettings
    })
    const { container } = render(<GameOverlay />)
    expect(container.firstChild).toBeNull()
  })

  it('shows advice when visible with analysis', () => {
    mockUseStore.mockReturnValue({
      isOverlayVisible: true,
      lastAnalysis: { advice: 'Stay safe', confidence: 0.8, provider: 'test', analysisTime: 100 },
      isAnalyzing: true,
      settings: baseSettings
    })
    render(<GameOverlay />)
    expect(screen.getByText('Stay safe')).toBeInTheDocument()
    expect(screen.getByText(/AI Coach/i)).toBeInTheDocument()
  })
})
