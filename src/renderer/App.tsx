import React from 'react'
import { useSyncGameCoachStore } from './stores/sync-store'
import ConfigPanel from './components/ConfigPanel'
import GameOverlay from './components/GameOverlay'
import AnalysisEngine from './components/AnalysisEngine'
import SettingsModal from './components/SettingsModal'
import ErrorBoundary from './components/ErrorBoundary'

const App: React.FC = () => {
  const { 
    initializeStore,
    isAnalyzing, 
    isSettingsModalOpen, 
    showOverlay 
  } = useSyncGameCoachStore()
  const isOverlayMode = window.location.hash === '#overlay'

  // Initialize the synchronized store
  React.useEffect(() => {
    console.log('App: Initializing synchronized store...')
    initializeStore()
  }, [initializeStore])

  // Auto-set overlay visibility when in overlay mode
  React.useEffect(() => {
    if (isOverlayMode) {
      console.log('App: Overlay mode detected, setting isOverlayVisible to true')
      showOverlay()
    }
  }, [isOverlayMode, showOverlay])
  // Add global error handlers for debugging
  React.useEffect(() => {
    // Debug electronAPI availability
    console.log('App: Checking electronAPI availability...')
    console.log('App: window.electronAPI exists:', !!window.electronAPI)
    if (window.electronAPI) {
      console.log('App: electronAPI methods:', Object.keys(window.electronAPI))
      console.log('App: getCaptureSource method exists:', !!window.electronAPI.getCaptureSource)
      
      // Test capture sources on startup
      console.log('App: Testing capture sources on startup...')
      window.electronAPI.getCaptureSource()
        .then(sources => {
          console.log('App: Startup capture sources test successful:', sources?.length || 0, 'sources')
        })
        .catch(error => {
          console.error('App: Startup capture sources test failed:', error)
        })
    } else {
      console.error('App: electronAPI is not available!')
    }    // Expose store for debugging in development
    // Check multiple ways to determine if we're in development
    const isDev = process.env.NODE_ENV === 'development' || 
                  !process.env.NODE_ENV || 
                  window.location.hostname === 'localhost' ||
                  window.location.port === '5173'
      console.log('App: Development mode check:', {
      NODE_ENV: process.env.NODE_ENV,
      hostname: window.location.hostname,
      port: window.location.port,
      isDev
    });
    
    if (isDev) {
      // Expose store for debugging - use getState/setState instead of hook
      (window as any).__GAME_COACH_STORE__ = {
        getState: useSyncGameCoachStore.getState,
        setState: useSyncGameCoachStore.setState,
        subscribe: useSyncGameCoachStore.subscribe,
        // Helper methods for easier debugging
        get: () => useSyncGameCoachStore.getState(),
        showOverlay: () => useSyncGameCoachStore.getState().showOverlay(),
        hideOverlay: () => useSyncGameCoachStore.getState().hideOverlay(),
        updateSettings: (settings: any) => useSyncGameCoachStore.getState().updateSettings(settings)
      }
      console.log('App: Game Coach store exposed for debugging as window.__GAME_COACH_STORE__')
      console.log('App: Store exposure verification:', typeof (window as any).__GAME_COACH_STORE__)
      console.log('App: Available store methods:', Object.keys((window as any).__GAME_COACH_STORE__))
      
      // Additional debugging info
      setTimeout(() => {
        console.log('App: Store still available after 1s:', typeof (window as any).__GAME_COACH_STORE__)
      }, 1000)
    } else {
      console.log('App: Not in development mode, store not exposed')
    }

    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error)
      console.error('Error message:', event.message)
      console.error('Error filename:', event.filename)
      console.error('Error line:', event.lineno)
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])
  if (isOverlayMode) {
    return (
      <ErrorBoundary>
        <GameOverlay />
      </ErrorBoundary>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Analysis Engine - invisible component that orchestrates LLM workflow */}
      <AnalysisEngine isEnabled={isAnalyzing} />

      <header className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-primary-400">
                Ravenswatch Game Coach
              </h1>
            </div>            <div className="text-sm text-gray-400">
              v0.2.0 - Phase 1 Improvements
            </div>
          </div>
        </div>
      </header>      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <ConfigPanel />
        </div>
      </main>

      {/* Settings Modal */}
      {isSettingsModalOpen && <SettingsModal />}
    </div>
  )
}

export default App
