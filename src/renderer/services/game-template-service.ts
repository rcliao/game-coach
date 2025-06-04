// Game template loading service
import type { HUDRegion } from '@shared/types'

export interface RavenswatchTemplate {
  gameInfo: {
    name: string
    processName: string
    windowTitle: string
    genre: string
    developer: string
  }
  hudRegions: Record<string, HUDRegion>
  analysisPrompts: {
    tactical: string
    strategic: string
    immediate: string
  }
  gameplayContext: {
    characterClasses: string[]
    enemyTypes: string[]
    itemCategories: string[]
    statusEffects: string[]
  }
}

export class GameTemplateService {
  private ravenswatchTemplate: RavenswatchTemplate | null = null

  public async loadRavenswatchTemplate(): Promise<RavenswatchTemplate> {
    if (this.ravenswatchTemplate) {
      return this.ravenswatchTemplate
    }

    try {
      // Load template from main process
      const template = await window.electronAPI.loadGameTemplate('ravenswatch')
      this.ravenswatchTemplate = template
      return template
    } catch (error) {
      console.error('Failed to load Ravenswatch template:', error)
      
      // Return default template if loading fails
      return this.getDefaultRavenswatchTemplate()
    }
  }

  public async getHUDRegions(): Promise<HUDRegion[]> {
    const template = await this.loadRavenswatchTemplate()
    return Object.values(template.hudRegions)
  }

  public async getAnalysisPrompt(type: 'tactical' | 'strategic' | 'immediate'): Promise<string> {
    const template = await this.loadRavenswatchTemplate()
    return template.analysisPrompts[type] || template.analysisPrompts.tactical
  }

  public async getGameplayContext(): Promise<RavenswatchTemplate['gameplayContext']> {
    const template = await this.loadRavenswatchTemplate()
    return template.gameplayContext
  }

  private getDefaultRavenswatchTemplate(): RavenswatchTemplate {
    return {
      gameInfo: {
        name: 'Ravenswatch',
        processName: 'Ravenswatch.exe',
        windowTitle: 'Ravenswatch',
        genre: 'action-rpg',
        developer: 'Passtech Games'
      },
      hudRegions: {
        health: {
          name: 'health',
          coordinates: { x: 50, y: 50, width: 200, height: 50 },
          priority: 'high',
          analysisType: 'status'
        },
        mana: {
          name: 'mana',
          coordinates: { x: 50, y: 100, width: 200, height: 30 },
          priority: 'medium',
          analysisType: 'status'
        },
        inventory: {
          name: 'inventory',
          coordinates: { x: 1100, y: 600, width: 180, height: 180 },
          priority: 'low',
          analysisType: 'items'
        },
        minimap: {
          name: 'minimap',
          coordinates: { x: 1150, y: 50, width: 130, height: 130 },
          priority: 'low',
          analysisType: 'navigation'
        }
      },
      analysisPrompts: {
        tactical: 'Analyze this Ravenswatch gameplay screenshot for immediate tactical advice. Focus on enemy positioning, health status, ability cooldowns, and immediate threats.',
        strategic: 'Analyze this Ravenswatch gameplay screenshot for strategic advice. Focus on positioning, resource management, and medium-term tactical planning.',
        immediate: 'Analyze this Ravenswatch gameplay screenshot for urgent advice needed in the next 5 seconds. Focus on immediate threats and critical actions.'
      },
      gameplayContext: {
        characterClasses: ['Snowgirl', 'Little Red Riding Hood', 'Beowulf', 'The Pied Piper', 'Scarlet', 'Geppetto'],
        enemyTypes: ['Goblins', 'Wolves', 'Spiders', 'Bosses', 'Elite enemies'],
        itemCategories: ['Weapons', 'Artifacts', 'Consumables', 'Resources'],
        statusEffects: ['Poison', 'Burn', 'Freeze', 'Stun', 'Invulnerability']
      }
    }
  }
}

// Export singleton instance
export const gameTemplateService = new GameTemplateService()
