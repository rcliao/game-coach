import React, { useEffect, useState } from 'react'
import { useSyncGameCoachStore } from '../stores/sync-store'

const theme = {
  background: 'bg-black/85 backdrop-blur-sm border border-blue-500/50',
  text: 'text-gray-200',
  accent: 'text-blue-400',
  indicator: 'bg-blue-500'
}
const sizeClass = 'max-w-sm text-sm p-4'
const AUTO_HIDE_DELAY = 8000

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
      }, AUTO_HIDE_DELAY)
      return () => clearTimeout(timer)
    }
  }, [lastAnalysis])

  if (!isOverlayVisible || !settings.overlayEnabled) {
    return null
  }

  // Use fixed theme and size

  const adviceDisplay =
    showAdvice && currentAdvice ? (
      <div className={`animate-slideInRight ${sizeClass}`}>
        <div
          className={`${theme.background} rounded-lg shadow-2xl transition-all duration-300 p-4`}
        >
          <div className="flex items-start space-x-3">
            <div className={`w-2 h-2 ${theme.indicator} rounded-full mt-2 flex-shrink-0 animate-pulse`} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className={`${theme.accent} font-medium`}>AI Coach</p>
                {lastAnalysis && (
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
              <p className={`${theme.text} leading-relaxed`}>{currentAdvice}</p>
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
    ) : null

  const statusDisplay = (
    <div className="flex flex-col items-center space-y-2">
      <div className={`${theme.background} rounded-full px-3 py-1 flex items-center space-x-2`}>
        <div
          className={`w-2 h-2 rounded-full ${
            gameDetection?.isGameRunning ? 'bg-green-400 animate-pulse' : 'bg-red-400'
          }`}
        />
        <span className={`${theme.text} text-xs font-medium`}>
          {gameDetection?.isGameRunning ? 'Ravenswatch Detected' : 'Game Not Detected'}
        </span>
      </div>
      {gameDetection?.isGameRunning && (
        <div className={`${theme.background} rounded-full px-3 py-1 flex items-center space-x-2`}>
          <div
            className={`w-2 h-2 rounded-full ${
              isAnalyzing ? 'bg-blue-400 animate-pulse' : 'bg-gray-400'
            }`}
          />
          <span className={`${theme.text} text-xs font-medium`}>
            {isAnalyzing ? 'AI Analyzing' : 'AI Idle'}
          </span>
        </div>
      )}
    </div>
  )

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 flex flex-col items-center justify-center space-y-2"
      style={{ opacity: settings.overlayOpacity }}
    >
      {statusDisplay}
      {adviceDisplay}
    </div>
  )
}

export default GameOverlay
