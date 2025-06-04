// Image processing utilities
// This will be expanded in Phase 2

import sharp from 'sharp'

export interface ProcessingOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
}

export class ImageProcessor {
  public async processFrame(
    imageBuffer: Buffer, 
    options: ProcessingOptions = {}
  ): Promise<Buffer> {
    const {
      width = 1280,
      height = 720,
      quality = 80,
      format = 'jpeg'
    } = options

    try {
      let processor = sharp(imageBuffer)
        .resize(width, height, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 1 }
        })

      if (format === 'jpeg') {
        processor = processor.jpeg({ quality })
      } else if (format === 'png') {
        processor = processor.png({ quality })
      } else if (format === 'webp') {
        processor = processor.webp({ quality })
      }

      return await processor.toBuffer()
    } catch (error) {
      console.error('Error processing image:', error)
      throw error
    }
  }

  public async cropRegion(
    imageBuffer: Buffer,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .extract({ left: x, top: y, width, height })
        .toBuffer()
    } catch (error) {
      console.error('Error cropping image:', error)
      throw error
    }
  }

  public async getImageInfo(imageBuffer: Buffer) {
    try {
      const metadata = await sharp(imageBuffer).metadata()
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format,
        size: imageBuffer.length
      }
    } catch (error) {
      console.error('Error getting image info:', error)
      throw error
    }
  }
}

export const imageProcessor = new ImageProcessor()
