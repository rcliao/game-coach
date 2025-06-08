import React, { useState } from 'react'
import { AppSettings } from '../../../shared/types'

interface StyleTesterProps {
  settings: AppSettings['overlayTesting']
  onUpdate: <K extends keyof AppSettings['overlayTesting']>(
    key: K,
    value: AppSettings['overlayTesting'][K]
  ) => void
}

const StyleTester: React.FC<StyleTesterProps> = ({ settings, onUpdate }) => {
  const [isTestActive, setIsTestActive] = useState(false)
  const [testOverlayVisible, setTestOverlayVisible] = useState(false)

  const testStyle = settings.testStyle || {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    textColor: 'white',
    fontSize: 14,
    borderRadius: 8,
    padding: 16,
  }

  const backgroundPresets = [
    { name: 'Dark', value: 'rgba(0, 0, 0, 0.8)' },
    { name: 'Light', value: 'rgba(255, 255, 255, 0.9)' },
    { name: 'Blue', value: 'rgba(37, 99, 235, 0.8)' },
    { name: 'Green', value: 'rgba(34, 197, 94, 0.8)' },
    { name: 'Red', value: 'rgba(239, 68, 68, 0.8)' },
    { name: 'Purple', value: 'rgba(147, 51, 234, 0.8)' },
  ]

  const textColorPresets = [
    { name: 'White', value: '#ffffff' },
    { name: 'Black', value: '#000000' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Yellow', value: '#f59e0b' },
  ]

  const fontSizePresets = [10, 12, 14, 16, 18, 20, 24, 28, 32]

  const updateStyle = <K extends keyof typeof testStyle>(
    key: K,
    value: typeof testStyle[K]
  ) => {
    onUpdate('testStyle', {
      ...testStyle,
      [key]: value
    })
  }

  const startTest = () => {
    setIsTestActive(true)
    setTestOverlayVisible(true)
    setTimeout(() => {
      setTestOverlayVisible(false)
      setIsTestActive(false)
    }, settings.testDuration)
  }

  const parseRGBA = (rgba: string) => {
    const match = rgba.match(/rgba?\(([^)]+)\)/)
    if (!match) return { r: 0, g: 0, b: 0, a: 1 }
    
    const values = match[1].split(',').map(v => parseFloat(v.trim()))
    return {
      r: values[0] || 0,
      g: values[1] || 0,
      b: values[2] || 0,
      a: values[3] !== undefined ? values[3] : 1
    }
  }

  const formatRGBA = (r: number, g: number, b: number, a: number) => {
    return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`
  }

  const currentBg = parseRGBA(testStyle.backgroundColor)

  return (
    <div className="space-y-6">
      {/* Preview Area */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Style Preview
        </label>
        <div className="relative w-full h-48 bg-gray-800 rounded-lg border border-gray-600 overflow-hidden">
          {/* Background pattern for transparency visualization */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 20px 20px'
          }} />
          
          {/* Test overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="transition-all duration-300"
              style={{
                backgroundColor: testStyle.backgroundColor,
                color: testStyle.textColor,
                fontSize: `${testStyle.fontSize}px`,
                borderRadius: `${testStyle.borderRadius}px`,
                padding: `${testStyle.padding}px`,
                minWidth: '200px',
                textAlign: 'center'
              }}
            >
              <div className="font-semibold mb-1">Sample Game Advice</div>
              <div className="text-sm opacity-90">Enemy flanking from the right!</div>
              <div className="text-xs opacity-75 mt-1">Check your six o'clock</div>
            </div>
          </div>

          {/* Live test overlay */}
          {testOverlayVisible && (
            <div 
              className="absolute bg-red-500/20 border-2 border-red-500 rounded"
              style={{
                left: `${settings.testPosition.x}%`,
                top: `${settings.testPosition.y}%`,
                width: `${(settings.testSize.width / 800) * 100}%`,
                height: `${(settings.testSize.height / 600) * 100}%`,
                minWidth: '100px',
                minHeight: '50px'
              }}
            >
              <div className="p-2 text-white text-xs font-medium">
                LIVE TEST
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Background Color */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          Background Color
        </label>
        
        {/* Preset backgrounds */}
        <div className="grid grid-cols-3 gap-2">
          {backgroundPresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => updateStyle('backgroundColor', preset.value)}
              className={`p-2 text-xs rounded border-2 transition-all ${
                testStyle.backgroundColor === preset.value
                  ? 'border-primary-400'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              style={{ backgroundColor: preset.value, color: preset.name === 'Light' ? 'black' : 'white' }}
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Custom RGBA controls */}
        <div className="grid grid-cols-4 gap-3 p-3 bg-gray-700/30 rounded">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Red</label>
            <input
              type="range"
              min="0"
              max="255"
              value={currentBg.r}
              onChange={(e) => updateStyle('backgroundColor', 
                formatRGBA(parseInt(e.target.value), currentBg.g, currentBg.b, currentBg.a)
              )}
              className="w-full"
            />
            <div className="text-xs text-gray-400 text-center">{Math.round(currentBg.r)}</div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Green</label>
            <input
              type="range"
              min="0"
              max="255"
              value={currentBg.g}
              onChange={(e) => updateStyle('backgroundColor', 
                formatRGBA(currentBg.r, parseInt(e.target.value), currentBg.b, currentBg.a)
              )}
              className="w-full"
            />
            <div className="text-xs text-gray-400 text-center">{Math.round(currentBg.g)}</div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Blue</label>
            <input
              type="range"
              min="0"
              max="255"
              value={currentBg.b}
              onChange={(e) => updateStyle('backgroundColor', 
                formatRGBA(currentBg.r, currentBg.g, parseInt(e.target.value), currentBg.a)
              )}
              className="w-full"
            />
            <div className="text-xs text-gray-400 text-center">{Math.round(currentBg.b)}</div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Alpha</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={currentBg.a}
              onChange={(e) => updateStyle('backgroundColor', 
                formatRGBA(currentBg.r, currentBg.g, currentBg.b, parseFloat(e.target.value))
              )}
              className="w-full"
            />
            <div className="text-xs text-gray-400 text-center">{currentBg.a.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Text Color */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          Text Color
        </label>
        <div className="grid grid-cols-3 gap-2">
          {textColorPresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => updateStyle('textColor', preset.value)}
              className={`p-2 text-xs rounded border-2 transition-all ${
                testStyle.textColor === preset.value
                  ? 'border-primary-400'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              style={{ 
                backgroundColor: preset.value, 
                color: preset.value === '#ffffff' || preset.value === '#f59e0b' ? 'black' : 'white' 
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Typography */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Font Size
          </label>
          <div className="grid grid-cols-3 gap-1">
            {fontSizePresets.map((size) => (
              <button
                key={size}
                onClick={() => updateStyle('fontSize', size)}
                className={`p-2 text-xs rounded ${
                  testStyle.fontSize === size
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {size}px
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Border Radius
          </label>
          <input
            type="range"
            min="0"
            max="20"
            value={testStyle.borderRadius}
            onChange={(e) => updateStyle('borderRadius', parseInt(e.target.value))}
            className="w-full"
          />
          <div className="text-xs text-gray-400 text-center mt-1">
            {testStyle.borderRadius}px
          </div>
        </div>
      </div>

      {/* Padding */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Padding
        </label>
        <input
          type="range"
          min="4"
          max="32"
          value={testStyle.padding}
          onChange={(e) => updateStyle('padding', parseInt(e.target.value))}
          className="w-full"
        />
        <div className="text-xs text-gray-400 text-center mt-1">
          {testStyle.padding}px
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-600">
        <button
          onClick={startTest}
          disabled={isTestActive}
          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isTestActive ? 'Testing Style...' : 'Test Style Live'}
        </button>
        <button
          onClick={() => {
            updateStyle('backgroundColor', 'rgba(0, 0, 0, 0.8)')
            updateStyle('textColor', 'white')
            updateStyle('fontSize', 14)
            updateStyle('borderRadius', 8)
            updateStyle('padding', 16)
          }}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Reset Style
        </button>
      </div>
    </div>
  )
}

export default StyleTester
