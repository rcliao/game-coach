import React, { useState, useEffect } from 'react'
import type { InstructionTemplate } from '@shared/types'
import { instructionTemplateService } from '../../services/instruction-template-service'

interface TemplatePresetsProps {
  onTemplateSelect: (template: InstructionTemplate) => void
  onCreateNew: () => void
  activeTemplateId?: string
}

const TemplatePresets: React.FC<TemplatePresetsProps> = ({
  onTemplateSelect,
  onCreateNew,
  activeTemplateId
}) => {
  const [templates, setTemplates] = useState<InstructionTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      await instructionTemplateService.initialize()
      setTemplates(instructionTemplateService.getTemplates())
      setError(null)
    } catch (err) {
      setError('Failed to load templates')
      console.error('TemplatePresets: Error loading templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesSearch = searchTerm === '' || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesCategory && matchesSearch
  })

  const categories = [
    { id: 'all', label: 'All Templates', count: templates.length },
    { id: 'general', label: 'General', count: templates.filter(t => t.category === 'general').length },
    { id: 'combat', label: 'Combat', count: templates.filter(t => t.category === 'combat').length },
    { id: 'exploration', label: 'Exploration', count: templates.filter(t => t.category === 'exploration').length },
    { id: 'speedrun', label: 'Speedrun', count: templates.filter(t => t.category === 'speedrun').length }
  ]

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'combat': return '⚔️'
      case 'exploration': return '🗺️'
      case 'speedrun': return '⚡'
      case 'general': return '🎯'
      default: return '📝'
    }
  }

  const handleTemplateDelete = async (templateId: string) => {
    const template = instructionTemplateService.getTemplateById(templateId)
    if (!template) return

    if (template.isBuiltIn) {
      alert('Cannot delete built-in templates')
      return
    }

    if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
      const success = instructionTemplateService.removeCustomTemplate(templateId)
      if (success) {
        setTemplates(instructionTemplateService.getTemplates())
      }
    }
  }

  const handleExportTemplate = (templateId: string) => {
    const exportData = instructionTemplateService.exportTemplate(templateId)
    if (exportData) {
      const blob = new Blob([exportData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `template-${templateId}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading templates...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
        <h4 className="text-red-400 font-medium mb-2">Error Loading Templates</h4>
        <p className="text-red-300 text-sm">{error}</p>
        <button onClick={loadTemplates} className="mt-2 btn-secondary text-sm">
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Instruction Templates</h3>
        <button onClick={onCreateNew} className="btn-primary">
          Create New Template
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div className="flex space-x-2 overflow-x-auto">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {category.label} ({category.count})
            </button>
          ))}
        </div>
      </div>      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            className={`bg-gray-700 rounded-lg p-5 border-2 transition-all cursor-pointer hover:bg-gray-600 ${
              activeTemplateId === template.id
                ? 'border-primary-500 bg-gray-600'
                : 'border-transparent'
            }`}
            onClick={() => onTemplateSelect(template)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-lg">{getCategoryIcon(template.category)}</span>
                <div>
                  <h4 className="text-white font-medium text-sm">{template.name}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    template.isBuiltIn 
                      ? 'bg-blue-900/20 text-blue-400' 
                      : 'bg-green-900/20 text-green-400'
                  }`}>
                    {template.isBuiltIn ? 'Built-in' : 'Custom'}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleExportTemplate(template.id)
                  }}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                  title="Export template"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                
                {!template.isBuiltIn && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTemplateDelete(template.id)
                    }}
                    className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete template"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <p className="text-gray-300 text-sm mb-3 line-clamp-2">
              {template.description}
            </p>

            <div className="text-xs text-gray-400">
              <div className="mb-1">
                Variables: {Object.keys(template.variables).length}
              </div>
              <div className="truncate">
                Prompt: {template.systemPrompt.substring(0, 60)}...
              </div>
            </div>

            {activeTemplateId === template.id && (
              <div className="mt-3 flex items-center text-primary-400 text-sm">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Active Template
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">No templates found</div>
          <p className="text-gray-500 text-sm">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filter'
              : 'Create your first custom template to get started'
            }
          </p>
        </div>
      )}

      {/* Import Section */}
      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-white font-medium mb-2">Import Template</h4>
        <div className="flex items-center space-x-2">
          <input
            type="file"
            accept=".json"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (file) {
                try {
                  const text = await file.text()
                  const result = instructionTemplateService.importTemplate(text)
                  if (result.success) {
                    setTemplates(instructionTemplateService.getTemplates())
                    alert(`Template "${result.template?.name}" imported successfully!`)
                  } else {
                    alert(`Import failed: ${result.error}`)
                  }
                } catch (error) {
                  alert('Failed to read file')
                }
                e.target.value = '' // Reset file input
              }
            }}
            className="text-sm text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-gray-600 file:text-white hover:file:bg-gray-500"
          />
          <span className="text-xs text-gray-400">JSON files only</span>
        </div>
      </div>
    </div>
  )
}

export default TemplatePresets
