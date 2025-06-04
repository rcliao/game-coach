import React, { useState, useEffect } from 'react'
import { AppSettings } from '../../../shared/types'

interface DurationTesterProps {
  settings: AppSettings['overlayTesting']
  onUpdate: <K extends keyof AppSettings['overlayTesting']>(
    key: K,
    value: AppSettings['overlayTesting'][K]
  ) => void
}

const DurationTester: React.FC<DurationTesterProps> = ({ settings, onUpdate }) => {
  const [isTestActive, setIsTestActive] = useState(false)
  const [remainingTime, setRemainingTime] = useState(0)
  const [testStartTime, setTestStartTime] = useState(0)

  const durationPresets = [
    { name: '1 Second', value: 1000 },
    { name: '2 Seconds', value: 2000 },
    { name: '3 Seconds', value: 3000 },
    { name: '5 Seconds', value: 5000 },
    { name: '10 Seconds', value: 10000 },
    { name: '15 Seconds', value: 15000 },
    { name: '30 Seconds', value: 30000 },
    { name: '1 Minute', value: 60000 },
  ]

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isTestActive) {
      interval = setInterval(() => {
        const elapsed = Date.now() - testStartTime
        const remaining = Math.max(0, settings.testDuration - elapsed)
        setRemainingTime(remaining)

        if (remaining <= 0) {
          setIsTestActive(false)
        }
      }, 100)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTestActive, testStartTime, settings.testDuration])

  const startTest = () => {
    setTestStartTime(Date.now())
    setRemainingTime(settings.testDuration)
    setIsTestActive(true)
  }

  const stopTest = () => {
    setIsTestActive(false)
    setRemainingTime(0)
  }

  const formatDuration = (ms: number) => {
    if (ms >= 60000) {
      const minutes = Math.floor(ms / 60000)
      const seconds = Math.floor((ms % 60000) / 1000)
      return `${minutes}m ${seconds}s`
    } else if (ms >= 1000) {
      const seconds = (ms / 1000).toFixed(1)
      return `${seconds}s`
    } else {
      return `${ms}ms`
    }
  }

  const formatProgressTime = (ms: number) => {
    const seconds = (ms / 1000).toFixed(1)
    return `${seconds}s`
  }

  const getProgressPercentage = () => {
    if (!isTestActive || settings.testDuration === 0) return 0
    return ((settings.testDuration - remainingTime) / settings.testDuration) * 100
  }

  return (
    <div className="space-y-6">
      {/* Current Duration Display */}
      <div className="text-center p-6 bg-gray-700/30 rounded-lg">
        <div className="text-2xl font-bold text-white mb-2">
          {formatDuration(settings.testDuration)}
        </div>
        <div className="text-sm text-gray-400">
          Current test duration
        </div>
      </div>

      {/* Duration Presets */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Quick Presets
        </label>
        <div className="grid grid-cols-4 gap-2">
          {durationPresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onUpdate('testDuration', preset.value)}
              className={`p-2 text-xs rounded border-2 transition-all ${
                settings.testDuration === preset.value
                  ? 'border-primary-400 bg-primary-600/20 text-primary-300'
                  : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-600'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Duration Slider */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          Custom Duration
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="500"
            max="60000"
            step="100"
            value={settings.testDuration}
            onChange={(e) => onUpdate('testDuration', parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>0.5s</span>
            <span>{formatDuration(settings.testDuration)}</span>
            <span>60s</span>
          </div>
        </div>
      </div>

      {/* Precise Input */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Seconds
          </label>
          <input
            type="number"
            min="0.5"
            max="60"
            step="0.1"
            value={(settings.testDuration / 1000).toFixed(1)}
            onChange={(e) => {
              const seconds = parseFloat(e.target.value) || 0.5
              onUpdate('testDuration', Math.round(seconds * 1000))
            }}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-primary-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Milliseconds
          </label>
          <input
            type="number"
            min="500"
            max="60000"
            step="100"
            value={settings.testDuration}
            onChange={(e) => onUpdate('testDuration', parseInt(e.target.value) || 500)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-primary-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Test Progress */}
      {isTestActive && (
        <div className="space-y-3 p-4 bg-primary-900/20 border border-primary-700/50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-primary-300">
              Test in Progress
            </span>
            <span className="text-sm text-primary-400">
              {formatProgressTime(remainingTime)} remaining
            </span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-primary-500 h-2 rounded-full transition-all duration-100"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
          
          <div className="text-xs text-gray-400 text-center">
            {Math.round(getProgressPercentage())}% complete
          </div>
        </div>
      )}

      {/* Test Visualization */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Duration Visualization
        </label>
        <div className="relative h-24 bg-gray-800 rounded-lg border border-gray-600 overflow-hidden">
          {/* Timeline markers */}
          <div className="absolute inset-0 flex">
            {Array.from({ length: 11 }).map((_, i) => (
              <div 
                key={i} 
                className="flex-1 border-r border-gray-600 relative"
              >
                {i % 2 === 0 && (
                  <div className="absolute bottom-1 left-1 text-xs text-gray-500">
                    {i * 6}s
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Duration indicator */}
          <div 
            className="absolute top-4 bg-primary-500 h-4 rounded transition-all duration-300"
            style={{ 
              width: `${Math.min((settings.testDuration / 60000) * 100, 100)}%`,
              left: '0%'
            }}
          />
          
          {/* Current position during test */}
          {isTestActive && (
            <div 
              className="absolute top-2 w-1 h-20 bg-red-500 transition-all duration-100"
              style={{ 
                left: `${getProgressPercentage()}%`,
                transform: 'translateX(-50%)'
              }}
            />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-600">
        {!isTestActive ? (
          <button
            onClick={startTest}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Start Duration Test
          </button>
        ) : (
          <button
            onClick={stopTest}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Stop Test
          </button>
        )}
        
        <button
          onClick={() => onUpdate('testDuration', 5000)}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Reset to 5s
        </button>
      </div>

      {/* Tips */}
      <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
        <div className="text-sm text-blue-300 font-medium mb-1">💡 Duration Tips</div>
        <ul className="text-xs text-blue-200/80 space-y-1">
          <li>• Short durations (1-3s) work best for quick tactical advice</li>
          <li>• Medium durations (5-10s) are ideal for strategy explanations</li>
          <li>• Long durations (15s+) should be used sparingly to avoid disruption</li>
        </ul>
      </div>
    </div>
  )
}

export default DurationTester
