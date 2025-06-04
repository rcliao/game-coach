import React from 'react'

interface AdviceDisplayProps {
  advice: string
  category: 'combat' | 'exploration' | 'items' | 'general'
  confidence: number
  onDismiss: () => void
}

const AdviceDisplay: React.FC<AdviceDisplayProps> = ({
  advice,
  category,
  confidence,
  onDismiss,
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'combat':
        return '⚔️'
      case 'exploration':
        return '🗺️'
      case 'items':
        return '🎒'
      default:
        return '💡'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'combat':
        return 'border-red-500/50 bg-red-900/20'
      case 'exploration':
        return 'border-blue-500/50 bg-blue-900/20'
      case 'items':
        return 'border-yellow-500/50 bg-yellow-900/20'
      default:
        return 'border-primary-500/50 bg-primary-900/20'
    }
  }

  return (
    <div className={`${getCategoryColor(category)} border rounded-lg p-4 backdrop-blur-sm`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getCategoryIcon(category)}</span>
          <span className="text-sm font-medium text-white capitalize">
            {category} Advice
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-xs text-gray-400">
            {Math.round(confidence * 100)}% confident
          </div>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>
      </div>
      
      <p className="text-white text-sm leading-relaxed">
        {advice}
      </p>
      
      {/* Confidence indicator */}
      <div className="mt-3">
        <div className="w-full bg-gray-700 rounded-full h-1">
          <div
            className="bg-primary-500 h-1 rounded-full transition-all duration-300"
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default AdviceDisplay
