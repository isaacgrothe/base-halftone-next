// Base Design System spectrum color tokens
// These are resolved hex values for the token references used in palette configs.

export const spectrum = {
  gray: {
    0: '#FFFFFF',
    5: '#F8F8F8',
    10: '#F0F0F0',
    20: '#E0E0E0',
    30: '#C8C8C8',
    40: '#A0A0A0',
    50: '#787878',
    60: '#606060',
    70: '#484848',
    80: '#303030',
    90: '#181818',
    100: '#000000',
  },
  blue: {
    5: '#EEF4FF',
    10: '#D9E8FF',
    20: '#ADC8FF',
    30: '#7AA8FF',
    40: '#266EFF',
    50: '#0052E0',
    60: '#003DB8',
    70: '#002A8F',
    80: '#001A66',
    90: '#000D3D',
  },
  yellow: {
    10: '#FFF9D6',
    20: '#FFF0A0',
    30: '#FFE033',
    40: '#EBBA00',
    50: '#C49800',
    60: '#9E7800',
    70: '#785A00',
    80: '#523D00',
  },
  green: {
    10: '#E6F9EE',
    20: '#AEEDC8',
    30: '#5ED49A',
    40: '#1EBB70',
    50: '#129961',
    60: '#0A7A4C',
    70: '#065C39',
    80: '#023D26',
  },
  purple: {
    10: '#F5EEFF',
    20: '#E5D4FF',
    30: '#CD99FD',
    40: '#B266FB',
    50: '#9333EA',
    60: '#7A22CE',
    70: '#5E15A8',
    80: '#430A82',
  },
  red: {
    10: '#FEEAEA',
    20: '#FBBBBB',
    30: '#F87171',
    40: '#EF4444',
    50: '#DC2626',
    60: '#B91C1C',
    70: '#991B1B',
    80: '#7F1D1D',
  },
  brand: '#0000FF',
} as const

// Resolve a spectrum token string like "spectrum.blue[40]" or "spectrum.brand" to a hex color.
// Also accepts raw hex strings (#RRGGBB), passing them through unchanged.
export function resolveColor(token: string): string {
  if (token.startsWith('#')) return token

  const brandMatch = token.match(/^spectrum\.brand$/)
  if (brandMatch) return spectrum.brand

  const match = token.match(/^spectrum\.(\w+)\[(\d+)\]$/)
  if (match) {
    const [, group, shade] = match
    const g = spectrum[group as keyof typeof spectrum]
    if (g && typeof g === 'object') {
      return (g as Record<string, string>)[shade] ?? '#000000'
    }
  }

  return '#000000'
}

// Parse a hex color string to a [r, g, b] array with values in [0, 1]
export function hexToVec3(hex: string): [number, number, number] {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16) / 255
  const g = parseInt(c.substring(2, 4), 16) / 255
  const b = parseInt(c.substring(4, 6), 16) / 255
  return [r, g, b]
}

// Color presets matching the live site
export const COLOR_PRESETS = [
  {
    label: 'Core',
    isDark: false,
    palette: {
      backgroundColor: '#FFFFFF',
      foregroundColor: '#0000FF',
      lineOne: '#FFBE00',
      lineTwo: '#009C5C',
      lineThree: '#D796FF',
      lineFour: '#0000FF',
    },
    lineRenderer: { invert: false },
  },
  {
    label: 'Dark Mode',
    isDark: true,
    palette: {
      backgroundColor: '#000000',
      foregroundColor: '#FFFFFF',
      lineOne: '#0000FF',
      lineTwo: '#3D3DFF',
      lineThree: '#8585FF',
      lineFour: '#FFFFFF',
    },
    lineRenderer: { invert: true },
  },
]
