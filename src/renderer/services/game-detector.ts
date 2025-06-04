import type { GameWindow, GameDetectionResult } from '../../shared/types'

// Re-export for backwards compatibility
export type { GameWindow, GameDetectionResult }

export class GameDetectorService {  private readonly RAVENSWATCH_IDENTIFIERS = [
    'Ravenswatch',
    'ravenswatch.exe',
    'Ravenswatch.exe',
    'RavenswatchGame',
    'RAVENSWATCH',
    'ravenswatch',
    'Ravenswatch Game',
    'ravenswatch game',
    'Ravenswatch - ',
    'ravenswatch - ',
    'Ravenswatch.exe - ',
    'Passtech Games',
    'passtech',
    // Steam overlay patterns
    'Steam - Ravenswatch',
    'steam - ravenswatch',
    // Common game launcher patterns
    'Epic Games - Ravenswatch',
    'GOG - Ravenswatch',
  ]

  private readonly DETECTION_INTERVAL = 5000 // 5 seconds
  private detectionCallback?: (result: GameDetectionResult) => void
  private detectionTimer?: NodeJS.Timeout
  private lastDetection?: GameDetectionResult
  public startDetection(callback: (result: GameDetectionResult) => void) {
    console.log('GameDetector: startDetection() called')
    this.detectionCallback = callback
    
    // Initial detection
    console.log('GameDetector: Starting initial detection...')
    this.performDetection()
    
    // Start periodic detection
    console.log('GameDetector: Setting up periodic detection every', this.DETECTION_INTERVAL, 'ms')
    this.detectionTimer = setInterval(() => {
      this.performDetection()
    }, this.DETECTION_INTERVAL)
  }

  public stopDetection() {
    if (this.detectionTimer) {
      clearInterval(this.detectionTimer)
      this.detectionTimer = undefined
    }
    this.detectionCallback = undefined
  }

  private async performDetection() {
    try {
      const result = await this.detectRavenswatch()
      
      // Only call callback if detection state changed
      if (!this.lastDetection || 
          this.lastDetection.isGameRunning !== result.isGameRunning ||
          this.lastDetection.gameWindow?.isActive !== result.gameWindow?.isActive) {
        
        this.lastDetection = result
        this.detectionCallback?.(result)
      }
    } catch (error) {
      console.error('Game detection error:', error)
      
      const errorResult: GameDetectionResult = {
        isGameRunning: false,
        confidence: 0,
        detectionMethod: 'error',
      }
      
      this.detectionCallback?.(errorResult)
    }
  }
  private async detectRavenswatch(): Promise<GameDetectionResult> {
    console.log('GameDetector: Starting Ravenswatch detection...')
    
    // Method 1: Check available capture sources for Ravenswatch windows
    const sources = await this.getCaptureSource()
    console.log('GameDetector: Got', sources.length, 'capture sources')
    
    const gameSource = this.findGameInSources(sources)
    
    if (gameSource) {
      console.log('GameDetector: Ravenswatch detected via capture source!')
      const result = {
        isGameRunning: true,
        gameWindow: {
          id: gameSource.id,
          name: gameSource.name,
          executable: this.extractExecutableName(gameSource.name),
          isActive: true, // Assume active if in capture sources
        },
        confidence: this.calculateConfidence(gameSource.name),
        detectionMethod: 'capture-source',
      }
      console.log('GameDetector: Detection result:', result)
      return result
    }

    // Method 2: Process detection (requires additional implementation)
    // This would need IPC to main process for actual process enumeration
    
    console.log('GameDetector: Ravenswatch not detected')
    return {
      isGameRunning: false,
      confidence: 0,
      detectionMethod: 'capture-source',
    }
  }  private async getCaptureSource(): Promise<any[]> {
    try {
      console.log('GameDetector: Checking window.electronAPI availability...')
      if (!window.electronAPI) {
        console.error('GameDetector: window.electronAPI is not available!')
        return []
      }
      
      console.log('GameDetector: window.electronAPI found, calling getCaptureSource()...')
      if (typeof window.electronAPI.getCaptureSource !== 'function') {
        console.error('GameDetector: window.electronAPI.getCaptureSource is not a function!')
        return []
      }
      
      console.log('GameDetector: Calling window.electronAPI.getCaptureSource()...')
      const sources = await window.electronAPI.getCaptureSource()
      console.log('GameDetector: Total available capture sources:', sources?.length || 0)
      console.log('GameDetector: Available capture sources:', sources?.map((s: any) => ({
        id: s.id,
        name: s.name,
        type: s.id.includes('window') ? 'window' : 'screen'
      })))
      return sources || []
    } catch (error) {
      console.error('GameDetector: Failed to get capture sources:', error)
      return []
    }
  }
  private findGameInSources(sources: any[]): any | null {
    console.log('GameDetector: Searching for Ravenswatch in sources...')
    console.log('GameDetector: Looking for identifiers:', this.RAVENSWATCH_IDENTIFIERS)
    
    const found = sources.find(source => {
      const name = source.name.toLowerCase()
      console.log('GameDetector: Checking source:', source.name)
      
      const matches = this.RAVENSWATCH_IDENTIFIERS.some(identifier => {
        const match = name.includes(identifier.toLowerCase())
        if (match) {
          console.log('GameDetector: MATCH FOUND!', identifier, 'in', source.name)
        }
        return match
      })
      
      return matches
    })
    
    if (found) {
      console.log('GameDetector: Found Ravenswatch source:', found.name)
    } else {
      console.log('GameDetector: No Ravenswatch source found')
    }
    
    return found || null
  }

  private extractExecutableName(windowName: string): string {
    // Extract executable name from window title
    for (const identifier of this.RAVENSWATCH_IDENTIFIERS) {
      if (windowName.toLowerCase().includes(identifier.toLowerCase())) {
        return identifier
      }
    }
    return 'unknown'
  }

  private calculateConfidence(windowName: string): number {
    const name = windowName.toLowerCase()
    
    // Exact match
    if (name === 'ravenswatch') return 1.0
    
    // Partial matches
    if (name.includes('ravenswatch')) return 0.9
    if (name.includes('raven')) return 0.6
    
    return 0.3
  }

  public getCurrentDetection(): GameDetectionResult | undefined {
    return this.lastDetection
  }

  public async manualDetection(): Promise<GameDetectionResult> {
    return await this.detectRavenswatch()
  }

  // Debug method to help troubleshoot detection issues
  public async debugDetection(): Promise<{
    availableSources: any[],
    foundSources: any[],
    identifiers: string[],
    lastDetection?: GameDetectionResult
  }> {    try {
      const sources = await this.getCaptureSource()
      const foundSources = sources.filter(source => {
        const name = source.name.toLowerCase()
        return this.RAVENSWATCH_IDENTIFIERS.some(identifier =>
          name.includes(identifier.toLowerCase())
        )
      })
      
      return {
        availableSources: sources.map((s: any) => ({ id: s.id, name: s.name })),
        foundSources: foundSources.map((s: any) => ({ id: s.id, name: s.name })),
        identifiers: this.RAVENSWATCH_IDENTIFIERS,
        lastDetection: this.lastDetection
      }
    } catch (error) {
      console.error('Debug detection failed:', error)
      return {
        availableSources: [],
        foundSources: [],
        identifiers: this.RAVENSWATCH_IDENTIFIERS,
        lastDetection: this.lastDetection
      }
    }
  }
  // New method to test raw capture sources
  public async testCaptureSourcesRaw(): Promise<any[]> {
    console.log('GameDetector: Testing raw capture sources...')
    try {
      const sources = await window.electronAPI.getCaptureSource()
      console.log('GameDetector: Raw electronAPI result:', sources)
      console.log('GameDetector: Source count:', sources?.length || 0)
      
      if (sources && sources.length > 0) {
        console.log('GameDetector: First 5 sources:')
        sources.slice(0, 5).forEach((source: any, index: number) => {
          console.log(`  ${index + 1}. ID: ${source.id}, Name: "${source.name}"`)
        })
      }
      
      return sources || []
    } catch (error) {
      console.error('GameDetector: Raw capture test failed:', error)
      return []
    }
  }

  // Comprehensive diagnostic test
  public async runDiagnostic(): Promise<void> {
    console.log('\n🔍 === GAME DETECTOR DIAGNOSTIC ===')
    
    // Test 1: Check electronAPI availability
    console.log('1. Checking electronAPI availability...')
    if (!window.electronAPI) {
      console.error('❌ window.electronAPI is not available!')
      return
    }
    console.log('✅ window.electronAPI is available')
    
    // Test 2: Check getCaptureSource method
    console.log('2. Checking getCaptureSource method...')
    if (typeof window.electronAPI.getCaptureSource !== 'function') {
      console.error('❌ window.electronAPI.getCaptureSource is not a function!')
      return
    }
    console.log('✅ window.electronAPI.getCaptureSource is a function')
    
    // Test 3: Test IPC call
    console.log('3. Testing IPC call...')
    try {
      const sources = await window.electronAPI.getCaptureSource()
      console.log('✅ IPC call successful! Got', sources?.length || 0, 'sources')
      
      if (sources && sources.length > 0) {
        console.log('📋 First few sources:')
        sources.slice(0, 3).forEach((source: any, index: number) => {
          console.log(`   ${index + 1}. "${source.name}" (${source.id})`)
        })
      }
    } catch (error) {
      console.error('❌ IPC call failed:', error)
      return
    }
    
    // Test 4: Test detection logic
    console.log('4. Testing detection logic...')
    try {
      const result = await this.detectRavenswatch()
      console.log('✅ Detection logic successful!')
      console.log('📊 Detection result:', result)
    } catch (error) {
      console.error('❌ Detection logic failed:', error)
    }
    
    console.log('🔍 === DIAGNOSTIC COMPLETE ===\n')
  }
}
