import { describe, it, expect, vi } from 'vitest'
import { LLMService, type LLMConfig } from '../src/renderer/services/llm-service'

vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class {
      constructor(_key: string) {}
      getGenerativeModel() {
        return {
          generateContent: vi.fn(async () => ({ response: { text: () => 'gemini' } }))
        }
      }
    }
  }
})

describe('LLMService retryWithBackoff', () => {
  it('retries until success', async () => {
    vi.useFakeTimers()
    const service = new LLMService({
      geminiApiKey: 'k',
      maxRetries: 2,
      timeout: 0
    } as LLMConfig)

    const op = vi.fn()
      .mockRejectedValueOnce(new Error('e1'))
      .mockRejectedValueOnce(new Error('e2'))
      .mockResolvedValue('done')

    const promise = (service as any).retryWithBackoff(op, 2)
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result).toBe('done')
    expect(op).toHaveBeenCalledTimes(3)
    vi.useRealTimers()
  })

  it('throws after max retries', async () => {
    vi.useFakeTimers()
    const service = new LLMService({
      geminiApiKey: 'k',
      maxRetries: 1,
      timeout: 0
    } as LLMConfig)
    const op = vi.fn().mockRejectedValue(new Error('fail'))
    const promise = (service as any).retryWithBackoff(op, 1)
    promise.catch(() => {})
    await vi.runAllTimersAsync()
    await expect(promise).rejects.toThrow('fail')
    expect(op).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })
})

describe('LLMService calculateConfidence', () => {
  const service = new LLMService({
    geminiApiKey: 'k',
    maxRetries: 0,
    timeout: 0
  } as LLMConfig)

  it('returns low confidence for short advice', () => {
    const c = (service as any).calculateConfidence('short')
    expect(c).toBeCloseTo(0.1)
  })

  it('scores higher for long detailed advice', () => {
    const text = 'Use your ability to attack the enemy and keep your health and mana high while positioning carefully for the next encounter.'
    const c = (service as any).calculateConfidence(text)
    expect(c).toBeGreaterThan(0.7)
    expect(c).toBeLessThanOrEqual(1)
  })
})
