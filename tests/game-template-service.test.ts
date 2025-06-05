// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { GameTemplateService } from '../src/renderer/services/game-template-service'

const sampleTemplate = {
  gameInfo: { name: 'R', processName: 'r.exe', windowTitle: 'R', genre: 'g', developer: 'd' },
  hudRegions: {},
  analysisPrompts: { tactical: 'tac', strategic: 'str', immediate: 'imm' },
  gameplayContext: { characterClasses: [], enemyTypes: [], itemCategories: [], statusEffects: [] }
}

beforeAll(() => {
  ;(window as any).electronAPI = {
    loadGameTemplate: vi.fn().mockResolvedValue(sampleTemplate)
  }
})

describe('GameTemplateService', () => {
  it('loads template from electron API', async () => {
    const svc = new GameTemplateService()
    const tpl = await svc.loadRavenswatchTemplate()
    expect(tpl.gameInfo.name).toBe('R')
  })

  it('returns default when load fails', async () => {
    const svc = new GameTemplateService()
    ;(window as any).electronAPI.loadGameTemplate.mockRejectedValueOnce(new Error('fail'))
    const tpl = await svc.loadRavenswatchTemplate()
    expect(tpl.gameInfo.name).toBe('Ravenswatch')
  })
})
