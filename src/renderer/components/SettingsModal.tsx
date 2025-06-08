import React, { useState, useEffect } from 'react'
import { useSyncGameCoachStore } from '../stores/sync-store'
import InstructionTemplate from './instructions/InstructionTemplate'
import OverlayTestSuite from './overlay-testing/OverlayTestSuite'
import {
  type ScreenSourceClient,
  ElectronScreenSourceClient,
} from '../ipc/screen-source-client'
import {
  type TemplateClient,
  ElectronTemplateClient,
} from '../ipc/template-client'

interface SettingsModalProps {
  screenSourceClient?: ScreenSourceClient
  templateClient?: TemplateClient
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  screenSourceClient: _screenSourceClient = new ElectronScreenSourceClient(),
  templateClient: _templateClient = new ElectronTemplateClient(),
}) => {
  const {
    settings,
    updateSettings,
    isSettingsModalOpen,
    setSettingsModalOpen,
    isLoading,
    error,
    isOverlayVisible,
    showOverlay,
    hideOverlay,
    setGameDetection,
    setGameState,
    setLastAnalysis,
    setAnalyzing,
  } = useSyncGameCoachStore()
  const [localSettings, setLocalSettings] = useState(settings)
  const [activeTab, setActiveTab] = useState<'api' | 'overlay' | 'instructions' | 'tts' | 'performance' | 'general'>('api')
  // Sync local settings when store settings change
  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleSave = async () => {
    try {
      console.log('SettingsModal: Starting save process...')

      console.log('SettingsModal: Current localSettings:', localSettings)
      
      await updateSettings(localSettings)
      console.log('SettingsModal: Settings updated successfully')
      
      setSettingsModalOpen(false)
      console.log('SettingsModal: Modal closed')
    } catch (error) {
      console.error('SettingsModal: Failed to save settings:', error)
      // Don't close the modal if saving failed
    }
  }

  const handleCancel = () => {
    setLocalSettings(settings) // Reset to original settings
    setSettingsModalOpen(false)
  }

  const updateLocalSetting = <K extends keyof typeof localSettings>(
    key: K,
    value: typeof localSettings[K]
  ) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleToggleOverlay = async () => {
    if (isOverlayVisible) {
      await hideOverlay()
    } else {
      await showOverlay()
    }
  }

  const handleTestAdvice = () => {
    const originalSize = settings.overlaySize
    if (originalSize !== 'large') {
      updateSettings({ overlaySize: 'large' })
    }
    const testAnalysis = {
      advice:
        'Test advice: Focus on dodging enemy attacks and look for openings to counter-attack.',
      confidence: 0.85,
      provider: 'test',
      analysisTime: 120,
      timestamp: Date.now(),
      category: 'combat' as const,
    }
    setLastAnalysis(testAnalysis)
    if (originalSize !== 'large') {
      setTimeout(() => {
        updateSettings({ overlaySize: originalSize })
      }, settings.autoHideDelay * 1000 + 500)
    }
  }

  const handleTestAutomaticFlow = async () => {
    try {
      if (!settings.overlayEnabled) {
        updateSettings({ overlayEnabled: true })
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      await showOverlay()

      const mockDetection = {
        isGameRunning: true,
        confidence: 0.9,
        detectionMethod: 'test',
        gameWindow: {
          id: 'test',
          name: 'Test Ravenswatch',
          executable: 'ravenswatch.exe',
          isActive: true,
        },
      }
      setGameDetection(mockDetection)
      setGameState({ isRavenswatchDetected: true })

      setTimeout(() => {
        setAnalyzing(true)
      }, 2000)
    } catch (error) {
      console.error('SettingsModal: Automatic flow test failed:', error)
    }
  }

  const handleForceContent = async () => {
    try {
      if (!settings.overlayEnabled) {
        updateSettings({ overlayEnabled: true })
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      await showOverlay()
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockDetection = {
        isGameRunning: true,
        confidence: 0.95,
        detectionMethod: 'forced-test',
        gameWindow: {
          id: 'test-force',
          name: 'Test Ravenswatch (Forced)',
          executable: 'ravenswatch.exe',
          isActive: true,
        },
      }
      setGameDetection(mockDetection)
      setGameState({ isRavenswatchDetected: true })

      setAnalyzing(true)

      const testAnalysis = {
        advice:
          '🎯 FORCE CONTENT TEST: This advice should be visible in the overlay! The system is working correctly if you can see this message along with all the colorful debug panels.',
        confidence: 0.95,
        provider: 'force-test',
        analysisTime: 50,
        timestamp: Date.now(),
        category: 'test' as const,
      }
      setLastAnalysis(testAnalysis)
    } catch (error) {
      console.error('SettingsModal: Force Content failed:', error)
    }
  }

  if (!isSettingsModalOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {[
            { id: 'api', label: 'API Keys' },
            { id: 'overlay', label: 'Overlay' },
            { id: 'instructions', label: 'Instructions' },
            { id: 'tts', label: 'Text-to-Speech' },
            { id: 'performance', label: 'Performance' },
            { id: 'general', label: 'General' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 font-medium transition-colors text-sm ${
                activeTab === tab.id
                  ? 'text-primary-400 border-b-2 border-primary-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {/* API Keys Tab */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  LLM Provider
                </label>
                <select
                  value={localSettings.llmProvider}
                  onChange={(e) => updateLocalSetting('llmProvider', e.target.value as 'openai' | 'gemini')}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="openai">OpenAI GPT-4 Vision</option>
                  <option value="gemini">Google Gemini Vision</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={localSettings.openaiApiKey}
                  onChange={(e) => updateLocalSetting('openaiApiKey', e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Get your API key from <a href="https://platform.openai.com" className="text-primary-400 hover:underline">OpenAI Platform</a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  value={localSettings.geminiApiKey}
                  onChange={(e) => updateLocalSetting('geminiApiKey', e.target.value)}
                  placeholder="AI..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Get your API key from <a href="https://makersuite.google.com" className="text-primary-400 hover:underline">Google AI Studio</a>
                </p>
              </div>
            </div>
          )}          {/* Overlay Tab */}
          {activeTab === 'overlay' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Enable Overlay
                  </label>
                  <p className="text-xs text-gray-400">Show advice overlay during gameplay</p>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.overlayEnabled}
                  onChange={(e) => updateLocalSetting('overlayEnabled', e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Overlay Theme
                </label>
                <select
                  value={localSettings.overlayTheme}
                  onChange={(e) => updateLocalSetting('overlayTheme', e.target.value as 'dark' | 'light' | 'minimal')}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="dark">Dark (Gaming Optimized)</option>
                  <option value="light">Light</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Overlay Size
                </label>
                <select
                  value={localSettings.overlaySize}
                  onChange={(e) => updateLocalSetting('overlaySize', e.target.value as 'small' | 'medium' | 'large')}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Overlay Opacity: {Math.round(localSettings.overlayOpacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0.3"
                  max="1"
                  step="0.1"
                  value={localSettings.overlayOpacity}
                  onChange={(e) => updateLocalSetting('overlayOpacity', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Auto-Hide Delay (seconds)
                </label>
                <input
                  type="number"
                  min="3"
                  max="30"
                  value={localSettings.autoHideDelay}
                  onChange={(e) => updateLocalSetting('autoHideDelay', parseInt(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Time before advice automatically disappears
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Show Confidence Score
                  </label>
                  <p className="text-xs text-gray-400">Display AI confidence in advice</p>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.showConfidenceScore}
                  onChange={(e) => updateLocalSetting('showConfidenceScore', e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Advice Frequency (seconds)
                </label>
                <input
                  type="number"
                  min="3"
                  max="30"
                  value={localSettings.adviceFrequency}
                  onChange={(e) => updateLocalSetting('adviceFrequency', parseInt(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Minimum time between advice suggestions
                </p>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-300">Overlay Control</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${isOverlayVisible ? 'bg-green-400' : 'bg-gray-500'}`}></span>
                    <span className="text-xs text-gray-400">
                      {isOverlayVisible ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-gray-400 mb-3">
                  <div>
                    Status:
                    <span className={isOverlayVisible ? 'text-green-300' : 'text-red-300'}>
                      {isOverlayVisible ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    Enabled in Settings:
                    <span className={settings.overlayEnabled ? 'text-green-300' : 'text-red-300'}>
                      {settings.overlayEnabled ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    Theme: <span className="text-white capitalize">{settings.overlayTheme}</span>
                  </div>
                  <div>
                    Size: <span className="text-white capitalize">{settings.overlaySize}</span>
                  </div>
                </div>

                <button
                  onClick={handleToggleOverlay}
                  disabled={!settings.overlayEnabled}
                  className={isOverlayVisible ? 'btn-danger text-xs' : 'btn-primary text-xs'}
                >
                  {isOverlayVisible ? 'Hide Overlay' : 'Show Overlay'}
                </button>
                {isOverlayVisible && (
                  <button onClick={handleTestAdvice} className="btn-secondary text-xs ml-2">
                    Test Advice
                  </button>
                )}
                <button onClick={handleTestAutomaticFlow} className="btn-secondary text-xs ml-2">
                  Test Auto Flow
                </button>
                <button
                  onClick={handleForceContent}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs ml-2"
                >
                  Force Content
                </button>

                {!settings.overlayEnabled && (
                  <p className="text-xs text-yellow-300 mt-2">Enable overlay in settings first</p>
                )}
              </div>

              <OverlayTestSuite />
            </div>
          )}
          {/* Instructions Tab */}
          {activeTab === 'instructions' && (
            <div className="h-96 overflow-y-auto p-2">
              <InstructionTemplate />
            </div>
          )}


          {/* TTS Tab */}
          {activeTab === 'tts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Enable Text-to-Speech
                  </label>
                  <p className="text-xs text-gray-400">Read advice aloud using AI voice</p>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.ttsEnabled}
                  onChange={(e) => updateLocalSetting('ttsEnabled', e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Urgent Advice Only
                  </label>
                  <p className="text-xs text-gray-400">Only speak critical/urgent advice</p>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.ttsOnlyUrgent}
                  onChange={(e) => updateLocalSetting('ttsOnlyUrgent', e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  TTS Voice
                </label>
                <input
                  type="text"
                  value={localSettings.ttsVoice}
                  onChange={(e) => updateLocalSetting('ttsVoice', e.target.value)}
                  placeholder="Auto-select best voice"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Leave blank for automatic voice selection optimized for gaming
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Speech Speed: {localSettings.ttsSpeed}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={localSettings.ttsSpeed}
                  onChange={(e) => updateLocalSetting('ttsSpeed', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Slow</span>
                  <span>Normal</span>
                  <span>Fast</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Speech Volume: {Math.round(localSettings.ttsVolume * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={localSettings.ttsVolume}
                  onChange={(e) => updateLocalSetting('ttsVolume', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-400 mb-2">🎮 Gaming TTS Optimizations</h3>
                <ul className="text-xs text-blue-300 space-y-1">
                  <li>• Gaming terminology preprocessing (HP → health points)</li>
                  <li>• Intelligent urgency detection for critical situations</li>
                  <li>• Voice selection optimized for clarity during gameplay</li>
                  <li>• Quick speech synthesis for real-time advice</li>
                </ul>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Frame Processing Quality
                </label>
                <select
                  value={localSettings.frameProcessingQuality}
                  onChange={(e) => updateLocalSetting('frameProcessingQuality', e.target.value as 'low' | 'medium' | 'high')}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="low">Low (Fast, Basic Analysis)</option>
                  <option value="medium">Medium (Balanced)</option>
                  <option value="high">High (Detailed, Slower)</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Higher quality provides better advice but uses more CPU/GPU
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Enable HUD Region Detection
                  </label>
                  <p className="text-xs text-gray-400">Focus analysis on UI elements</p>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.enableHUDRegionDetection}
                  onChange={(e) => updateLocalSetting('enableHUDRegionDetection', e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Advice History
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={localSettings.maxAdviceHistory}
                  onChange={(e) => updateLocalSetting('maxAdviceHistory', parseInt(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Number of previous advice entries to keep in memory
                </p>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
                <h3 className="text-sm font-medium text-yellow-400 mb-2">⚡ Performance Tips</h3>
                <ul className="text-xs text-yellow-300 space-y-1">
                  <li>• Lower frame processing quality for better FPS</li>
                  <li>• Disable HUD detection if not needed</li>
                  <li>• Reduce advice history for lower memory usage</li>
                  <li>• Enable "Urgent Only" TTS to reduce processing</li>
                </ul>
              </div>
            </div>
          )}

          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-2">About</h3>
                <div className="space-y-1 text-xs text-gray-400">
                  <div>Version: 0.1.0</div>
                  <div>Target Game: Ravenswatch</div>
                  <div>Status: Phase 3 Complete - Advanced Features</div>
                </div>
              </div>

              <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-400 mb-2">✅ Phase 3 Complete - Advanced Features</h3>
                <ul className="text-xs text-green-300 space-y-1">
                  <li>• Enhanced TTS with gaming optimizations</li>
                  <li>• Advanced overlay themes and customization</li>
                  <li>• Intelligent urgency detection</li>
                  <li>• Performance optimization controls</li>
                  <li>• Ravenswatch-specific HUD analysis</li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-red-400 mb-2">Error</h3>
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700">
          <button
            onClick={handleCancel}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
