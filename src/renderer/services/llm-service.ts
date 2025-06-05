import {
  type OpenAIClient,
  type GeminiClient,
  createDefaultOpenAIClient,
  createDefaultGeminiClient,
} from './external-clients'

export interface LLMProvider {
  name: 'openai' | 'gemini'
  analyze: (imageBuffer: Buffer, prompt: string) => Promise<string>
  isConfigured: () => boolean
}

export interface LLMConfig {
  openaiApiKey?: string
  geminiApiKey?: string
  preferredProvider: 'openai' | 'gemini' | 'auto'
  maxRetries: number
  timeout: number
}

export interface AnalysisRequest {
  imageBuffer: Buffer
  gameContext: string
  analysisType: 'tactical' | 'strategic' | 'immediate'
  hudRegions?: any[]
  customInstructions?: string
  variableSubstitutions?: Record<string, string>
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
  private openaiClient?: OpenAIClient
  private geminiClient?: GeminiClient
  private providers: LLMProvider[] = []
  private openaiFactory: (key: string) => OpenAIClient
  private geminiFactory: (key: string) => GeminiClient
  constructor(
    config: LLMConfig,
    factories?: {
      createOpenAI?: (key: string) => OpenAIClient
      createGemini?: (key: string) => GeminiClient
    }
  ) {
    console.log('LLMService: Constructor called with config:', {
      hasOpenAI: !!config.openaiApiKey,
      hasGemini: !!config.geminiApiKey,
      provider: config.preferredProvider
    })
    
    this.config = config
    this.openaiFactory = factories?.createOpenAI ?? createDefaultOpenAIClient
    this.geminiFactory = factories?.createGemini ?? createDefaultGeminiClient
    try {
      this.initializeProviders()
      console.log('LLMService: Providers initialized successfully')
    } catch (error) {
      console.error('LLMService: Error in constructor:', error)
      throw error
    }
  }
  private initializeProviders() {
    console.log('LLMService: Initializing providers...')
    
    // Initialize OpenAI
    if (this.config.openaiApiKey) {
      try {
        console.log('LLMService: Initializing OpenAI client...')
        this.openaiClient = this.openaiFactory(this.config.openaiApiKey)

        this.providers.push({
          name: 'openai',
          analyze: this.analyzeWithOpenAI.bind(this),
          isConfigured: () => !!this.config.openaiApiKey,
        })
        console.log('LLMService: OpenAI provider added')
      } catch (error) {
        console.error('LLMService: Error initializing OpenAI:', error)
      }
    }    // Initialize Gemini
    if (this.config.geminiApiKey) {
      try {
        console.log('LLMService: Initializing Gemini client...')
        this.geminiClient = this.geminiFactory(this.config.geminiApiKey)

        this.providers.push({
          name: 'gemini',
          analyze: this.analyzeWithGemini.bind(this),
          isConfigured: () => !!this.config.geminiApiKey,
        })
        console.log('LLMService: Gemini provider added')
      } catch (error) {
        console.error('LLMService: Error initializing Gemini:', error)
      }
    }
  }

  public updateConfig(newConfig: Partial<LLMConfig>) {
    this.config = { ...this.config, ...newConfig }
    this.providers = []
    this.initializeProviders()
  }

  public async analyzeGameplay(request: AnalysisRequest): Promise<AnalysisResponse> {
    const startTime = Date.now()
    
    try {
      const provider = this.selectProvider()
      if (!provider) {
        throw new Error('No LLM provider configured')
      }

      const prompt = this.buildPrompt(request)
      const advice = await this.retryWithBackoff(
        () => provider.analyze(request.imageBuffer, prompt),
        this.config.maxRetries
      )

      return {
        advice,
        confidence: this.calculateConfidence(advice),
        provider: provider.name,
        timestamp: Date.now(),
        analysisTime: Date.now() - startTime,
      }
    } catch (error) {
      console.error('LLM analysis failed:', error)
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private selectProvider(): LLMProvider | null {
    if (this.config.preferredProvider === 'auto') {
      // Return first available provider
      return this.providers.find(p => p.isConfigured()) || null
    }

    // Return specific provider
    const provider = this.providers.find(p => p.name === this.config.preferredProvider)
    return provider?.isConfigured() ? provider : null
  }  private buildPrompt(request: AnalysisRequest): string {
    // Use custom instructions if available, otherwise fall back to default
    let basePrompt: string
    
    if (request.customInstructions && request.customInstructions.trim()) {
      // Use custom instructions as base prompt
      basePrompt = request.customInstructions
      
      // Substitute variables if provided
      if (request.variableSubstitutions) {
        for (const [key, value] of Object.entries(request.variableSubstitutions)) {
          const placeholder = `\${${key}}`
          const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
          basePrompt = basePrompt.replace(regex, value)
        }
      }
    } else {
      // Fall back to default Ravenswatch prompt
      basePrompt = `You are an expert Ravenswatch gaming coach. Analyze this gameplay screenshot and provide tactical advice.

Game Context: ${request.gameContext}
Analysis Type: ${request.analysisType}

Focus on:
- Immediate threats and opportunities
- Character positioning and movement
- Resource management (health, mana, items)
- Enemy patterns and weaknesses
- Optimal ability usage

Provide concise, actionable advice in 1-2 sentences. Be specific and practical.`
    }

    // Add analysis type specific instructions
    if (request.analysisType === 'immediate') {
      basePrompt += '\n\nPrioritize urgent, time-sensitive advice for the next 5-10 seconds.'
    } else if (request.analysisType === 'strategic') {
      basePrompt += '\n\nFocus on longer-term strategy and positioning for the next 30-60 seconds.'
    }

    return basePrompt
  }

  private async analyzeWithOpenAI(imageBuffer: Buffer, prompt: string): Promise<string> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized')
    }

    const base64Image = imageBuffer.toString('base64')
    
    const response = await this.openaiClient.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: 'high'
              },
            },
          ],
        },
      ],
      max_tokens: 150,
      temperature: 0.7,
    })

    return response.choices[0]?.message?.content || 'No advice generated'
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
    return this.providers.filter(p => p.isConfigured()).map(p => p.name)
  }

  public isReady(): boolean {
    return this.providers.some(p => p.isConfigured())
  }
}
