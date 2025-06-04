import React, { useState } from 'react'
import { useSyncGameCoachStore } from '../../stores/sync-store'
import PositionTester from './PositionTester'
import StyleTester from './StyleTester'
import DurationTester from './DurationTester'
import MultiMonitorTester from './MultiMonitorTester'

const OverlayTestSuite: React.FC = () => {
  const { settings, updateSettings } = useSyncGameCoachStore()
  const [activeSubTab, setActiveSubTab] = useState<'position' | 'style' | 'duration' | 'multimonitor'>('position')

  const updateOverlayTestingSetting = <K extends keyof typeof settings.overlayTesting>(
    key: K,
    value: typeof settings.overlayTesting[K]
  ) => {
    updateSettings({
      ...settings,
      overlayTesting: {
        ...settings.overlayTesting,
        [key]: value
      }
    })
  }

  const testingTabs = [
    { id: 'position', label: 'Position', icon: '📍' },
    { id: 'style', label: 'Style', icon: '🎨' },
    { id: 'duration', label: 'Duration', icon: '⏱️' },
    { id: 'multimonitor', label: 'Multi-Monitor', icon: '🖥️' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-700 pb-4">
        <h3 className="text-lg font-semibold text-white mb-2">Overlay Testing Suite</h3>
        <p className="text-sm text-gray-400">
          Test and configure overlay positioning, styling, and behavior across different scenarios.
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex space-x-1 bg-gray-700/50 rounded-lg p-1">
        {testingTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all ${
              activeSubTab === tab.id
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Test Content */}
      <div className="bg-gray-700/30 rounded-lg p-4 min-h-[400px]">
        {activeSubTab === 'position' && (
          <PositionTester 
            settings={settings.overlayTesting}
            onUpdate={updateOverlayTestingSetting}
          />
        )}
        {activeSubTab === 'style' && (
          <StyleTester 
            settings={settings.overlayTesting}
            onUpdate={updateOverlayTestingSetting}
          />
        )}
        {activeSubTab === 'duration' && (
          <DurationTester 
            settings={settings.overlayTesting}
            onUpdate={updateOverlayTestingSetting}
          />
        )}
        {activeSubTab === 'multimonitor' && (
          <MultiMonitorTester 
            settings={settings.overlayTesting}
            onUpdate={updateOverlayTestingSetting}
          />
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex justify-between items-center p-4 bg-gray-700/20 rounded-lg border border-gray-600">
        <div className="text-sm text-gray-300">
          <span className="font-medium">Saved Positions:</span> {settings.overlayTesting.savedPositions.length}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => updateOverlayTestingSetting('savedPositions', [])}
            className="px-3 py-1 text-xs bg-red-600/20 text-red-400 rounded border border-red-600/30 hover:bg-red-600/30 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={() => {
              // Reset to defaults
              updateOverlayTestingSetting('testPosition', { x: 50, y: 50 })
              updateOverlayTestingSetting('testSize', { width: 300, height: 200 })
              updateOverlayTestingSetting('testDuration', 5000)
              updateOverlayTestingSetting('testStyle', {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                textColor: 'white',
                fontSize: 14,
                borderRadius: 8,
                padding: 16
              })
            }}
            className="px-3 py-1 text-xs bg-blue-600/20 text-blue-400 rounded border border-blue-600/30 hover:bg-blue-600/30 transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  )
}

export default OverlayTestSuite
