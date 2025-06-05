// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RendererScreenCaptureService } from '../src/renderer/services/screen-capture-renderer'

describe('RendererScreenCaptureService', () => {
  beforeEach(() => {
    ;(navigator as any).mediaDevices = {
      getUserMedia: vi.fn()
    }
  })

  it('reports support when getUserMedia exists', () => {
    expect(RendererScreenCaptureService.isSupported()).toBe(true)
  })

  it('startCapture returns false on failure', async () => {
    ;(navigator.mediaDevices.getUserMedia as any).mockRejectedValue(new Error('fail'))
    const svc = new RendererScreenCaptureService()
    const result = await svc.startCapture('id1')
    expect(result).toBe(false)
  })
})
