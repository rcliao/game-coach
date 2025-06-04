import React, { useState } from 'react'
import type { InstructionTemplate } from '@shared/types'
import { instructionTemplateService } from '../../services/instruction-template-service'

interface VariableSubstitutionProps {
  template: InstructionTemplate
  gameContext?: string
  hudElements?: string
  playerStatus?: string
  onPreviewUpdate?: (preview: string) => void
}

const VariableSubstitution: React.FC<VariableSubstitutionProps> = ({
  template,
  gameContext = '',
  hudElements = '',
  playerStatus = '',
  onPreviewUpdate
}) => {  const [variables, setVariables] = useState<Record<string, string>>({
    gameContext: gameContext || 'Current game situation and environment',
    hudElements: hudElements || 'Health, mana, abilities, and other UI elements',
    playerStatus: playerStatus || 'Player position, status, and current actions'
  })
  const updateVariable = (key: string, value: string) => {
    const updatedVariables = { ...variables, [key]: value }
    setVariables(updatedVariables)
    
    // Generate preview with updated variables
    if (onPreviewUpdate) {
      const preview = instructionTemplateService.substituteVariables(template, updatedVariables)
      onPreviewUpdate(preview)
    }
  }

  const getSubstitutedPrompt = () => {
    return instructionTemplateService.substituteVariables(template, variables)
  }

  const resetToDefaults = () => {
    const defaultVars: Record<string, string> = {
      gameContext: 'Current game situation and environment',
      hudElements: 'Health, mana, abilities, and other UI elements',
      playerStatus: 'Player position, status, and current actions'
    }
    setVariables(defaultVars)
    
    if (onPreviewUpdate) {
      const preview = instructionTemplateService.substituteVariables(template, defaultVars)
      onPreviewUpdate(preview)
    }
  }

  const loadSampleScenario = (scenario: 'combat' | 'exploration' | 'lowhealth') => {
    let sampleVars: Record<string, string> = { ...variables }
    
    switch (scenario) {
      case 'combat':
        sampleVars = {
          gameContext: 'Intense combat with multiple enemies in a narrow corridor',
          hudElements: 'Health: 60%, Mana: 80%, Ultimate ready, 2 enemies visible',
          playerStatus: 'Taking damage, abilities on cooldown, retreating'
        }
        break
      case 'exploration':
        sampleVars = {
          gameContext: 'Quiet forest area with hidden paths and collectibles',
          hudElements: 'Health: 100%, Mana: 90%, No immediate threats',
          playerStatus: 'Moving slowly, investigating surroundings'
        }
        break
      case 'lowhealth':
        sampleVars = {
          gameContext: 'Boss fight in final phase, arena filled with hazards',
          hudElements: 'Health: 15%, Mana: 30%, Boss at 25% health',
          playerStatus: 'Critical health, avoiding attacks, looking for opening'
        }
        break
    }
    
    setVariables(sampleVars)
    if (onPreviewUpdate) {
      const preview = instructionTemplateService.substituteVariables(template, sampleVars)
      onPreviewUpdate(preview)
    }
  }
  // Extract variables used in the template
  const templateVariables = Object.keys(template.variables || {})
  const usedVariables = templateVariables.filter(varName => 
    template.systemPrompt.includes(`\${${varName}}`)
  )

  // Also check for common variables that might be used even if not defined in template.variables
  const commonVariables = ['gameContext', 'hudElements', 'playerStatus']
  const allUsedVariables = [...new Set([...usedVariables, ...commonVariables.filter(varName => 
    template.systemPrompt.includes(`\${${varName}}`)
  )])]
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-white font-medium">Variable Substitution</h4>
        <div className="flex space-x-3">
          <button
            onClick={resetToDefaults}
            className="btn-secondary text-sm"
          >
            Reset
          </button>
          <div className="relative">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  loadSampleScenario(e.target.value as any)
                  e.target.value = '' // Reset select
                }
              }}
              className="btn-secondary text-sm bg-gray-700 border border-gray-600"
            >
              <option value="">Load Sample...</option>
              <option value="combat">Combat Scenario</option>
              <option value="exploration">Exploration Scenario</option>
              <option value="lowhealth">Low Health Scenario</option>
            </select>
          </div>
        </div>
      </div>      {/* Variable Inputs */}
      <div className="space-y-4">
        {allUsedVariables.length > 0 ? (
          allUsedVariables.map(varName => (
            <div key={varName}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ${varName}
                <span className="text-gray-400 ml-2 text-xs">
                  {template.variables?.[varName] || 'Dynamic game variable'}
                </span>
              </label>
              <textarea
                value={variables[varName] || ''}
                onChange={(e) => updateVariable(varName, e.target.value)}
                className="w-full h-20 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
                placeholder={template.variables?.[varName] || `Enter ${varName} context`}
              />
            </div>
          ))
        ) : (
          <div className="text-gray-400 text-sm">
            No variables used in this template.
          </div>
        )}
      </div>

      {/* Live Preview */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h5 className="text-gray-300 font-medium mb-2 text-sm">Live Preview</h5>
        <div className="bg-gray-900 rounded-md p-3 text-gray-100 text-sm whitespace-pre-wrap font-mono">
          {getSubstitutedPrompt()}
        </div>
      </div>      {/* Variable Usage Stats */}
      {allUsedVariables.length > 0 && (
        <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
          <h5 className="text-blue-400 text-sm font-medium mb-2">Variable Usage</h5>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {allUsedVariables.map(varName => {
              const isUsed = template.systemPrompt.includes(`\${${varName}}`)
              return (
                <div
                  key={varName}
                  className={`flex items-center space-x-2 ${
                    isUsed ? 'text-green-400' : 'text-gray-400'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    isUsed ? 'bg-green-400' : 'bg-gray-400'
                  }`} />
                  <span>${varName}</span>
                  {!isUsed && <span className="text-xs">(unused)</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="text-xs text-gray-400 space-y-1">
        <p><strong>Tips:</strong></p>
        <ul className="space-y-1 ml-4">
          <li>• Variables are substituted in real-time during gameplay</li>
          <li>• Keep variable content concise for better AI responses</li>
          <li>• Use specific, actionable information in variables</li>
          <li>• Test different scenarios to ensure robust responses</li>
        </ul>
      </div>
    </div>
  )
}

export default VariableSubstitution
