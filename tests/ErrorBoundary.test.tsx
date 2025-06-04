// @vitest-environment jsdom
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import ErrorBoundary from '../src/renderer/components/ErrorBoundary'

function ProblemChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('boom')
  }
  return <div>safe</div>
}

describe('ErrorBoundary component', () => {
  it('renders fallback UI on error', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

})
