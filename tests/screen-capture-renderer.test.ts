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

  it('verifyCapture resolves true when frame captured', async () => {
    const svc = new RendererScreenCaptureService()
    // Manually setup capture state
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: () => ({ drawImage: vi.fn() }),
      configurable: true
    })
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 2
    const ctx = canvas.getContext('2d') as any

    const video = document.createElement('video')
    Object.defineProperty(video, 'videoWidth', { value: 2 })
    Object.defineProperty(video, 'videoHeight', { value: 2 })

    const { Blob } = require('buffer')
    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
      value: (cb: (blob: Blob) => void) =>
        cb(new Blob([new Uint8Array([1, 2, 3])])),
      configurable: true
    })

    ;(svc as any).canvas = canvas
    ;(svc as any).context = ctx
    ;(svc as any).video = video
    ;(svc as any).isCapturing = true

    const result = await svc.verifyCapture()
    expect(result).toBe(true)
  })

  it('verifyCapture returns false when not capturing', async () => {
    const svc = new RendererScreenCaptureService()
    const result = await svc.verifyCapture()
    expect(result).toBe(false)
  })
})
