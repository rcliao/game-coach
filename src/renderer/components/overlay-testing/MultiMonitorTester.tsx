import React, { useState, useEffect } from 'react'
import { AppSettings } from '../../../shared/types'

interface MultiMonitorTesterProps {
  settings: AppSettings['overlayTesting']
  onUpdate: <K extends keyof AppSettings['overlayTesting']>(
    key: K,
    value: AppSettings['overlayTesting'][K]
  ) => void
}

interface MonitorInfo {
  id: string
  name: string
  width: number
  height: number
  isPrimary: boolean
  bounds: { x: number; y: number; width: number; height: number }
}

const MultiMonitorTester: React.FC<MultiMonitorTesterProps> = ({ settings, onUpdate }) => {
  const [monitors, setMonitors] = useState<MonitorInfo[]>([])
  const [selectedMonitor, setSelectedMonitor] = useState<string>('')
  const [isTestActive, setIsTestActive] = useState(false)
  const [simulatedSetup, setSimulatedSetup] = useState<'single' | 'dual' | 'triple' | 'quad'>('dual')

  // Simulated monitor setups for testing
  const simulatedSetups = {
    single: [
      { id: 'monitor-1', name: 'Primary Monitor', width: 1920, height: 1080, isPrimary: true, bounds: { x: 0, y: 0, width: 1920, height: 1080 } }
    ],
    dual: [
      { id: 'monitor-1', name: 'Primary Monitor', width: 1920, height: 1080, isPrimary: true, bounds: { x: 0, y: 0, width: 1920, height: 1080 } },
      { id: 'monitor-2', name: 'Secondary Monitor', width: 1920, height: 1080, isPrimary: false, bounds: { x: 1920, y: 0, width: 1920, height: 1080 } }
    ],
    triple: [
      { id: 'monitor-1', name: 'Left Monitor', width: 1920, height: 1080, isPrimary: false, bounds: { x: 0, y: 0, width: 1920, height: 1080 } },
      { id: 'monitor-2', name: 'Primary Monitor', width: 1920, height: 1080, isPrimary: true, bounds: { x: 1920, y: 0, width: 1920, height: 1080 } },
      { id: 'monitor-3', name: 'Right Monitor', width: 1920, height: 1080, isPrimary: false, bounds: { x: 3840, y: 0, width: 1920, height: 1080 } }
    ],
    quad: [
      { id: 'monitor-1', name: 'Top-Left Monitor', width: 1920, height: 1080, isPrimary: false, bounds: { x: 0, y: 0, width: 1920, height: 1080 } },
      { id: 'monitor-2', name: 'Top-Right Monitor', width: 1920, height: 1080, isPrimary: true, bounds: { x: 1920, y: 0, width: 1920, height: 1080 } },
      { id: 'monitor-3', name: 'Bottom-Left Monitor', width: 1920, height: 1080, isPrimary: false, bounds: { x: 0, y: 1080, width: 1920, height: 1080 } },
      { id: 'monitor-4', name: 'Bottom-Right Monitor', width: 1920, height: 1080, isPrimary: false, bounds: { x: 1920, y: 1080, width: 1920, height: 1080 } }
    ]
  }

  useEffect(() => {
    // For now, use simulated data. In a real implementation, this would query the system
    setMonitors(simulatedSetups[simulatedSetup])
    if (simulatedSetups[simulatedSetup].length > 0) {
      setSelectedMonitor(simulatedSetups[simulatedSetup][0].id)
    }
  }, [simulatedSetup])

  const toggleMultiMonitorSupport = () => {
    onUpdate('enableMultiMonitor', !settings.enableMultiMonitor)
  }

  const startMultiMonitorTest = () => {
    setIsTestActive(true)
    setTimeout(() => {
      setIsTestActive(false)
    }, settings.testDuration)
  }

  const getTotalBounds = () => {
    if (monitors.length === 0) return { width: 1920, height: 1080, minX: 0, minY: 0 }
    
    const minX = Math.min(...monitors.map(m => m.bounds.x))
    const minY = Math.min(...monitors.map(m => m.bounds.y))
    const maxX = Math.max(...monitors.map(m => m.bounds.x + m.bounds.width))
    const maxY = Math.max(...monitors.map(m => m.bounds.y + m.bounds.height))
    
    return {
      width: maxX - minX,
      height: maxY - minY,
      minX,
      minY
    }
  }

  const totalBounds = getTotalBounds()
  const scale = Math.min(400 / totalBounds.width, 200 / totalBounds.height)

  const testPositionOnMonitor = (monitor: MonitorInfo) => {
    // Test overlay positioning on specific monitor
    const relativeX = (settings.testPosition.x / 100) * monitor.bounds.width + monitor.bounds.x
    const relativeY = (settings.testPosition.y / 100) * monitor.bounds.height + monitor.bounds.y
    
    console.log(`Testing position on ${monitor.name}: (${relativeX}, ${relativeY})`)
    
    startMultiMonitorTest()
  }

  return (
    <div className="space-y-6">
      {/* Multi-Monitor Support Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
        <div>
          <div className="text-sm font-medium text-gray-300">Multi-Monitor Support</div>
          <div className="text-xs text-gray-400">Enable overlay positioning across multiple displays</div>
        </div>
        <button
          onClick={toggleMultiMonitorSupport}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            settings.enableMultiMonitor ? 'bg-primary-600' : 'bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.enableMultiMonitor ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Simulated Setup Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Test Setup (Simulated)
        </label>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(simulatedSetups).map(([setup, _]) => (
            <button
              key={setup}
              onClick={() => setSimulatedSetup(setup as any)}
              className={`p-2 text-xs rounded border-2 transition-all capitalize ${
                simulatedSetup === setup
                  ? 'border-primary-400 bg-primary-600/20 text-primary-300'
                  : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              {setup}
            </button>
          ))}
        </div>
      </div>

      {/* Monitor Layout Visualization */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Monitor Layout
        </label>
        <div 
          className="relative bg-gray-800 rounded-lg border border-gray-600 p-4 overflow-hidden"
          style={{ height: '240px' }}
        >
          <div 
            className="relative mx-auto"
            style={{ 
              width: `${totalBounds.width * scale}px`, 
              height: `${totalBounds.height * scale}px`,
              top: '50%',
              transform: 'translateY(-50%)'
            }}
          >
            {monitors.map((monitor, index) => (
              <div
                key={monitor.id}
                className={`absolute border-2 rounded cursor-pointer transition-all ${
                  selectedMonitor === monitor.id
                    ? 'border-primary-400 bg-primary-600/20'
                    : monitor.isPrimary
                    ? 'border-green-400 bg-green-600/10'
                    : 'border-gray-500 bg-gray-600/20'
                } ${isTestActive ? 'animate-pulse' : ''}`}
                style={{
                  left: `${(monitor.bounds.x - totalBounds.minX) * scale}px`,
                  top: `${(monitor.bounds.y - totalBounds.minY) * scale}px`,
                  width: `${monitor.bounds.width * scale}px`,
                  height: `${monitor.bounds.height * scale}px`
                }}
                onClick={() => setSelectedMonitor(monitor.id)}
              >
                <div className="p-1 text-xs">
                  <div className="font-medium text-white">{index + 1}</div>
                  {monitor.isPrimary && (
                    <div className="text-green-300">★</div>
                  )}
                </div>
                
                {/* Test overlay position indicator */}
                {selectedMonitor === monitor.id && (
                  <div
                    className="absolute w-1 h-1 bg-red-500 rounded-full"
                    style={{
                      left: `${(settings.testPosition.x / 100) * monitor.bounds.width * scale}px`,
                      top: `${(settings.testPosition.y / 100) * monitor.bounds.height * scale}px`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                )}

                {/* Live test overlay */}
                {isTestActive && selectedMonitor === monitor.id && (
                  <div
                    className="absolute bg-red-500/80 border border-red-400 rounded"
                    style={{
                      left: `${(settings.testPosition.x / 100) * monitor.bounds.width * scale}px`,
                      top: `${(settings.testPosition.y / 100) * monitor.bounds.height * scale}px`,
                      width: `${(settings.testSize.width / monitor.bounds.width) * monitor.bounds.width * scale}px`,
                      height: `${(settings.testSize.height / monitor.bounds.height) * monitor.bounds.height * scale}px`,
                      transform: 'translate(0, 0)',
                      minWidth: '4px',
                      minHeight: '2px'
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monitor List */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Available Monitors
        </label>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {monitors.map((monitor, index) => (
            <div 
              key={monitor.id}
              className={`p-3 rounded border-2 transition-all cursor-pointer ${
                selectedMonitor === monitor.id
                  ? 'border-primary-400 bg-primary-600/10'
                  : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
              }`}
              onClick={() => setSelectedMonitor(monitor.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white flex items-center gap-2">
                    Monitor {index + 1} {monitor.isPrimary && <span className="text-green-400">★</span>}
                  </div>
                  <div className="text-xs text-gray-400">
                    {monitor.width} × {monitor.height} at ({monitor.bounds.x}, {monitor.bounds.y})
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    testPositionOnMonitor(monitor)
                  }}
                  disabled={isTestActive}
                  className="px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  Test
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monitor Configuration */}
      {selectedMonitor && (
        <div className="p-4 bg-gray-700/20 rounded-lg border border-gray-600">
          <div className="text-sm font-medium text-gray-300 mb-3">
            Selected Monitor Configuration
          </div>
          {(() => {
            const monitor = monitors.find(m => m.id === selectedMonitor)
            if (!monitor) return null
            
            return (
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-400">Resolution:</span>
                  <span className="text-white ml-2">{monitor.width} × {monitor.height}</span>
                </div>
                <div>
                  <span className="text-gray-400">Position:</span>
                  <span className="text-white ml-2">({monitor.bounds.x}, {monitor.bounds.y})</span>
                </div>
                <div>
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white ml-2">{monitor.isPrimary ? 'Primary' : 'Secondary'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Test Position:</span>
                  <span className="text-white ml-2">
                    ({Math.round((settings.testPosition.x / 100) * monitor.width)}, {Math.round((settings.testPosition.y / 100) * monitor.height)})
                  </span>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-600">
        <button
          onClick={startMultiMonitorTest}
          disabled={isTestActive || !settings.enableMultiMonitor}
          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isTestActive ? 'Testing...' : 'Test on All Monitors'}
        </button>
        <button
          onClick={() => {
            if (selectedMonitor) {
              const monitor = monitors.find(m => m.id === selectedMonitor)
              if (monitor) testPositionOnMonitor(monitor)
            }
          }}
          disabled={isTestActive || !selectedMonitor}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Test Selected
        </button>
      </div>

      {/* Info */}
      <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
        <div className="text-sm text-blue-300 font-medium mb-1">🖥️ Multi-Monitor Notes</div>
        <ul className="text-xs text-blue-200/80 space-y-1">
          <li>• Primary monitor (★) is where most games run by default</li>
          <li>• Overlay positions are relative to each monitor's coordinate system</li>
          <li>• Enable multi-monitor support to position overlays on any display</li>
          <li>• Test on all monitors to ensure consistent behavior</li>
        </ul>
      </div>
    </div>
  )
}

export default MultiMonitorTester
