// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import OverlayTestSuite from '../src/renderer/components/overlay-testing/OverlayTestSuite'

const mockUseStore = vi.fn()
vi.mock('../src/renderer/stores/sync-store', () => ({
  useSyncGameCoachStore: () => mockUseStore()
}))

const baseSettings = {
  overlayTesting: {
    testPosition: { x: 50, y: 50 },
    testSize: { width: 300, height: 200 },
    testDuration: 5000,
    testStyle: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      textColor: 'white',
      fontSize: 14,
      borderRadius: 8,
      padding: 16
    },
    enableMultiMonitor: false,
    savedPositions: []
  }
}

describe('OverlayTestSuite style tab', () => {
  it('opens style tester without crashing', () => {
    mockUseStore.mockReturnValue({ settings: baseSettings, updateSettings: vi.fn() })
    render(<OverlayTestSuite />)
    fireEvent.click(screen.getByText('Style'))
    expect(screen.getByText('Style Preview')).toBeInTheDocument()
  })

  it('allows editing style values', () => {
    const updateSettings = vi.fn()
    mockUseStore.mockReturnValue({ settings: baseSettings, updateSettings })
    render(<OverlayTestSuite />)
    fireEvent.click(screen.getByText('Style'))
    const slider = screen.getAllByRole('slider')[0]
    fireEvent.change(slider, { target: { value: '100' } })
    expect(updateSettings).toHaveBeenCalled()
  })
})
