import { describe, it, expect } from 'vitest'
import { ImageProcessor } from '../src/main/image-processor'

const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/5+BFwAI/wObmeUAAAAASUVORK5CYII='
const sampleBuffer = Buffer.from(pngBase64, 'base64')

const processor = new ImageProcessor()

describe('ImageProcessor', () => {
  it('processFrame returns resized buffer', async () => {
    const out = await processor.processFrame(sampleBuffer, { width: 2, height: 2 })
    expect(out.length).toBeGreaterThan(0)
    expect(out).not.toEqual(sampleBuffer)
  })

  it('cropRegion returns buffer of region', async () => {
    const out = await processor.cropRegion(sampleBuffer, 0, 0, 1, 1)
    expect(out.length).toBeGreaterThan(0)
  })

  it('getImageInfo returns metadata', async () => {
    const info = await processor.getImageInfo(sampleBuffer)
    expect(info.width).toBeGreaterThan(0)
    expect(info.height).toBeGreaterThan(0)
    expect(info.size).toBe(sampleBuffer.length)
  })
})
