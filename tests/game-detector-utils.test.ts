import { describe, it, expect } from 'vitest'
import { extractExecutableName, calculateConfidence } from '../src/renderer/services/game-detector-utils'

describe('game-detector utils', () => {
  it('extractExecutableName returns identifier when match found', () => {
    expect(extractExecutableName('Ravenswatch.exe')).toBe('Ravenswatch')
  })

  it('extractExecutableName returns unknown when no match', () => {
    expect(extractExecutableName('Unknown Game')).toBe('unknown')
  })

  it('calculateConfidence returns 1.0 for exact match', () => {
    expect(calculateConfidence('Ravenswatch')).toBe(1.0)
  })

  it('calculateConfidence returns 0.9 for partial match', () => {
    expect(calculateConfidence('Ravenswatch - Window')).toBe(0.9)
  })

  it('calculateConfidence returns 0.6 for raven match', () => {
    expect(calculateConfidence('raven hero')).toBe(0.6)
  })

  it('calculateConfidence returns 0.3 for no match', () => {
    expect(calculateConfidence('other game')).toBe(0.3)
  })
})
