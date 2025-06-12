import {
  type GeminiClient,
  createDefaultGeminiClient,
} from './external-clients'

export interface LLMConfig {
  geminiApiKey: string
  maxRetries?: number
  timeout?: number
}

export interface AnalysisRequest {
  imageBuffer: Buffer
  prompt: string
}

export interface AnalysisResponse {
  advice: string
  confidence: number
  provider: string
  timestamp: number
  analysisTime: number
}

export class LLMService {
  private config: LLMConfig
  private geminiClient?: GeminiClient
  private geminiFactory: (key: string) => GeminiClient

  constructor(
    config: LLMConfig,
    factories?: {
      createGemini?: (key: string) => GeminiClient
    }
  ) {
    console.log('LLMService: Constructor called with config:', {
      hasGemini: !!config.geminiApiKey
    })

    this.config = {
      geminiApiKey: config.geminiApiKey,
      maxRetries: config.maxRetries ?? 3,
      timeout: config.timeout ?? 30000
    }
    this.geminiFactory = factories?.createGemini ?? createDefaultGeminiClient

    try {
      this.initializeGemini()
      console.log('LLMService: Gemini initialized successfully')
    } catch (error) {
      console.error('LLMService: Error in constructor:', error)
      throw error
    }
  }
  private initializeGemini() {
    console.log('LLMService: Initializing Gemini client...')
    if (!this.config.geminiApiKey) {
      throw new Error('Gemini API key is required')
    }
    try {
      this.geminiClient = this.geminiFactory(this.config.geminiApiKey)
      console.log('LLMService: Gemini client created')
    } catch (error) {
      console.error('LLMService: Error initializing Gemini:', error)
      throw error
    }
  }

  public updateConfig(newConfig: Partial<LLMConfig>) {
    this.config = { ...this.config, ...newConfig }
    this.initializeGemini()
  }

  public async analyzeGameplay(request: AnalysisRequest): Promise<AnalysisResponse> {
    const startTime = Date.now()
    
    try {
      if (!this.geminiClient) {
        this.initializeGemini()
      }

      const prompt = this.buildPrompt(request)
      const advice = await this.retryWithBackoff(
        () => this.analyzeWithGemini(request.imageBuffer, prompt),
        this.config.maxRetries!
      )

      return {
        advice,
        confidence: this.calculateConfidence(advice),
        provider: 'gemini',
        timestamp: Date.now(),
        analysisTime: Date.now() - startTime,
      }
    } catch (error) {
      console.error('LLM analysis failed:', error)
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private buildPrompt(request: AnalysisRequest): string {
    return request.prompt
  }

  private async analyzeWithGemini(imageBuffer: Buffer, prompt: string): Promise<string> {
    if (!this.geminiClient) {
      throw new Error('Gemini client not initialized')
    }

    const model = this.geminiClient.getGenerativeModel({ model: 'gemini-pro-vision' })

    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: 'image/jpeg',
      },
    }

    const result = await model.generateContent([prompt, imagePart])
    const response = await result.response
    return response.text() || 'No advice generated'
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number
  ): Promise<T> {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        if (attempt === maxRetries) {
          break
        }

        // Exponential backoff: 1s, 2s, 4s, 8s
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError || new Error('Max retries exceeded')
  }

  private calculateConfidence(advice: string): number {
    // Simple confidence scoring based on response characteristics
    if (!advice || advice.length < 10) return 0.1
    
    let confidence = 0.5
    
    // Longer, more detailed responses get higher confidence
    if (advice.length > 50) confidence += 0.2
    if (advice.length > 100) confidence += 0.1
    
    // Specific game terms boost confidence
    const gameTerms = ['ability', 'enemy', 'health', 'mana', 'dodge', 'attack', 'position']
    const termMatches = gameTerms.filter(term => 
      advice.toLowerCase().includes(term)
    ).length
    confidence += Math.min(termMatches * 0.05, 0.2)
    
    return Math.min(confidence, 1.0)
  }

  public getAvailableProviders(): string[] {
    return this.geminiClient ? ['gemini'] : []
  }

  public isReady(): boolean {
    return !!this.geminiClient
  }
}
