import { describe, it, expect } from 'vitest'
import { GameDetectorService } from '../src/renderer/services/game-detector'

describe('GameDetectorService', () => {
  it('findGameInSources returns matching source', () => {
    const svc = new GameDetectorService()
    const match = (svc as any).findGameInSources([
      { id: '1', name: 'Ravenswatch Window' },
      { id: '2', name: 'Other' }
    ])
    expect(match?.id).toBe('1')
  })
})
