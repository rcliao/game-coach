import type { InstructionTemplate } from '@shared/types'

export class InstructionTemplateService {
  private templates: InstructionTemplate[] = []
  private initialized = false
  private initPromise: Promise<void> | null = null

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('InstructionTemplateService: Already initialized, skipping...')
      return
    }

    // If initialization is already in progress, wait for it
    if (this.initPromise) {
      console.log('InstructionTemplateService: Initialization in progress, waiting...')
      return this.initPromise
    }

    // Start initialization
    this.initPromise = this.doInitialize()
    return this.initPromise
  }

  private async doInitialize(): Promise<void> {
    try {
      console.log('InstructionTemplateService: Starting initialization...')
      // Load built-in templates
      await this.loadBuiltInTemplates()
      this.initialized = true
      console.log('InstructionTemplateService: Initialization complete')
    } catch (error) {
      console.error('InstructionTemplateService: Failed to initialize:', error)
      this.initialized = false // Reset on failure
      this.initPromise = null // Reset promise on failure
      throw error
    } finally {
      this.initPromise = null // Clear promise when done
    }
  }private async loadBuiltInTemplates(): Promise<void> {
    // Clear existing templates to prevent duplicates on re-initialization
    this.templates = []
    
    const templatePaths = [
      // Ravenswatch templates
      'instruction-templates/ravenswatch/combat-focused.json',
      'instruction-templates/ravenswatch/exploration.json',
      'instruction-templates/ravenswatch/speedrun.json',
      // General templates
      'instruction-templates/general/tactical-coach.json',
      'instruction-templates/general/strategic-coach.json'
    ]

    for (const path of templatePaths) {
      try {
        const response = await fetch(path)
        if (response.ok) {
          const template = await response.json() as InstructionTemplate
          // Mark as built-in template
          template.isBuiltIn = true
          
          // Check for duplicates before adding
          const existingTemplate = this.templates.find(t => t.id === template.id)
          if (!existingTemplate) {
            this.templates.push(template)
          } else {
            console.warn(`InstructionTemplateService: Duplicate template ID found: ${template.id}`)
          }
        } else {
          console.warn(`InstructionTemplateService: Failed to load template from ${path}`)
        }
      } catch (error) {
        console.warn(`InstructionTemplateService: Error loading template from ${path}:`, error)
      }
    }

    console.log(`InstructionTemplateService: Loaded ${this.templates.length} built-in templates`)
  }
  getTemplates(): InstructionTemplate[] {
    console.log(`InstructionTemplateService: Returning ${this.templates.length} templates`)
    return [...this.templates]
  }

  getTemplateCount(): number {
    return this.templates.length
  }
  isInitialized(): boolean {
    return this.initialized
  }

  // Debug method to check for duplicates
  debugTemplates(): void {
    console.log('=== Template Service Debug ===')
    console.log(`Total templates: ${this.templates.length}`)
    console.log(`Initialized: ${this.initialized}`)
    
    const templateIds = this.templates.map(t => t.id)
    const uniqueIds = [...new Set(templateIds)]
    
    if (templateIds.length !== uniqueIds.length) {
      console.warn('⚠️ DUPLICATE TEMPLATES DETECTED!')
      const duplicates = templateIds.filter((id, index) => templateIds.indexOf(id) !== index)
      console.warn('Duplicate IDs:', duplicates)
    } else {
      console.log('✅ No duplicates found')
    }
    
    console.log('Templates by ID:')
    this.templates.forEach(template => {
      console.log(`  - ${template.id}: ${template.name} (Built-in: ${template.isBuiltIn || false})`)
    })
    console.log('============================')
  }

  getTemplateById(id: string): InstructionTemplate | null {
    return this.templates.find(template => template.id === id) || null
  }

  getTemplatesByCategory(category: string): InstructionTemplate[] {
    return this.templates.filter(template => template.category === category)
  }

  addCustomTemplate(template: InstructionTemplate): void {
    // Ensure custom templates have unique IDs
    const existingIndex = this.templates.findIndex(t => t.id === template.id)
    if (existingIndex >= 0) {
      this.templates[existingIndex] = template
    } else {
      this.templates.push(template)
    }
  }

  removeCustomTemplate(id: string): boolean {
    const template = this.getTemplateById(id)
    if (!template || template.isBuiltIn) {
      return false
    }

    const index = this.templates.findIndex(t => t.id === id)
    if (index >= 0) {
      this.templates.splice(index, 1)
      return true
    }
    return false
  }

  substituteVariables(template: InstructionTemplate, variables: Record<string, string>): string {
    let prompt = template.systemPrompt

    // Replace variables in the format ${variableName}
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `\${${key}}`
      prompt = prompt.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value)
    }

    return prompt
  }

  validateTemplate(template: Partial<InstructionTemplate>): string[] {
    const errors: string[] = []

    if (!template.id || template.id.trim() === '') {
      errors.push('Template ID is required')
    }

    if (!template.name || template.name.trim() === '') {
      errors.push('Template name is required')
    }

    if (!template.systemPrompt || template.systemPrompt.trim() === '') {
      errors.push('System prompt is required')
    }

    if (!template.category) {
      errors.push('Template category is required')
    }

    if (template.systemPrompt && template.systemPrompt.length > 1000) {
      errors.push('System prompt is too long (max 1000 characters)')
    }

    return errors
  }

  exportTemplate(id: string): string | null {
    const template = this.getTemplateById(id)
    if (!template) return null

    return JSON.stringify(template, null, 2)
  }

  importTemplate(jsonString: string): { success: boolean; error?: string; template?: InstructionTemplate } {
    try {
      const template = JSON.parse(jsonString) as InstructionTemplate
      const errors = this.validateTemplate(template)
      
      if (errors.length > 0) {
        return { success: false, error: errors.join(', ') }
      }

      // Mark as custom template
      template.isBuiltIn = false
      this.addCustomTemplate(template)

      return { success: true, template }
    } catch (error) {
      return { success: false, error: 'Invalid JSON format' }
    }
  }
}

// Export singleton instance
export const instructionTemplateService = new InstructionTemplateService()
