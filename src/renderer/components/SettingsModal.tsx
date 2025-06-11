import React, { useState, useEffect } from 'react'
import { useSyncGameCoachStore } from '../stores/sync-store'
import {
  type ScreenSourceClient,
  ElectronScreenSourceClient,
} from '../ipc/screen-source-client'

interface SettingsModalProps {
  screenSourceClient?: ScreenSourceClient
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  screenSourceClient = new ElectronScreenSourceClient(),
}) => {
  const {
    settings,
    updateSettings,
    isSettingsModalOpen,
    setSettingsModalOpen,
    isLoading,
  } = useSyncGameCoachStore()

  const [localSettings, setLocalSettings] = useState(settings)
  const [sources, setSources] = useState<any[]>([])

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  useEffect(() => {
    if (isSettingsModalOpen) {
      screenSourceClient
        .getCaptureSources()
        .then(setSources)
        .catch(console.error)
    }
  }, [isSettingsModalOpen, screenSourceClient])

  const handleSave = async () => {
    await updateSettings(localSettings)
    setSettingsModalOpen(false)
  }

  const handleCancel = () => {
    setLocalSettings(settings)
    setSettingsModalOpen(false)
  }

  const updateRoot = <K extends keyof typeof localSettings>(
    key: K,
    value: typeof localSettings[K]
  ) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }))
  }

  if (!isSettingsModalOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button onClick={handleCancel} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto max-h-96">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Google Gemini API Key</label>
            <input
              type="password"
              value={localSettings.geminiApiKey}
              onChange={e => updateRoot('geminiApiKey', e.target.value)}
              placeholder="AI..."
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">System Instructions</label>
            <textarea
              value={localSettings.systemInstruction}
              onChange={e => updateRoot('systemInstruction', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white h-32 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Capture Source</label>
            <select
              value={localSettings.captureSourceId ?? ''}
              onChange={e => updateRoot('captureSourceId', e.target.value || null)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select source</option>
              {sources.map(src => (
                <option key={src.id} value={src.id}>
                  {src.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-300">Enable Overlay</label>
            </div>
            <input
              type="checkbox"
              checked={localSettings.overlayEnabled}
              onChange={e => updateRoot('overlayEnabled', e.target.checked)}
              className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
            />
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
              onChange={e => updateRoot('overlayOpacity', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700">
          <button onClick={handleCancel} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isLoading} className="btn-primary">
            {isLoading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
