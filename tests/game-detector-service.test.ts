//@vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { GameDetectorService } from '../src/renderer/services/game-detector'

const createApi = (sources: any[]) => ({
  getCaptureSource: vi.fn().mockResolvedValue(sources)
})

describe('GameDetectorService', () => {
  it('detects game from capture sources', async () => {
    const api = createApi([{ id: '1', name: 'Ravenswatch' }])
    const service = new GameDetectorService(api)
    const res = await service.manualDetection()
    expect(api.getCaptureSource).toHaveBeenCalled()
    expect(res.isGameRunning).toBe(true)
  })

  it('returns not running when sources empty', async () => {
    const api = createApi([])
    const service = new GameDetectorService(api)
    const res = await service.manualDetection()
    expect(res.isGameRunning).toBe(false)
  })
})
