import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScreenCaptureService } from '../src/main/screen-capture'

vi.mock('electron', () => ({
  desktopCapturer: {
    getSources: vi.fn()
  }
}))

vi.mock('fs', () => ({
  writeFileSync: vi.fn()
}))

import { desktopCapturer } from 'electron'
import { writeFileSync } from 'fs'

const mockSources = [
  { id: '1', name: 'Window 1', thumbnail: { toDataURL: () => 'data1' } },
  { id: '2', name: 'Window 2', thumbnail: { toDataURL: () => 'data2' } }
]

beforeEach(() => {
  vi.clearAllMocks()
  ;(desktopCapturer.getSources as any).mockResolvedValue(mockSources)
})

describe('ScreenCaptureService', () => {
  it('maps available sources', async () => {
    const service = new ScreenCaptureService()
    const result = await service.getAvailableSources()
    expect(desktopCapturer.getSources).toHaveBeenCalled()
    expect(result[0]).toEqual({ id: '1', name: 'Window 1', thumbnail: 'data1' })
  })

  it('tracks capture state', async () => {
    const service = new ScreenCaptureService()
    await service.startCapture('abc')
    expect(service.isCurrentlyCapturing()).toBe(true)
    expect(service.getCurrentSourceId()).toBe('abc')
    await service.stopCapture()
    expect(service.isCurrentlyCapturing()).toBe(false)
    expect(service.getCurrentSourceId()).toBeNull()
  })

  it('saves frame to disk', async () => {
    const service = new ScreenCaptureService()
    const path = await service.saveFrameForAnalysis(Buffer.from('hello'))
    expect(writeFileSync).toHaveBeenCalled()
    expect(path).toContain('frame_')
  })
})
