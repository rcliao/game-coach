import React, { useEffect, useState } from 'react'
import { useSyncGameCoachStore } from '../stores/sync-store'

const themeStyles = {
  dark: {
    background: 'bg-black/85 backdrop-blur-sm border border-blue-500/50',
    text: 'text-gray-200',
    accent: 'text-blue-400',
    indicator: 'bg-blue-500'
  },
  light: {
    background: 'bg-white/90 backdrop-blur-sm border border-gray-300',
    text: 'text-gray-800',
    accent: 'text-blue-600',
    indicator: 'bg-blue-600'
  },
  minimal: {
    background: 'bg-gray-900/70 backdrop-blur-sm border border-gray-600/30',
    text: 'text-gray-100',
    accent: 'text-gray-300',
    indicator: 'bg-gray-400'
  }
}

const sizeStyles = {
  small: 'max-w-xs text-xs p-3',
  medium: 'max-w-sm text-sm p-4',
  large: 'max-w-lg text-base p-6'
}

const GameOverlay: React.FC = () => {
  const { 
    isOverlayVisible, 
    lastAnalysis, 
    isAnalyzing,
    gameDetection,
    settings
  } = useSyncGameCoachStore()
  
  const [currentAdvice, setCurrentAdvice] = useState<string | null>(null)
  const [showAdvice, setShowAdvice] = useState(false)

  useEffect(() => {
    if (lastAnalysis && lastAnalysis.advice) {
      setCurrentAdvice(lastAnalysis.advice)
      setShowAdvice(true)
      const timer = setTimeout(() => {
        setShowAdvice(false)
      }, settings.autoHideDelay * 1000)
      return () => clearTimeout(timer)
    }
  }, [lastAnalysis, settings.autoHideDelay])

  if (!isOverlayVisible || !settings.overlayEnabled) {
    return null
  }

  const theme = themeStyles[settings.overlayTheme] || themeStyles.dark
  const sizeClass = sizeStyles[settings.overlaySize] || sizeStyles.large

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-50"
      style={{ opacity: settings.overlayOpacity }}
    >
      {/* Advice Display */}
      {showAdvice && currentAdvice && (
        <div
          className={`absolute animate-slideInRight ${sizeClass}`}
          style={{
            top: `${settings.overlayPosition.y}%`,
            left: `${settings.overlayPosition.x}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className={`${theme.background} rounded-lg shadow-2xl transition-all duration-300`}>
            <div className="flex items-start space-x-3">
              <div className={`w-2 h-2 ${theme.indicator} rounded-full mt-2 flex-shrink-0 animate-pulse`} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className={`${theme.accent} font-medium`}>AI Coach</p>
                  {lastAnalysis && settings.showConfidenceScore && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">
                        {(lastAnalysis.confidence * 100).toFixed(0)}%
                      </span>
                      <div className="w-8 h-1 bg-gray-600 rounded">
                        <div 
                          className="h-1 bg-green-400 rounded transition-all duration-300"
                          style={{ width: `${lastAnalysis.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <p className={`${theme.text} leading-relaxed`}>
                  {currentAdvice}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {lastAnalysis?.provider} • {lastAnalysis?.analysisTime}ms
                  </span>
                  <button
                    onClick={() => setShowAdvice(false)}
                    className="text-gray-400 hover:text-white transition-colors pointer-events-auto"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Indicators */}
      <div className="absolute top-4 left-4 space-y-2">
        {/* Game Detection Status */}
        <div className={`${theme.background} rounded-full px-3 py-1 flex items-center space-x-2`}>
          <div className={`w-2 h-2 rounded-full ${
            gameDetection?.isGameRunning ? 'bg-green-400 animate-pulse' : 'bg-red-400'
          }`} />
          <span className={`${theme.text} text-xs font-medium`}>
            {gameDetection?.isGameRunning ? 'Ravenswatch Detected' : 'Game Not Detected'}
          </span>
        </div>
        {/* AI Analysis Status */}
        {gameDetection?.isGameRunning && (
          <div className={`${theme.background} rounded-full px-3 py-1 flex items-center space-x-2`}>
            <div className={`w-2 h-2 rounded-full ${
              isAnalyzing ? 'bg-blue-400 animate-pulse' : 'bg-gray-400'
            }`} />
            <span className={`${theme.text} text-xs font-medium`}>
              {isAnalyzing ? 'AI Analyzing' : 'AI Idle'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default GameOverlay
