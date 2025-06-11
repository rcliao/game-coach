export interface GeminiModel {
  generateContent: (input: any[]) => Promise<{ response: { text(): string } }>
}

export interface GeminiClient {
  getGenerativeModel: (options: { model: string }) => GeminiModel
}

import { GoogleGenerativeAI } from '@google/generative-ai'

export const createDefaultGeminiClient = (apiKey: string): GeminiClient => {
  return new GoogleGenerativeAI(apiKey) as GeminiClient
}

export interface ScreenCaptureAPI {
  getCaptureSource(): Promise<any[]>
}

export const defaultScreenCaptureAPI: ScreenCaptureAPI = {
  async getCaptureSource() {
    if (typeof window !== 'undefined' && (window as any).electronAPI && typeof (window as any).electronAPI.getCaptureSource === 'function') {
      return (window as any).electronAPI.getCaptureSource()
    }
    return []
  }
}
