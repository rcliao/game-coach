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
  overlayOffsetX: 20,
  overlayOffsetY: 20,
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
    const { container } = render(<GameOverlay />)
    expect(screen.getByText('Stay safe')).toBeInTheDocument()
    expect(screen.getByText(/AI Coach/i)).toBeInTheDocument()
    const overlay = container.firstChild as HTMLElement
    expect(overlay.style.top).toBe(`${baseSettings.overlayOffsetY}px`)
    expect(overlay.style.right).toBe(`${baseSettings.overlayOffsetX}px`)
  })
})
