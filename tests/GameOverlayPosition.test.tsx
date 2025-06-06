// @vitest-environment jsdom
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import GameOverlay from '../src/renderer/components/GameOverlay'

const mockUseStore = vi.fn()
vi.mock('../src/renderer/stores/sync-store', () => ({
  useSyncGameCoachStore: () => mockUseStore()
}))

const baseSettings = {
  overlayEnabled: true,
  overlayTheme: 'dark',
  overlaySize: 'medium',
  overlayOpacity: 1,
  showConfidenceScore: true,
  autoHideDelay: 5,
  overlayPosition: { x: 0, y: 0 }
}

describe('GameOverlay positioning', () => {
  it('applies overlayPosition.y to overlay style', () => {
    mockUseStore.mockReturnValue({
      isOverlayVisible: true,
      lastAnalysis: { advice: 'test', confidence: 0.9, provider: 'test', analysisTime: 10 },
      isAnalyzing: false,
      gameDetection: { isGameRunning: true },
      settings: { ...baseSettings, overlayPosition: { x: 0, y: 100 } }
    })

    const { container } = render(<GameOverlay />)
    const overlay = container.querySelector('.animate-slideInRight') as HTMLElement
    expect(overlay).toHaveStyle('top: 100px')
  })
})
