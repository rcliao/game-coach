// Screen capture related functionality
import { desktopCapturer } from 'electron'
import { writeFileSync } from 'fs'
import { join } from 'path'

export interface ScreenSource {
  id: string
  name: string
  thumbnail: string
}

export class ScreenCaptureService {
  private isCapturing: boolean = false
  private currentSourceId: string | null = null
  private captureInterval: NodeJS.Timeout | null = null
  public async getAvailableSources(): Promise<ScreenSource[]> {
    try {
      console.log('ScreenCaptureService: Getting available sources...')
      const sources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
        thumbnailSize: { width: 150, height: 150 }
      })

      console.log('ScreenCaptureService: Found', sources.length, 'sources')
      const mappedSources = sources.map(source => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL()
      }))
      
      console.log('ScreenCaptureService: First few sources:', mappedSources.slice(0, 3).map(s => ({ id: s.id, name: s.name })))
      return mappedSources
    } catch (error) {
      console.error('Error getting screen sources:', error)
      throw error
    }
  }

  public async startCapture(sourceId: string): Promise<void> {
    if (this.isCapturing) {
      await this.stopCapture()
    }

    this.currentSourceId = sourceId
    this.isCapturing = true
    
    console.log(`Starting screen capture for source: ${sourceId}`)
    
    // The actual capture will be handled by the renderer process
    // This service manages the capture state and coordinates
    this.captureInterval = setInterval(() => {
      console.log('Capture tick - renderer should capture frame')
    }, 1000) // Every second for analysis
  }

  public async stopCapture(): Promise<void> {
    this.isCapturing = false
    this.currentSourceId = null
    
    if (this.captureInterval) {
      clearInterval(this.captureInterval)
      this.captureInterval = null
    }
    
    console.log('Screen capture stopped')
  }

  public async saveFrameForAnalysis(frameBuffer: Buffer): Promise<string | null> {
    if (!frameBuffer) {
      return null
    }
    
    try {
      const timestamp = Date.now()
      const filename = `frame_${timestamp}.jpg`
      const filepath = join(process.cwd(), 'temp', filename)
      
      writeFileSync(filepath, frameBuffer)
      console.log(`Frame saved to: ${filepath}`)
      return filepath
    } catch (error) {
      console.error('Error saving frame:', error)
      return null
    }
  }

  public isCurrentlyCapturing(): boolean {
    return this.isCapturing
  }

  public getCurrentSourceId(): string | null {
    return this.currentSourceId
  }
}

export const screenCaptureService = new ScreenCaptureService()
