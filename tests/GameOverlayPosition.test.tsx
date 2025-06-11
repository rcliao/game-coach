// @vitest-environment jsdom
import { render } from '@testing-library/react'
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

describe('GameOverlay positioning', () => {
  it('centers overlay content within the window', () => {
    mockUseStore.mockReturnValue({
      isOverlayVisible: true,
      lastAnalysis: { advice: 'test', confidence: 0.9, provider: 'test', analysisTime: 10 },
      isAnalyzing: false,
      gameDetection: { isGameRunning: true },
      settings: { ...baseSettings, overlayPosition: { x: 25, y: 75 } }
    })

    const { container } = render(<GameOverlay />)
    const root = container.firstChild as HTMLElement
    expect(root).toHaveClass('flex')
    expect(root).toHaveClass('items-center')
    expect(root).toHaveClass('justify-center')
  })
})
