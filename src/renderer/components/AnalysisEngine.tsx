import React, { useEffect, useState, useCallback } from 'react'
import { useSyncGameCoachStore } from '../stores/sync-store'
import type { AnalysisRequest } from '../services/llm-service'
import { rendererScreenCapture } from '../services/screen-capture-renderer'
import {
  type ScreenSourceClient,
  ElectronScreenSourceClient,
} from '../ipc/screen-source-client'

const ADVICE_FREQUENCY = 5

export const detectUrgentAdvice = (advice: string, confidence: number): boolean => {
  if (confidence < 0.7) return false

  const urgentKeywords = [
    'danger', 'urgent', 'immediately', 'now', 'quickly', 'fast',
    'critical', 'low health', 'low hp', 'dying', 'escape', 'run',
    'dodge', 'avoid', 'move', 'retreat', 'heal', 'potion',
    'boss', 'elite', 'powerful enemy', 'dangerous'
  ]

  const lowerAdvice = advice.toLowerCase()
  return urgentKeywords.some(keyword => lowerAdvice.includes(keyword))
}

interface AnalysisEngineProps {
  isEnabled: boolean
  screenSourceClient?: ScreenSourceClient
}

export const AnalysisEngine: React.FC<AnalysisEngineProps> = ({
  isEnabled,
  screenSourceClient = new ElectronScreenSourceClient()
}) => {
  const {
    llmService,
    initializeLLMService,
    selectedSourceId,
    setCaptureActive,
    setAnalyzing,
    setLastAnalysis,
    addAdvice,
    settings,
    setLastCaptureTime,
  } = useSyncGameCoachStore()
  
  const [analysisInterval, setAnalysisInterval] = useState<NodeJS.Timeout | null>(null)
  const [isLocallyAnalyzing, setIsLocallyAnalyzing] = useState(false)

  // Helper functions declared with useCallback to prevent infinite loops
  const captureFrame = useCallback(async (): Promise<Buffer | null> => {
    try {
      if (!rendererScreenCapture.isCurrentlyCapturing()) {
        console.warn('Screen capture not active')
        return null
      }

      const frameData = await rendererScreenCapture.captureFrame()
      if (frameData) {
        console.log('Successfully captured frame:', frameData.length, 'bytes')

        // Save frame for debugging in development
        if (process.env.NODE_ENV === 'development' && screenSourceClient.captureFrame) {
          screenSourceClient.captureFrame().catch(console.error)
        }
      }
      
      return frameData
    } catch (error) {
      console.error('Frame capture failed:', error)
      return null
    }
  }, [])

  const detectUrgentAdviceMemo = useCallback(detectUrgentAdvice, [])

  // Fixed performAnalysis function to prevent infinite loop
  const performAnalysis = useCallback(async () => {
    console.log('AnalysisEngine: performAnalysis() called', {
      llmService: !!llmService,
      llmServiceReady: llmService?.isReady(),
      selectedSourceId: !!selectedSourceId,
      isLocallyAnalyzing,
      providers: llmService?.getAvailableProviders?.()
    })

    if (!llmService) {
      console.warn('AnalysisEngine: No LLM service available')
      return
    }

    if (!llmService.isReady()) {
      console.warn('AnalysisEngine: LLM service not ready', {
        providers: llmService.getAvailableProviders?.(),
        config: 'hidden for security'
      })
      return
    }

    if (!selectedSourceId) {
      console.warn('AnalysisEngine: No screen source selected')
      return
    }

    // Use local flag to prevent race conditions
    if (isLocallyAnalyzing) {
      console.warn('AnalysisEngine: Already analyzing locally, skipping')
      return
    }

    try {
      console.log('AnalysisEngine: ✅ Starting analysis...')
      setIsLocallyAnalyzing(true)
      setAnalyzing(true)
      
      // Capture current frame
      console.log('AnalysisEngine: Capturing frame...')
      const frameData = await captureFrame()
      if (!frameData) {
        console.warn('AnalysisEngine: No frame data captured')
        return
      }

      console.log('AnalysisEngine: Frame captured successfully, size:', frameData.length, 'bytes')

      const prompt = settings.systemInstruction

      const analysisRequest: AnalysisRequest = {
        imageBuffer: frameData,
        prompt
      }

      console.log('AnalysisEngine: Sending analysis request to LLM...')
      
        console.log('AnalysisEngine: 🤖 About to call llmService.analyzeGameplay()', {
          llmService: llmService.constructor.name,
          isReady: llmService.isReady(),
          providers: llmService.getAvailableProviders?.(),
          requestSize: analysisRequest.imageBuffer.length,
          promptLength: analysisRequest.prompt.length
        })
      
      // Perform LLM analysis with timeout
      let result
      try {
        console.log('AnalysisEngine: 🚀 Calling llmService.analyzeGameplay()...')
        
        // Add a timeout to prevent hanging
        const analysisPromise = llmService.analyzeGameplay(analysisRequest)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Analysis timeout after 30 seconds')), 30000)
        )
        
        result = await Promise.race([analysisPromise, timeoutPromise]) as any
        
        if (!result || !result.advice) {
          throw new Error('LLM returned empty or invalid result')
        }
        
        console.log('AnalysisEngine: 🎉 LLM analysis complete!', {
          success: true,
          adviceLength: result.advice?.length,
          confidence: result.confidence,
          provider: result.provider,
          analysisTime: result.analysisTime,
          timestamp: result.timestamp
        })
      } catch (error) {
        console.error('AnalysisEngine: ❌ LLM analysis failed:', error)
        
        // Create a fallback result for better error handling
        result = {
          advice: `Analysis temporarily unavailable: ${error instanceof Error ? error.message : 'Unknown error'}. The system is working but the AI provider may be experiencing issues.`,
          confidence: 0.1,
          provider: 'error',
          analysisTime: 0,
          timestamp: Date.now()
        }
        
        console.log('AnalysisEngine: Using fallback result due to LLM error')
      }

      setLastAnalysis(result)

      // Add to advice history
      addAdvice({
        id: Date.now().toString(),
        content: result.advice,
        timestamp: result.timestamp,
        confidence: result.confidence,
        provider: result.provider as 'gemini',
        analysisTime: result.analysisTime,
      })

      setLastCaptureTime(Date.now())
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      console.log('AnalysisEngine: Analysis complete, resetting flags...')
      setIsLocallyAnalyzing(false)
      setAnalyzing(false)
    }
  }, [llmService, selectedSourceId, isLocallyAnalyzing, setAnalyzing, setLastAnalysis, addAdvice, settings, setLastCaptureTime, captureFrame, detectUrgentAdviceMemo])

  const stopAnalysisLoop = useCallback(() => {
    console.log('AnalysisEngine: stopAnalysisLoop() called', {
      hasInterval: !!analysisInterval,
      intervalId: analysisInterval,
      captureActive: rendererScreenCapture.isCurrentlyCapturing()
    })
    if (analysisInterval) {
      console.log('AnalysisEngine: Clearing interval:', analysisInterval)
      clearInterval(analysisInterval)
      setAnalysisInterval(null)
      console.log('AnalysisEngine: Interval cleared and state reset')
    }
    setCaptureActive(false)

    // Stop actual screen capture
    if (rendererScreenCapture.isCurrentlyCapturing()) {
      console.log('AnalysisEngine: Stopping screen capture...')
      rendererScreenCapture.stopCapture()
      console.log('AnalysisEngine: Screen capture stopped')
    }
  }, [analysisInterval, setCaptureActive])
  
  const startAnalysisLoop = useCallback(() => {
    console.log('AnalysisEngine: startAnalysisLoop() called', {
      hasExistingInterval: !!analysisInterval,
      intervalId: analysisInterval,
      selectedSourceId,
      captureCurrentlyActive: rendererScreenCapture.isCurrentlyCapturing(),
      adviceFrequency: ADVICE_FREQUENCY
    })

    if (analysisInterval) {
      console.log('AnalysisEngine: Analysis interval already exists, skipping. Interval ID:', analysisInterval)
      return
    }

    console.log('AnalysisEngine: Creating analysis interval with frequency:', ADVICE_FREQUENCY, 'seconds')
    const interval = setInterval(async () => {
      console.log('AnalysisEngine: ⏰ INTERVAL FIRED! Calling performAnalysis()...')
      console.log('AnalysisEngine: Interval context:', {
        timestamp: new Date().toISOString(),
        llmServiceExists: !!llmService,
        llmServiceReady: llmService?.isReady(),
        selectedSourceId: !!selectedSourceId,
        isLocallyAnalyzing,
        captureActive: rendererScreenCapture.isCurrentlyCapturing()
      })
      
      // Don't await performAnalysis to prevent blocking the interval
      performAnalysis().catch((error: any) => {
        console.error('AnalysisEngine: Interval analysis failed:', error)
      })
    }, ADVICE_FREQUENCY * 1000)

    setAnalysisInterval(interval)
    setCaptureActive(true)

    // Start actual screen capture
    if (selectedSourceId && !rendererScreenCapture.isCurrentlyCapturing()) {
      console.log('AnalysisEngine: Starting screen capture for source:', selectedSourceId)
      rendererScreenCapture.startCapture(selectedSourceId)
    } else if (!selectedSourceId) {
      console.warn('AnalysisEngine: No selectedSourceId available for screen capture')
    } else {
      console.log('AnalysisEngine: Screen capture already active')
    }

    console.log('AnalysisEngine: Analysis loop started successfully')
  }, [analysisInterval, selectedSourceId, llmService, isLocallyAnalyzing, setCaptureActive, performAnalysis])

  // Debug function to manually test LLM integration
  const debugTestLLM = useCallback(async () => {
    console.log('🔧 DEBUG: Manual LLM test triggered')
    await performAnalysis()
  }, [performAnalysis])

  // Expose debug function to window for manual testing
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as any).debugTestLLM = debugTestLLM
      console.log('🔧 DEBUG: debugTestLLM() function available on window for manual testing')
    }
  }, [debugTestLLM])

  // Initialize LLM service when settings change
  useEffect(() => {
    console.log('AnalysisEngine: Settings changed, checking LLM initialization...')
    console.log('AnalysisEngine: Gemini key present:', !!settings.geminiApiKey)

    if (settings.geminiApiKey) {
      console.log('AnalysisEngine: Initializing LLM service...')
      initializeLLMService().then(() => {
        console.log('AnalysisEngine: LLM service initialization complete')
      }).catch((error: any) => {
        console.error('AnalysisEngine: LLM service initialization failed:', error)
      })
    } else {
      console.log('AnalysisEngine: No API keys available, skipping LLM initialization')
    }
  }, [settings.geminiApiKey, initializeLLMService])

  // Start/stop analysis loop - this is the main effect that controls the analysis
  useEffect(() => {
    console.log('AnalysisEngine: Analysis loop effect triggered', {
      isEnabled,
      llmReady: llmService?.isReady(),
      llmService: !!llmService,
      selectedSourceId: !!selectedSourceId
    })
    
    // Check each condition individually for better debugging
    if (!isEnabled) {
      console.log('AnalysisEngine: Analysis disabled by isEnabled flag')
    }
    if (!llmService) {
      console.log('AnalysisEngine: LLM service not available')
    }
    if (llmService && !llmService.isReady()) {
      console.log('AnalysisEngine: LLM service not ready:', {
        providers: llmService.getAvailableProviders?.()
      })
    }
    if (!selectedSourceId) {
      console.log('AnalysisEngine: No screen source selected')
    }
    
    // Simplified condition: start if enabled, LLM ready, and source selected
    // Remove dependency on game detection for now to allow testing
    if (isEnabled && llmService?.isReady() && selectedSourceId) {
      console.log('AnalysisEngine: Starting analysis loop - core conditions met')
      startAnalysisLoop()
    } else {
      console.log('AnalysisEngine: Stopping analysis loop - conditions not met')
      stopAnalysisLoop()
    }

    return () => stopAnalysisLoop()
  }, [isEnabled, llmService?.isReady(), selectedSourceId, startAnalysisLoop, stopAnalysisLoop])

  // Component doesn't render anything - it's just logic
  return null
}

export default AnalysisEngine
