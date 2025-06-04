// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import VariableSubstitution from '../src/renderer/components/instructions/VariableSubstitution'
import type { InstructionTemplate } from '../src/shared/types'

describe('VariableSubstitution component', () => {
  const template: InstructionTemplate = {
    id: 't1',
    name: 'Test Template',
    category: 'general',
    systemPrompt: 'Context: ${gameContext}\nStatus: ${playerStatus}',
    variables: { gameContext: 'Game context', playerStatus: 'Player status' },
    isBuiltIn: false,
  }

  it('renders inputs for used variables', () => {
    render(<VariableSubstitution template={template} />)
    expect(screen.getByPlaceholderText('Game context')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Player status')).toBeInTheDocument()
    expect(screen.getAllByText(/Current game situation/).length).toBeGreaterThan(0)
  })

  it('updates preview when variable changes', () => {
    render(<VariableSubstitution template={template} />)
    const textarea = screen.getByPlaceholderText('Game context') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'Battle field' } })
    expect(textarea.value).toBe('Battle field')
    expect(screen.getAllByText(/Battle field/).length).toBeGreaterThan(0)
  })

  it('reset button restores defaults', () => {
    render(<VariableSubstitution template={template} />)
    const textarea = screen.getByPlaceholderText('Game context') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'Something' } })
    fireEvent.click(screen.getByText('Reset'))
    expect(textarea.value).toContain('Current game situation')
  })
})
