// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'

vi.mock('../src/renderer/services/tts-service', () => ({ ttsService: {} }))
vi.mock('../src/renderer/services/screen-capture-renderer', () => ({ rendererScreenCapture: {} }))
vi.mock('../src/renderer/services/game-template-service', () => ({ gameTemplateService: {} }))

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
