import { describe, it, expect } from 'vitest'
import { InstructionTemplateService } from '../src/renderer/services/instruction-template-service'
import type { InstructionTemplate } from '../src/shared/types'

describe('InstructionTemplateService', () => {
  it('adds and removes custom templates', () => {
    const svc = new InstructionTemplateService()
    const tpl: InstructionTemplate = {
      id: '1',
      name: 'Test',
      description: '',
      systemPrompt: 'hello',
      variables: {},
      category: 'combat',
      isBuiltIn: false
    }
    svc.addCustomTemplate(tpl)
    expect(svc.getTemplateById('1')).toEqual(tpl)
    const removed = svc.removeCustomTemplate('1')
    expect(removed).toBe(true)
    expect(svc.getTemplateById('1')).toBeNull()
  })

  it('substitutes variables in templates', () => {
    const svc = new InstructionTemplateService()
    const tpl: InstructionTemplate = {
      id: '1',
      name: 'Test',
      description: '',
      systemPrompt: 'Use ${name}',
      variables: {},
      category: 'combat',
      isBuiltIn: false
    }
    const out = svc.substituteVariables(tpl, { name: 'Hero' })
    expect(out).toBe('Use Hero')
  })

  it('validates template fields', () => {
    const svc = new InstructionTemplateService()
    const errors = svc.validateTemplate({ name: '', id: '' })
    expect(errors.length).toBeGreaterThan(0)
  })
})
