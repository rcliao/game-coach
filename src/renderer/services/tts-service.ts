// Text-to-Speech service for reading advice aloud
export interface TTSOptions {
  voice?: string
  rate?: number // 0.1 to 10
  pitch?: number // 0 to 2
  volume?: number // 0 to 1
}

export interface TTSVoice {
  name: string
  lang: string
  default: boolean
}

export class TTSService {
  private synthesis: SpeechSynthesis
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private voices: TTSVoice[] = []
  private isInitialized = false

  constructor() {
    this.synthesis = window.speechSynthesis
    this.initializeVoices()
  }

  private async initializeVoices(): Promise<void> {
    return new Promise((resolve) => {
      const loadVoices = () => {
        const speechVoices = this.synthesis.getVoices()
        this.voices = speechVoices.map(voice => ({
          name: voice.name,
          lang: voice.lang,
          default: voice.default
        }))
        this.isInitialized = true
        resolve()
      }

      // Chrome loads voices asynchronously
      if (speechVoices.length > 0) {
        loadVoices()
      } else {
        this.synthesis.addEventListener('voiceschanged', loadVoices, { once: true })
      }
    })
  }

  public async speak(text: string, options: TTSOptions = {}): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeVoices()
    }

    // Stop any current speech
    this.stop()

    return new Promise((resolve, reject) => {
      try {
        this.currentUtterance = new SpeechSynthesisUtterance(text)
        
        // Set options
        this.currentUtterance.rate = options.rate ?? 1.0
        this.currentUtterance.pitch = options.pitch ?? 1.0
        this.currentUtterance.volume = options.volume ?? 0.8

        // Find and set voice
        if (options.voice) {
          const voice = this.synthesis.getVoices().find(v => v.name === options.voice)
          if (voice) {
            this.currentUtterance.voice = voice
          }
        }

        // Set up event handlers
        this.currentUtterance.onend = () => {
          this.currentUtterance = null
          resolve()
        }

        this.currentUtterance.onerror = (event) => {
          console.error('TTS Error:', event.error)
          this.currentUtterance = null
          reject(new Error(`TTS Error: ${event.error}`))
        }

        // Speak the text
        this.synthesis.speak(this.currentUtterance)
      } catch (error) {
        reject(error)
      }
    })
  }

  public stop(): void {
    if (this.synthesis.speaking) {
      this.synthesis.cancel()
    }
    this.currentUtterance = null
  }

  public pause(): void {
    if (this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause()
    }
  }

  public resume(): void {
    if (this.synthesis.paused) {
      this.synthesis.resume()
    }
  }

  public isSpeaking(): boolean {
    return this.synthesis.speaking
  }

  public isPaused(): boolean {
    return this.synthesis.paused
  }

  public getAvailableVoices(): TTSVoice[] {
    return this.voices
  }

  public getDefaultVoice(): TTSVoice | null {
    return this.voices.find(voice => voice.default) || this.voices[0] || null
  }
  // Utility method to speak advice with gaming-optimized settings
  public async speakAdvice(advice: string, options: {
    isUrgent?: boolean
    speed?: number
    volume?: number
    voice?: string
  } = {}): Promise<void> {
    // Use shorter, more urgent speech settings for gaming
    const ttsOptions: TTSOptions = {
      rate: options.speed ?? (options.isUrgent ? 1.3 : 1.2),
      pitch: options.isUrgent ? 1.1 : 1.0,
      volume: options.volume ?? 0.7,
      voice: options.voice || this.getGamingOptimizedVoice()?.name
    }

    // Clean up advice text for better speech
    const cleanAdvice = this.cleanTextForSpeech(advice)
    
    try {
      await this.speak(cleanAdvice, ttsOptions)
    } catch (error) {
      console.error('Failed to speak advice:', error)
    }
  }

  public async speakUrgentAdvice(advice: string): Promise<void> {
    await this.speakAdvice(advice, { isUrgent: true })
  }

  private getGamingOptimizedVoice(): TTSVoice | null {
    // Prefer clear, fast-speaking voices for gaming
    const preferredVoices = [
      'Microsoft David',
      'Microsoft Zira', 
      'Google US English',
      'Microsoft Mark'
    ]

    for (const voiceName of preferredVoices) {
      const voice = this.voices.find(v => v.name.includes(voiceName))
      if (voice) return voice
    }

    // Fallback to any English voice
    return this.voices.find(v => v.lang.startsWith('en')) || this.getDefaultVoice()
  }
  private cleanTextForSpeech(text: string): string {
    return text
      // Remove special characters that don't read well
      .replace(/[^\w\s.,!?-]/g, ' ')
      // Replace gaming abbreviations with full words
      .replace(/\bhp\b/gi, 'health points')
      .replace(/\bmp\b/gi, 'mana points')
      .replace(/\bdps\b/gi, 'damage per second')
      .replace(/\baoe\b/gi, 'area of effect')
      .replace(/\bcd\b/gi, 'cooldown')
      .replace(/\bbuff\b/gi, 'enhancement')
      .replace(/\bdebuff\b/gi, 'weakness')
      .replace(/\bnpc\b/gi, 'enemy')
      .replace(/\bult\b/gi, 'ultimate ability')
      .replace(/\bproc\b/gi, 'trigger')
      // Remove confidence scores in parentheses
      .replace(/\([^)]*confidence[^)]*\)/gi, '')
      // Ensure proper pauses for better speech flow
      .replace(/\./g, '. ')
      .replace(/!/g, '! ')
      .replace(/\?/g, '? ')
      // Clean up extra spaces
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Check if TTS is supported in the current browser
  public static isSupported(): boolean {
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
  }
}

// Export singleton instance
export const ttsService = new TTSService()
