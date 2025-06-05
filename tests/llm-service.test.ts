//@vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { LLMService, type LLMConfig } from '../src/renderer/services/llm-service'

const createMockClient = (fn: any) => ({
  chat: { completions: { create: fn } }
})

describe('LLMService retry logic', () => {
  it('retries failed analyze calls', async () => {
    vi.useFakeTimers()
    const mockCreate = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'))
      .mockResolvedValue({ choices: [{ message: { content: 'advice' } }] })

    const config: LLMConfig = {
      openaiApiKey: 'key',
      preferredProvider: 'openai',
      maxRetries: 2,
      timeout: 1000,
    }

    const service = new LLMService(config, {
      openAIFactory: () => createMockClient(mockCreate),
    })

    const promise = service.analyzeGameplay({
      imageBuffer: Buffer.from('x'),
      gameContext: 'ctx',
      analysisType: 'tactical',
    })

    await vi.runAllTimersAsync()
    const res = await promise
    expect(res.advice).toBe('advice')
    expect(mockCreate).toHaveBeenCalledTimes(3)
    vi.useRealTimers()
  })
})
