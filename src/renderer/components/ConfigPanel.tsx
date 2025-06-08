import React from 'react'
import { useSyncGameCoachStore } from '../stores/sync-store'
import {
  type ScreenSourceClient,
  ElectronScreenSourceClient,
} from '../ipc/screen-source-client'

interface ConfigPanelProps {
  screenSourceClient?: ScreenSourceClient
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({
  screenSourceClient = new ElectronScreenSourceClient(),
}) => {
  const {
    settings,
    isAnalyzing,
    gameDetection,
    lastAnalysis,
    error,
    startGameDetection,
    stopGameDetection,
    setSettingsModalOpen,
    initializeLLMService,
    setAnalyzing,
    gameState,
    selectedSourceId,
    setSelectedSource,
    llmService,
  } = useSyncGameCoachStore()// Screen sources state
  const [screenSources, setScreenSources] = React.useState<any[]>([])
  const [isLoadingSources, setIsLoadingSources] = React.useState(false)
  const [isInitializingLLM, setIsInitializingLLM] = React.useState(false)
  const [llmStatus, setLLMStatus] = React.useState<'not-configured' | 'ready' | 'error'>('not-configured')  // Load screen sources on component mount
  React.useEffect(() => {
    loadScreenSources()
  }, [])

  const loadScreenSources = async () => {
    setIsLoadingSources(true)
    try {
      console.log('ConfigPanel: Loading screen sources...')
      const sources = await screenSourceClient.getCaptureSources()
      console.log('ConfigPanel: Loaded sources:', sources?.length || 0)
      setScreenSources(sources || [])
    } catch (error) {
      console.error('ConfigPanel: Failed to load screen sources:', error)
    } finally {
      setIsLoadingSources(false)
    }
  }
  const handleSelectSource = (sourceId: string) => {
    console.log('ConfigPanel: Selecting source:', sourceId)
    setSelectedSource(sourceId)
  }  // Unified handler that coordinates LLM initialization, game detection and analysis
  const handleStartCoaching = async () => {
    console.log('ConfigPanel: Starting unified coaching workflow...')
    
    if (isAnalyzing) {
      // Stop everything
      console.log('ConfigPanel: Stopping analysis and game detection...')
      await setAnalyzing(false)
      stopGameDetection()
      return
    }
    
    try {
      // Step 1: Ensure we have a selected screen source
      if (!selectedSourceId) {
        console.log('ConfigPanel: No screen source selected')
        return
      }      // Step 2: Ensure LLM service is initialized
      if (!isProviderConfigured) {
        console.log('ConfigPanel: LLM provider not configured')
        return
      }

      setIsInitializingLLM(true)
      setLLMStatus('not-configured')
      
      try {
        console.log('ConfigPanel: Initializing LLM service...')
        await initializeLLMService()
        
        // Wait a moment for LLM service to be ready
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Verify LLM service is actually ready
        const { llmService } = useSyncGameCoachStore.getState()
        if (llmService?.isReady()) {
          setLLMStatus('ready')
          console.log('ConfigPanel: LLM service confirmed ready')
        } else {
          throw new Error('LLM service not ready after initialization')
        }
      } catch (error) {
        console.error('ConfigPanel: LLM initialization failed:', error)
        setLLMStatus('error')
        return
      } finally {
        setIsInitializingLLM(false)
      }
      
      // Step 3: Start game detection
      console.log('ConfigPanel: Starting game detection...')
      startGameDetection()
      
      // Step 4: Start analysis immediately (don't wait for game detection)
      // The AnalysisEngine will handle the coordination properly
      console.log('ConfigPanel: Starting analysis...')
      await setAnalyzing(true)
      
      console.log('ConfigPanel: Unified coaching workflow started successfully')
    } catch (error) {
      console.error('ConfigPanel: Failed to start coaching workflow:', error)
    }
  }

  const isProviderConfigured = settings.llmProvider === 'openai' 
    ? !!settings.openaiApiKey 
    : !!settings.geminiApiKey

  const handleInitializeLlm = async () => {
    if (isProviderConfigured) {
      setIsInitializingLLM(true)
      try {
        await initializeLLMService()
        setLLMStatus('ready')
      } catch (error) {
        console.error('Manual LLM initialization failed:', error)
        setLLMStatus('error')      } finally {
        setIsInitializingLLM(false)
      }
    }
  }
  
  const gameDetected = gameState.isRavenswatchDetected
  const isGameDetectionRunning = !!gameDetection

  // Monitor LLM service status
  React.useEffect(() => {
    if (llmService?.isReady()) {
      setLLMStatus('ready')
    } else if (isProviderConfigured) {
      setLLMStatus('not-configured')
    }
  }, [llmService, isProviderConfigured])

  // Debug logging for state changes
  React.useEffect(() => {
    console.log('ConfigPanel: gameDetected state changed to:', gameDetected)
    console.log('ConfigPanel: gameDetection object:', gameDetection)
    console.log('ConfigPanel: isGameDetectionRunning:', isGameDetectionRunning)
  }, [gameDetected, gameDetection, isGameDetectionRunning])

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Game Coach Control Panel</h2>
        <button
          onClick={() => setSettingsModalOpen(true)}
          className="btn-secondary text-sm"
        >
          Settings
        </button>
      </div>

      {/* LLM Provider Status */}
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">LLM Provider Status</h3>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            isProviderConfigured ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
          }`}>
            {isProviderConfigured ? 'Configured' : 'Not Configured'}
          </span>
        </div>
          <div className="space-y-2 text-xs text-gray-400">
          <div>Provider: <span className="text-white capitalize">{settings.llmProvider}</span></div>
          <div>API Key: <span className="text-white">
            {isProviderConfigured ? '••••••••' : 'Not set'}
          </span></div>
          <div>Status: <span className={`text-white ${
            llmStatus === 'ready' ? 'text-green-300' : 
            llmStatus === 'error' ? 'text-red-300' : 'text-yellow-300'
          }`}>
            {isInitializingLLM ? 'Initializing...' :
             llmStatus === 'ready' ? 'Ready' :
             llmStatus === 'error' ? 'Error' : 'Not Initialized'}
          </span></div>
        </div>

        {!isProviderConfigured && (
          <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded">
            <p className="text-xs text-yellow-300">
              Please configure your API key in settings to enable AI analysis.
            </p>
          </div>
        )}        {isProviderConfigured && (
          <button
            onClick={handleInitializeLlm}
            disabled={isInitializingLLM}
            className="mt-3 btn-primary text-xs"
          >
            {isInitializingLLM ? 'Initializing...' : 'Initialize LLM Service'}
          </button>
        )}
      </div>

      {/* Screen Source Selection */}
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">Screen Source</h3>
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${
              selectedSourceId ? 'bg-green-400' : 'bg-gray-500'
            }`}></span>
            <span className="text-xs text-gray-400">
              {selectedSourceId ? 'Selected' : 'Not Selected'}
            </span>
          </div>
        </div>

        <div className="space-y-2 text-xs text-gray-400 mb-3">
          <div>Sources Available: <span className="text-white">{screenSources.length}</span></div>
          <div>Selected Source: <span className="text-white">
            {selectedSourceId ? screenSources.find(s => s.id === selectedSourceId)?.name || 'Unknown' : 'None'}
          </span></div>
        </div>

        {!selectedSourceId && (
          <div className="mb-3 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded">
            <p className="text-xs text-yellow-300">
              Please select a screen source to enable game detection and analysis.
            </p>
          </div>
        )}

        <div className="flex space-x-2 mb-3">
          <button
            onClick={loadScreenSources}
            disabled={isLoadingSources}
            className="btn-secondary text-xs"
          >
            {isLoadingSources ? 'Loading...' : 'Refresh Sources'}
          </button>
        </div>

        {screenSources.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-300">Available Sources:</h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {screenSources.map((source) => (
                <div
                  key={source.id}
                  className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors ${
                    selectedSourceId === source.id
                      ? 'bg-blue-600/30 border border-blue-500/50'
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                  onClick={() => handleSelectSource(source.id)}
                >
                  <img
                    src={source.thumbnail}
                    alt={source.name}
                    className="w-8 h-8 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{source.name}</p>
                    <p className="text-xs text-gray-400">
                      {source.id.includes('screen') ? 'Screen' : 'Window'}
                    </p>
                  </div>
                  {selectedSourceId === source.id && (
                    <div className="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>      {/* Unified Game Coaching Control */}
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">AI Game Coaching</h3>
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${
              isAnalyzing ? 'bg-blue-400 animate-pulse' : 
              isGameDetectionRunning ? 'bg-green-400' : 'bg-gray-500'
            }`}></span>
            <span className="text-xs text-gray-400">
              {isAnalyzing ? 'AI Coaching Active' : 
               isGameDetectionRunning ? 'Detection Running' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="space-y-2 text-xs text-gray-400 mb-3">
          <div>Target Game: <span className="text-white">Ravenswatch</span></div>
          <div>Screen Source: <span className={selectedSourceId ? 'text-green-300' : 'text-red-300'}>
            {selectedSourceId ? 'Selected' : 'Not Selected'}
          </span></div>
          <div>Game Status: <span className={gameDetected ? 'text-green-300' : 'text-red-300'}>
            {gameDetected ? 'Detected' : 'Not Detected'}
          </span></div>
          <div>AI Analysis: <span className={isAnalyzing ? 'text-blue-300' : 'text-gray-300'}>
            {isAnalyzing ? 'Active' : 'Inactive'}
          </span></div>
          <div>Advice Frequency: <span className="text-white">{settings.adviceFrequency}s</span></div>
          <div>Last Analysis: <span className="text-white">
            {lastAnalysis ? new Date(lastAnalysis.timestamp || Date.now()).toLocaleTimeString() : 'Never'}
          </span></div>
          {gameDetection && gameDetection.confidence > 0 && (
            <div>Detection Confidence: <span className="text-white">
              {(gameDetection.confidence * 100).toFixed(1)}%
            </span></div>
          )}
        </div>        <button
          onClick={handleStartCoaching}
          disabled={!isProviderConfigured || !selectedSourceId || isInitializingLLM}
          className={isAnalyzing ? 'btn-danger text-xs' : 'btn-primary text-xs'}
        >
          {isAnalyzing ? 'Stop AI Coaching' : 'Start AI Coaching'}
        </button>

        {!isProviderConfigured && (
          <p className="text-xs text-yellow-300 mt-2">
            Configure API keys to enable AI coaching
          </p>
        )}

        {isProviderConfigured && !selectedSourceId && (
          <p className="text-xs text-yellow-300 mt-2">
            Select a screen source first
          </p>
        )}        {isProviderConfigured && selectedSourceId && !isAnalyzing && !isInitializingLLM && (
          <p className="text-xs text-blue-300 mt-2">
            Ready to start! This will detect the game and begin AI analysis.
          </p>
        )}

        {isInitializingLLM && (
          <p className="text-xs text-yellow-300 mt-2">
            Initializing AI service...
          </p>
        )}
      </div>
      {/* Latest Analysis */}
      {lastAnalysis && (
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Latest Analysis</h3>
          <div className="bg-gray-800 rounded p-3 text-xs text-gray-300">
            <div className="mb-2">
              <span className="text-gray-400">Confidence:</span> 
              <span className="text-white ml-1">{(lastAnalysis.confidence * 100).toFixed(1)}%</span>
            </div>
            <div className="mb-2">
              <span className="text-gray-400">Provider:</span> 
              <span className="text-white ml-1">{lastAnalysis.provider}</span>
            </div>            <div>
              <span className="text-gray-400">Advice:</span>
              <p className="text-white mt-1 leading-relaxed">{lastAnalysis.advice}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-400 mb-2">Error</h3>
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {/* Development Notice */}
      <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-400 mb-2">Phase 2: LLM Integration</h3>
        <p className="text-xs text-blue-300">
          AI-powered gameplay analysis is now available! Configure your API keys and start 
          the analysis engine to receive real-time tactical advice for Ravenswatch.
        </p>
      </div>
    </div>
  )
}

export default ConfigPanel
