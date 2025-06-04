// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdviceDisplay from '../src/renderer/components/AdviceDisplay'

describe('AdviceDisplay component', () => {
  it('renders advice with confidence and category', () => {
    render(
      <AdviceDisplay
        advice="Stay safe"
        category="combat"
        confidence={0.75}
        onDismiss={() => {}}
      />
    )

    expect(screen.getByText('combat Advice')).toBeInTheDocument()
    expect(screen.getByText('75% confident')).toBeInTheDocument()
    expect(screen.getByText('Stay safe')).toBeInTheDocument()
  })

  it('calls onDismiss when dismiss button clicked', () => {
    const onDismiss = vi.fn()
    render(
      <AdviceDisplay
        advice="Test"
        category="items"
        confidence={0.5}
        onDismiss={onDismiss}
      />
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(onDismiss).toHaveBeenCalled()
  })

  it('sets progress bar width based on confidence', () => {
    const { container } = render(
      <AdviceDisplay
        advice="Test"
        category="general"
        confidence={0.6}
        onDismiss={() => {}}
      />
    )

    const bar = container.querySelector('.bg-primary-500') as HTMLElement
    expect(bar).toHaveStyle({ width: '60%' })
  })
})
