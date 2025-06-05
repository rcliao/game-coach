// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'

;(window as any).speechSynthesis = {
  speaking: false,
  paused: false,
  getVoices: () => [{ name: 'Test', lang: 'en', default: true }],
  speak: () => {},
  cancel: () => {},
  pause: () => { (window as any).speechSynthesis.paused = true },
  resume: () => { (window as any).speechSynthesis.paused = false },
  addEventListener: (_: string, cb: () => void) => { cb() }
};
(window as any).SpeechSynthesisUtterance = function () {};


beforeEach(() => {
  ;(window as any).speechSynthesis = {
    speaking: false,
    paused: false,
    getVoices: () => [{ name: 'Test', lang: 'en', default: true }],
    speak: () => {},
    cancel: () => {},
    pause: () => { (window as any).speechSynthesis.paused = true },
    resume: () => { (window as any).speechSynthesis.paused = false },
    addEventListener: (_: string, cb: () => void) => { cb() }
  };
  ;(window as any).SpeechSynthesisUtterance = function () {};
})

describe('TTSService', () => {
  it('reports support when APIs exist', async () => {
    const { TTSService } = await import('../src/renderer/services/tts-service')
    expect(TTSService.isSupported()).toBe(true)
  })

  it('returns default voice', async () => {
    const { TTSService } = await import('../src/renderer/services/tts-service')
    const svc = new TTSService()
    await (svc as any).initializeVoices()
    expect(svc.getDefaultVoice()?.name).toBe('Test')
  })

  it('cleans text for speech', async () => {
    const { TTSService } = await import('../src/renderer/services/tts-service')
    const svc = new TTSService()
    const method = (svc as any).cleanTextForSpeech.bind(svc)
    const out = method('Attack the npc!')
    expect(out).toBe('Attack the enemy!')
  })
})
