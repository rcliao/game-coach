import React, { useState, useRef, useEffect } from 'react'
import { AppSettings } from '../../../shared/types'
import { useSyncGameCoachStore } from '../../stores/sync-store'

interface PositionTesterProps {
  settings: AppSettings['overlayTesting']
  onUpdate: <K extends keyof AppSettings['overlayTesting']>(
    key: K,
    value: AppSettings['overlayTesting'][K]
  ) => void
}

const PositionTester: React.FC<PositionTesterProps> = ({ settings, onUpdate }) => {
  const {
    updateSettings,
    showOverlay,
    setLastAnalysis
  } = useSyncGameCoachStore()
  const [isTestActive, setIsTestActive] = useState(false)
  const [testOverlayVisible, setTestOverlayVisible] = useState(false)
  const testAreaRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const previewPosition = (x: number, y: number) => {
    updateSettings({ overlayPosition: { x, y } })
    showOverlay()
    const previewAnalysis = {
      advice: 'Position updated',
      confidence: 1,
      provider: 'test',
      analysisTime: 0,
      timestamp: Date.now(),
      category: 'general' as const
    }
    setLastAnalysis(previewAnalysis)
  }

  const presetPositions = [
    { name: 'Top Left', x: 10, y: 10 },
    { name: 'Top Center', x: 50, y: 10 },
    { name: 'Top Right', x: 90, y: 10 },
    { name: 'Center Left', x: 10, y: 50 },
    { name: 'Center', x: 50, y: 50 },
    { name: 'Center Right', x: 90, y: 50 },
    { name: 'Bottom Left', x: 10, y: 90 },
    { name: 'Bottom Center', x: 50, y: 90 },
    { name: 'Bottom Right', x: 90, y: 90 },
  ]

  useEffect(() => {
    if (!isTestActive) {
      setTestOverlayVisible(false)
    }
  }, [isTestActive])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!overlayRef.current || !testAreaRef.current) return
    
    setIsDragging(true)
    const overlayRect = overlayRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - overlayRect.left,
      y: e.clientY - overlayRect.top
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !testAreaRef.current) return

    const rect = testAreaRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100
    const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100

    const clampedX = Math.max(0, Math.min(100, x))
    const clampedY = Math.max(0, Math.min(100, y))

    onUpdate('testPosition', { x: clampedX, y: clampedY })
    previewPosition(clampedX, clampedY)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const startTest = () => {
    setIsTestActive(true)
    setTestOverlayVisible(true)
    previewPosition(settings.testPosition.x, settings.testPosition.y)
    setTimeout(() => {
      setTestOverlayVisible(false)
      setIsTestActive(false)
    }, settings.testDuration)
  }

  const saveCurrentPosition = () => {
    const newPosition = {
      name: `Position ${settings.savedPositions.length + 1}`,
      x: settings.testPosition.x,
      y: settings.testPosition.y,
      timestamp: Date.now()
    }
    onUpdate('savedPositions', [...settings.savedPositions, newPosition])
  }

  const loadPosition = (position: { x: number; y: number }) => {
    onUpdate('testPosition', { x: position.x, y: position.y })
    previewPosition(position.x, position.y)
  }

  const deleteSavedPosition = (index: number) => {
    const updated = settings.savedPositions.filter((_, i) => i !== index)
    onUpdate('savedPositions', updated)
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            X Position (%)
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={settings.testPosition.x}
            onChange={(e) => {
              const val = parseFloat(e.target.value)
              onUpdate('testPosition', {
                ...settings.testPosition,
                x: val
              })
              previewPosition(val, settings.testPosition.y)
            }}
            className="w-full"
          />
          <div className="text-xs text-gray-400 mt-1">
            {settings.testPosition.x.toFixed(1)}%
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Y Position (%)
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={settings.testPosition.y}
            onChange={(e) => {
              const val = parseFloat(e.target.value)
              onUpdate('testPosition', {
                ...settings.testPosition,
                y: val
              })
              previewPosition(settings.testPosition.x, val)
            }}
            className="w-full"
          />
          <div className="text-xs text-gray-400 mt-1">
            {settings.testPosition.y.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Test Area */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Interactive Test Area
        </label>
        <div 
          ref={testAreaRef}
          className="relative w-full h-64 bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 overflow-hidden cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-20">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={`h-${i}`} className="absolute w-full border-t border-gray-500" style={{ top: `${i * 10}%` }} />
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={`v-${i}`} className="absolute h-full border-l border-gray-500" style={{ left: `${i * 10}%` }} />
            ))}
          </div>

          {/* Test overlay */}
          {(testOverlayVisible || isTestActive) && (
            <div
              ref={overlayRef}
              className="absolute bg-black/80 text-white p-3 rounded-lg shadow-lg cursor-move select-none transition-all"
              style={{
                left: `${settings.testPosition.x}%`,
                top: `${settings.testPosition.y}%`,
                width: `${(settings.testSize.width / 800) * 100}%`,
                height: `${(settings.testSize.height / 600) * 100}%`,
                minWidth: '80px',
                minHeight: '40px'
              }}
              onMouseDown={handleMouseDown}
            >
              <div className="text-xs font-medium">Test Overlay</div>
              <div className="text-xs opacity-75">
                {settings.testPosition.x.toFixed(1)}%, {settings.testPosition.y.toFixed(1)}%
              </div>
            </div>
          )}

          {/* Position indicator when not testing */}
          {!testOverlayVisible && !isTestActive && (
            <div
              className="absolute w-2 h-2 bg-primary-400 rounded-full transform -translate-x-1 -translate-y-1"
              style={{
                left: `${settings.testPosition.x}%`,
                top: `${settings.testPosition.y}%`
              }}
            />
          )}
        </div>
      </div>

      {/* Preset Positions */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Preset Positions
        </label>
        <div className="grid grid-cols-3 gap-2">
          {presetPositions.map((preset) => (
            <button
              key={preset.name}
              onClick={() => loadPosition(preset)}
              className="px-3 py-2 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Saved Positions */}
      {settings.savedPositions.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Saved Positions
          </label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {settings.savedPositions.map((position, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-700/50 rounded text-xs">
                <span className="text-gray-300">
                  {position.name} ({position.x.toFixed(1)}%, {position.y.toFixed(1)}%)
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => loadPosition(position)}
                    className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => deleteSavedPosition(index)}
                    className="px-2 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-600">
        <button
          onClick={startTest}
          disabled={isTestActive}
          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isTestActive ? 'Testing...' : 'Test Position'}
        </button>
        <button
          onClick={saveCurrentPosition}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Save Position
        </button>
      </div>
    </div>
  )
}

export default PositionTester
