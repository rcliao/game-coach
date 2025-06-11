// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import GameOverlay from '../src/renderer/components/GameOverlay'

const mockUseStore = vi.fn()
vi.mock('../src/renderer/stores/sync-store', () => ({
  useSyncGameCoachStore: () => mockUseStore()
}))

const baseSettings = {
  geminiApiKey: '',
  systemInstruction: '',
  captureSourceId: null,
  overlayEnabled: true,
  overlayOpacity: 1,
  overlayPosition: { x: 0, y: 0 }
}

describe('GameOverlay component', () => {
  it('returns null when overlay not visible', () => {
    mockUseStore.mockReturnValue({
      isOverlayVisible: false,
      lastAnalysis: null,
      isAnalyzing: false,
      gameDetection: null,
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
      gameDetection: { isGameRunning: true },
      settings: baseSettings
    })
    render(<GameOverlay />)
    expect(screen.getByText('Stay safe')).toBeInTheDocument()
    expect(screen.getByText(/AI Coach/i)).toBeInTheDocument()
  })
})
