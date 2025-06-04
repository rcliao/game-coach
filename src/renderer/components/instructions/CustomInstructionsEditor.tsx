import React, { useState, useEffect } from 'react'
import type { InstructionTemplate } from '@shared/types'
import { instructionTemplateService } from '../../services/instruction-template-service'

interface CustomInstructionsEditorProps {
  template: InstructionTemplate | null
  onTemplateChange: (template: InstructionTemplate) => void
  onSave: (template: InstructionTemplate) => void
  onCancel: () => void
}

const CustomInstructionsEditor: React.FC<CustomInstructionsEditorProps> = ({
  template,
  onTemplateChange,
  onSave,
  onCancel
}) => {
  const [localTemplate, setLocalTemplate] = useState<Partial<InstructionTemplate>>({
    id: '',
    name: '',
    description: '',
    systemPrompt: '',
    variables: {},
    category: 'general',
    isBuiltIn: false
  })
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (template) {
      setLocalTemplate(template)
    } else {
      // Reset for new template
      setLocalTemplate({
        id: `custom-${Date.now()}`,
        name: '',
        description: '',
        systemPrompt: '',
        variables: {
          gameContext: 'Current game situation and environment',
          hudElements: 'Visible HUD information like health, mana, cooldowns',
          playerStatus: 'Player\'s current state, position, and resources'
        },
        category: 'general',
        isBuiltIn: false
      })
    }
    setValidationErrors([])
  }, [template])

  const handleFieldChange = (field: keyof InstructionTemplate, value: any) => {
    const updated = { ...localTemplate, [field]: value }
    setLocalTemplate(updated)
    
    // Clear validation errors when user makes changes
    if (validationErrors.length > 0) {
      setValidationErrors([])
    }
    
    if (updated.id && updated.name && updated.systemPrompt && updated.category) {
      onTemplateChange(updated as InstructionTemplate)
    }
  }

  const handleVariableChange = (key: string, value: string) => {
    const updatedVariables = { ...localTemplate.variables, [key]: value }
    handleFieldChange('variables', updatedVariables)
  }

  const addVariable = () => {
    const newKey = `variable${Object.keys(localTemplate.variables || {}).length + 1}`
    handleVariableChange(newKey, 'Description of the variable')
  }

  const removeVariable = (key: string) => {
    const updatedVariables = { ...localTemplate.variables }
    delete updatedVariables[key]
    handleFieldChange('variables', updatedVariables)
  }

  const handleSave = () => {
    const errors = instructionTemplateService.validateTemplate(localTemplate)
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    onSave(localTemplate as InstructionTemplate)
  }
  const getPreviewPrompt = () => {
    if (!localTemplate.systemPrompt || localTemplate.systemPrompt.trim() === '') {
      return 'Enter a system prompt to see preview...'
    }
    
    try {
      const sampleVariables = {
        gameContext: 'Player is in a dark forest area with enemies nearby',
        hudElements: 'Health: 75%, Mana: 50%, Ability cooldowns: 3s, 5s',
        playerStatus: 'Standing near a tree, low on mana, enemies approaching'
      }

      return instructionTemplateService.substituteVariables(
        localTemplate as InstructionTemplate,
        sampleVariables
      )
    } catch (error) {
      console.warn('Error generating preview:', error)
      return 'Error generating preview. Check your template syntax.'
    }
  }
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">
          {template ? 'Edit Template' : 'Create New Template'}
        </h3>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn-secondary text-sm"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary">
            Save Template
          </button>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
          <h4 className="text-red-400 font-medium mb-2">Validation Errors:</h4>
          <ul className="text-red-300 text-sm space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor Panel */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-700 rounded-lg p-4 space-y-4">
            <h4 className="text-white font-medium">Template Information</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={localTemplate.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="e.g., Combat Specialist"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <input
                type="text"
                value={localTemplate.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Brief description of what this template does"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                value={localTemplate.category || 'general'}
                onChange={(e) => handleFieldChange('category', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="general">General</option>
                <option value="combat">Combat</option>
                <option value="exploration">Exploration</option>
                <option value="speedrun">Speedrun</option>
              </select>
            </div>
          </div>

          {/* System Prompt */}
          <div className="bg-gray-700 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              System Prompt
            </label>            <p className="text-xs text-gray-400 mb-2">
              This is the core instruction that will guide the AI's responses. Use variables like ${'${gameContext}'} for dynamic content.
            </p>
            <textarea
              value={localTemplate.systemPrompt || ''}
              onChange={(e) => handleFieldChange('systemPrompt', e.target.value)}
              placeholder="You are an expert gaming coach..."
              className="w-full h-32 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <div className="mt-2 text-xs text-gray-400">
              {localTemplate.systemPrompt?.length || 0}/1000 characters
            </div>
          </div>

          {/* Variables */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-medium">Variables</h4>
              <button onClick={addVariable} className="btn-secondary text-sm">
                Add Variable
              </button>
            </div>
            
            <div className="space-y-3">
              {Object.entries(localTemplate.variables || {}).map(([key, value]) => (
                <div key={key} className="flex space-x-2">
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => {
                      const newKey = e.target.value
                      const updatedVariables = { ...localTemplate.variables }
                      delete updatedVariables[key]
                      updatedVariables[newKey] = value
                      handleFieldChange('variables', updatedVariables)
                    }}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="variableName"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleVariableChange(key, e.target.value)}
                    className="flex-2 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Variable description"
                  />
                  <button
                    onClick={() => removeVariable(key)}
                    className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
              
              {Object.keys(localTemplate.variables || {}).length === 0 && (
                <p className="text-gray-400 text-sm">No variables defined. Click "Add Variable" to create one.</p>
              )}
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="space-y-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-medium mb-4">Live Preview</h4>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <h5 className="text-gray-300 text-sm font-medium mb-2">Sample Output:</h5>
                <div className="text-gray-100 text-sm whitespace-pre-wrap">
                  {getPreviewPrompt() || 'Enter a system prompt to see preview...'}
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-400">
                <p><strong>Sample Variables Used:</strong></p>
                <ul className="mt-2 space-y-1">
                  <li>• gameContext: "Player is in a dark forest area with enemies nearby"</li>
                  <li>• hudElements: "Health: 75%, Mana: 50%, Ability cooldowns: 3s, 5s"</li>
                  <li>• playerStatus: "Standing near a tree, low on mana, enemies approaching"</li>
                </ul>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
              <h5 className="text-blue-400 font-medium mb-2">💡 Tips for Good Templates</h5>
              <ul className="text-blue-300 text-sm space-y-1">
                <li>• Keep prompts concise and specific</li>
                <li>• Use variables for dynamic content</li>
                <li>• Test with different scenarios</li>
                <li>• Aim for 10-15 word responses</li>
                <li>• Be specific about the game context</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomInstructionsEditor
