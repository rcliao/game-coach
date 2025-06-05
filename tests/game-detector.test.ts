import { describe, it, expect } from 'vitest'
import { GameDetectorService } from '../src/renderer/services/game-detector'
import type { ScreenCaptureAPI } from '../src/renderer/services/external-clients'

describe('GameDetectorService', () => {
  it('findGameInSources returns matching source', () => {
    const svc = new GameDetectorService()
    const match = (svc as any).findGameInSources([
      { id: '1', name: 'Ravenswatch Window' },
      { id: '2', name: 'Other' }
    ])
    expect(match?.id).toBe('1')
  })

  it('detectRavenswatch true when source found', async () => {
    const api: ScreenCaptureAPI = {
      getCaptureSource: vi.fn(async () => [{ id: '1', name: 'Ravenswatch' }])
    }
    const svc = new GameDetectorService(api)
    const result = await (svc as any).detectRavenswatch()
    expect(result.isGameRunning).toBe(true)
  })

  it('detectRavenswatch false when no source', async () => {
    const api: ScreenCaptureAPI = {
      getCaptureSource: vi.fn(async () => [{ id: '1', name: 'Other' }])
    }
    const svc = new GameDetectorService(api)
    const result = await (svc as any).detectRavenswatch()
    expect(result.isGameRunning).toBe(false)
  })
})
