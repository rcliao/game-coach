// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import AnalysisEngine from '../src/renderer/components/AnalysisEngine'

var mockUseStore: any
var captureMock: any
vi.mock('../src/renderer/stores/sync-store', () => ({
  useSyncGameCoachStore: () => mockUseStore()
}))
vi.mock('../src/renderer/services/screen-capture-renderer', () => {
  captureMock = vi.fn(async () => Buffer.from('img'))
  return {
    rendererScreenCapture: {
      isCurrentlyCapturing: () => true,
      captureFrame: (...args: any[]) => captureMock(...args),
      startCapture: vi.fn(),
      stopCapture: vi.fn()
    }
  }
})

import { detectUrgentAdvice } from '../src/renderer/components/AnalysisEngine'

describe('detectUrgentAdvice', () => {
  it('returns true for urgent advice with high confidence', () => {
    expect(detectUrgentAdvice('Danger ahead, run now!', 0.9)).toBe(true)
  })

  it('returns false when confidence is low', () => {
    expect(detectUrgentAdvice('Danger ahead, run now!', 0.5)).toBe(false)
  })

  it('returns false when no urgent keywords', () => {
    expect(detectUrgentAdvice('Just explore the area', 0.9)).toBe(false)
  })
})

describe('AnalysisEngine prompt usage', () => {
  beforeEach(() => {
    mockUseStore = vi.fn()
    captureMock.mockClear()
  })

  it('calls analyzeGameplay with system instruction', async () => {
    const analyzeGameplay = vi.fn().mockResolvedValue({
      advice: 'ok',
      confidence: 1,
      provider: 'gemini',
      timestamp: Date.now(),
      analysisTime: 1
    })

    mockUseStore.mockReturnValue({
      llmService: { isReady: () => true, analyzeGameplay, getAvailableProviders: () => ['gemini'] },
      initializeLLMService: vi.fn(),
      selectedSourceId: 'src1',
      setCaptureActive: vi.fn(),
      setAnalyzing: vi.fn(),
      setLastAnalysis: vi.fn(),
      addAdvice: vi.fn(),
      settings: {
        geminiApiKey: '',
        systemInstruction: 'basic prompt',
        captureSourceId: 'src1',
        overlayEnabled: true,
        overlayOpacity: 1,
        overlayOffsetX: 20,
        overlayOffsetY: 20
      },
      setLastCaptureTime: vi.fn(),
      lastAnalysis: null,
      isAnalyzing: false
    })

    process.env.NODE_ENV = 'development'
    const screenClient = { getCaptureSources: vi.fn(), captureFrame: vi.fn().mockResolvedValue(undefined) }
    render(<AnalysisEngine isEnabled={false} screenSourceClient={screenClient as any} />)

    // debugTestLLM is attached to window in development mode
    await act(async () => {
      await (window as any).debugTestLLM()
    })

    expect(analyzeGameplay).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: 'basic prompt' })
    )
  })
})
