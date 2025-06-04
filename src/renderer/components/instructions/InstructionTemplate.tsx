import React, { useState, useEffect } from 'react'
import type { InstructionTemplate } from '@shared/types'
import CustomInstructionsEditor from './CustomInstructionsEditor'
import TemplatePresets from './TemplatePresets'
import VariableSubstitution from './VariableSubstitution'
import { useSyncGameCoachStore } from '../../stores/sync-store'
import { instructionTemplateService } from '../../services/instruction-template-service'

interface InstructionTemplateProps {
  className?: string
}

type ViewMode = 'presets' | 'editor' | 'testing'

const InstructionTemplateComponent: React.FC<InstructionTemplateProps> = ({
  className = ''
}) => {  const { settings, updateSettings } = useSyncGameCoachStore()
  const [viewMode, setViewMode] = useState<ViewMode>('presets')
  const [editingTemplate, setEditingTemplate] = useState<InstructionTemplate | null>(null)
  const [serviceInitialized, setServiceInitialized] = useState(false)  // Initialize the instruction template service
  useEffect(() => {
    const initializeService = async () => {
      try {
        await instructionTemplateService.initialize()
        
        // Sync custom templates from settings to service to prevent duplicates
        const customTemplates = settings.customInstructions.customTemplates || []
        console.log(`InstructionTemplate: Syncing ${customTemplates.length} custom templates to service`)
        
        customTemplates.forEach(customTemplate => {
          instructionTemplateService.addCustomTemplate(customTemplate)
        })
        
        setServiceInitialized(true)
        console.log('InstructionTemplate: Service initialized and custom templates synced')
      } catch (error) {
        console.error('InstructionTemplate: Failed to initialize service:', error)
      }
    }
    
    if (!serviceInitialized) {
      initializeService()
    }
  }, [serviceInitialized])

  // Re-sync custom templates when settings change
  useEffect(() => {
    if (serviceInitialized) {
      const customTemplates = settings.customInstructions.customTemplates || []
      console.log('InstructionTemplate: Re-syncing custom templates due to settings change')
      
      customTemplates.forEach(customTemplate => {
        instructionTemplateService.addCustomTemplate(customTemplate)
      })
    }
  }, [serviceInitialized, settings.customInstructions.customTemplates])

  const handleTemplateSelect = (template: InstructionTemplate) => {
    // Update active template in settings
    updateSettings({
      customInstructions: {
        ...settings.customInstructions,
        activeTemplate: template.id,
        systemPrompt: template.systemPrompt
      }
    })
  }

  const handleCreateNew = () => {
    setEditingTemplate(null)
    setViewMode('editor')
  }

  const handleEditTemplate = (template: InstructionTemplate) => {
    setEditingTemplate(template)
    setViewMode('editor')
  }
  const handleSaveTemplate = (template: InstructionTemplate) => {
    // Add to instruction template service (single source of truth)
    instructionTemplateService.addCustomTemplate(template)
    
    // Add to custom templates in settings for persistence
    const existingTemplates = settings.customInstructions.customTemplates || []
    const updatedTemplates = existingTemplates.filter(t => t.id !== template.id)
    updatedTemplates.push(template)

    updateSettings({
      customInstructions: {
        ...settings.customInstructions,
        customTemplates: updatedTemplates,
        activeTemplate: template.id,
        systemPrompt: template.systemPrompt
      }
    })

    setViewMode('presets')
    setEditingTemplate(null)
  }

  const handleTemplateChange = (template: InstructionTemplate) => {
    // Update live preview as user types
    setEditingTemplate(template)
  }
  const handleCancelEdit = () => {
    setViewMode('presets')
    setEditingTemplate(null)
  }

  const getActiveTemplate = (): InstructionTemplate | null => {
    const { activeTemplate, customTemplates } = settings.customInstructions
    
    if (!activeTemplate) {
      console.log('InstructionTemplate: No active template ID set')
      return null
    }
    
    console.log('InstructionTemplate: Looking for template with ID:', activeTemplate)
    
    // Check custom templates first
    const customTemplate = customTemplates?.find(t => t.id === activeTemplate)
    if (customTemplate) {
      console.log('InstructionTemplate: Found custom template:', customTemplate.name)
      return customTemplate
    }
    
    // Check built-in templates from service (only if service is initialized)
    if (serviceInitialized) {
      try {
        const builtInTemplate = instructionTemplateService.getTemplateById(activeTemplate)
        if (builtInTemplate) {
          console.log('InstructionTemplate: Found built-in template:', builtInTemplate.name)
          return builtInTemplate
        } else {
          console.log('InstructionTemplate: Template not found in service:', activeTemplate)
        }
      } catch (error) {
        console.warn('InstructionTemplate: Error getting built-in template:', error)
      }
    } else {
      console.log('InstructionTemplate: Service not initialized yet')
    }
    
    console.log('InstructionTemplate: Template not found anywhere')
    return null
  }

  const renderViewMode = () => {
    switch (viewMode) {
      case 'presets':
        return (
          <TemplatePresets
            onTemplateSelect={handleTemplateSelect}
            onCreateNew={handleCreateNew}
            activeTemplateId={settings.customInstructions.activeTemplate}
          />
        )
      
      case 'editor':
        return (
          <CustomInstructionsEditor
            template={editingTemplate}
            onTemplateChange={handleTemplateChange}
            onSave={handleSaveTemplate}
            onCancel={handleCancelEdit}
          />
        )
      
      case 'testing':
        const activeTemplate = getActiveTemplate()
        return activeTemplate ? (          <VariableSubstitution
            template={activeTemplate}
            onPreviewUpdate={() => {}} // No longer needed
          />
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">No active template selected</div>
            <button onClick={() => setViewMode('presets')} className="btn-primary">
              Select Template
            </button>
          </div>
        )
      
      default:
        return null
    }
  }

  return (    <div className={`space-y-8 ${className}`}>
      {/* Navigation Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('presets')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'presets'
                ? 'bg-primary-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setViewMode('editor')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'editor'
                ? 'bg-primary-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setViewMode('testing')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'testing'
                ? 'bg-primary-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Testing
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-3">
          {viewMode === 'presets' && getActiveTemplate() && (
            <button
              onClick={() => handleEditTemplate(getActiveTemplate()!)}
              className="btn-secondary text-sm"
            >
              Edit Active
            </button>
          )}
            <div className="text-sm text-gray-400">
            Active: {(() => {
              const activeTemplate = getActiveTemplate()
              return activeTemplate ? activeTemplate.name : (settings.customInstructions.activeTemplate || 'None')
            })()}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${
              getActiveTemplate() ? 'bg-green-400' : 'bg-gray-400'
            }`} />
            <span className="text-gray-300">
              {(() => {
                const activeTemplate = getActiveTemplate()
                if (activeTemplate) {
                  return `Active: ${activeTemplate.name}`
                }
                return settings.customInstructions.activeTemplate 
                  ? `Loading: ${settings.customInstructions.activeTemplate}` 
                  : 'No Template Selected'
              })()}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${
              settings.customInstructions.enableVariableSubstitution ? 'bg-blue-400' : 'bg-gray-400'
            }`} />
            <span className="text-gray-300">
              Variable Substitution {settings.customInstructions.enableVariableSubstitution ? 'On' : 'Off'}
            </span>
          </div>
          
          <div className="text-gray-400">
            Custom Templates: {settings.customInstructions.customTemplates?.length || 0}
          </div>
        </div>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={settings.customInstructions.enableVariableSubstitution}
            onChange={(e) => updateSettings({
              customInstructions: {
                ...settings.customInstructions,
                enableVariableSubstitution: e.target.checked
              }
            })}
            className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
          />
          <span className="text-gray-300 text-sm">Enable Variable Substitution</span>
        </label>
      </div>

      {/* Main Content */}
      <div className="min-h-96">
        {renderViewMode()}
      </div>

      {/* Help Section */}
      <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
        <h4 className="text-blue-400 font-medium mb-2">💡 Custom Instructions Help</h4>
        <div className="text-blue-300 text-sm space-y-2">
          <p><strong>Templates:</strong> Browse and select from built-in and custom instruction templates.</p>
          <p><strong>Editor:</strong> Create or modify instruction templates with variable support.</p>
          <p><strong>Testing:</strong> Test how variables are substituted in your active template.</p>
          <p><strong>Variables:</strong> Use ${'{'}gameContext{'}'}, ${'{'}hudElements{'}'}, ${'{'}playerStatus{'}'} for dynamic content.</p>
        </div>
      </div>
    </div>
  )
}

export default InstructionTemplateComponent
