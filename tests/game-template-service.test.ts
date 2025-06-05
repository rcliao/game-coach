// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { GameTemplateService } from '../src/renderer/services/game-template-service'
import { type TemplateClient } from '../src/renderer/ipc/template-client'

const sampleTemplate = {
  gameInfo: { name: 'R', processName: 'r.exe', windowTitle: 'R', genre: 'g', developer: 'd' },
  hudRegions: {},
  analysisPrompts: { tactical: 'tac', strategic: 'str', immediate: 'imm' },
  gameplayContext: { characterClasses: [], enemyTypes: [], itemCategories: [], statusEffects: [] }
}

beforeAll(() => {})

describe('GameTemplateService', () => {
  it('loads template from client', async () => {
    const client: TemplateClient = {
      loadGameTemplate: vi.fn().mockResolvedValue(sampleTemplate),
    }
    const svc = new GameTemplateService(client)
    const tpl = await svc.loadRavenswatchTemplate()
    expect(tpl.gameInfo.name).toBe('R')
  })

  it('returns default when load fails', async () => {
    const client: TemplateClient = {
      loadGameTemplate: vi.fn().mockRejectedValue(new Error('fail')),
    }
    const svc = new GameTemplateService(client)
    const tpl = await svc.loadRavenswatchTemplate()
    expect(tpl.gameInfo.name).toBe('Ravenswatch')
  })
})
