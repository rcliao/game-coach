export interface OpenAIClient {
  chat: {
    completions: {
      create: (params: any) => Promise<{ choices: { message: { content: string } }[] }>
    }
  }
}

export interface GeminiModel {
  generateContent: (input: any[]) => Promise<{ response: { text(): string } }>
}

export interface GeminiClient {
  getGenerativeModel: (options: { model: string }) => GeminiModel
}

import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const createDefaultOpenAIClient = (apiKey: string): OpenAIClient => {
  return new OpenAI({ apiKey, dangerouslyAllowBrowser: true }) as OpenAIClient
}

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
