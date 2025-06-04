export const RAVENSWATCH_IDENTIFIERS = [
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

export function extractExecutableName(windowName: string): string {
  for (const identifier of RAVENSWATCH_IDENTIFIERS) {
    if (windowName.toLowerCase().includes(identifier.toLowerCase())) {
      return identifier
    }
  }
  return 'unknown'
}

export function calculateConfidence(windowName: string): number {
  const name = windowName.toLowerCase()
  if (name === 'ravenswatch') return 1.0
  if (name.includes('ravenswatch')) return 0.9
  if (name.includes('raven')) return 0.6
  return 0.3
}
