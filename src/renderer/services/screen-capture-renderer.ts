// Screen capture functionality for renderer process
// Uses DOM APIs (getDisplayMedia, Canvas) that are only available in renderer

export interface CaptureFrame {
  buffer: Buffer
  timestamp: number
  sourceId: string
}

export class RendererScreenCaptureService {
  private mediaStream: MediaStream | null = null
  private video: HTMLVideoElement | null = null
  private canvas: HTMLCanvasElement | null = null
  private context: CanvasRenderingContext2D | null = null
  private isCapturing: boolean = false
  private currentSourceId: string | null = null

  public async startCapture(sourceId: string): Promise<boolean> {
    try {
      // Stop any existing capture
      if (this.isCapturing) {
        this.stopCapture()
      }

      // Request screen capture using Electron's desktopCapturer integration
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
            minWidth: 1280,
            maxWidth: 1920,
            minHeight: 720,
            maxHeight: 1080,
            minFrameRate: 1,
            maxFrameRate: 5, // Lower frame rate for analysis
          }
        }
      } as any)

      this.mediaStream = stream
      this.currentSourceId = sourceId

      // Create video element to display the stream
      this.video = document.createElement('video')
      this.video.srcObject = stream
      this.video.play()

      // Create canvas for frame capture
      this.canvas = document.createElement('canvas')
      this.context = this.canvas.getContext('2d')

      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        if (this.video) {
          this.video.onloadedmetadata = () => {
            if (this.video && this.canvas) {
              this.canvas.width = this.video.videoWidth
              this.canvas.height = this.video.videoHeight
            }
            resolve()
          }
        }
      })

      this.isCapturing = true
      console.log('Screen capture started successfully for source:', sourceId)
      return true

    } catch (error) {
      console.error('Failed to start screen capture:', error)
      this.cleanup()
      return false
    }
  }

  public stopCapture(): void {
    this.isCapturing = false
    this.cleanup()
    console.log('Screen capture stopped')
  }

  public async captureFrame(): Promise<Buffer | null> {
    if (!this.isCapturing || !this.video || !this.canvas || !this.context) {
      console.warn('Cannot capture frame - capture not active or components not ready')
      return null
    }

    try {
      // Draw current video frame to canvas
      this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height)

      // Convert canvas to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        this.canvas!.toBlob(resolve, 'image/jpeg', 0.8)
      })

      if (!blob) {
        console.warn('Failed to create blob from canvas')
        return null
      }

      // Convert blob to buffer
      const arrayBuffer = await blob.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      console.log(`Captured frame: ${buffer.length} bytes`)
      return buffer

    } catch (error) {
      console.error('Error capturing frame:', error)
      return null
    }
  }

  public async captureFrameWithInfo(): Promise<CaptureFrame | null> {
    const buffer = await this.captureFrame()
    if (!buffer || !this.currentSourceId) {
      return null
    }

    return {
      buffer,
      timestamp: Date.now(),
      sourceId: this.currentSourceId
    }
  }

  public isCurrentlyCapturing(): boolean {
    return this.isCapturing
  }

  public getCurrentSourceId(): string | null {
    return this.currentSourceId
  }

  private cleanup(): void {
    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }

    // Clean up video element
    if (this.video) {
      this.video.srcObject = null
      this.video = null
    }

    // Clean up canvas
    this.canvas = null
    this.context = null
    this.currentSourceId = null
  }

  // Static method to check if screen capture is supported
  public static isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  }
}

// Export singleton instance
export const rendererScreenCapture = new RendererScreenCaptureService()
