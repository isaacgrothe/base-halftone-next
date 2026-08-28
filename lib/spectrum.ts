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
    label: 'Default',
    palette: {
      backgroundColor: 'spectrum.gray[5]',
      foregroundColor: 'spectrum.blue[40]',
      lineOne: 'spectrum.yellow[40]',
      lineTwo: 'spectrum.green[50]',
      lineThree: 'spectrum.purple[30]',
      lineFour: 'spectrum.brand',
    },
  },
  {
    label: 'Ocean',
    palette: {
      backgroundColor: 'spectrum.blue[5]',
      foregroundColor: 'spectrum.blue[60]',
      lineOne: 'spectrum.blue[20]',
      lineTwo: 'spectrum.blue[30]',
      lineThree: 'spectrum.blue[40]',
      lineFour: 'spectrum.blue[50]',
    },
  },
  {
    label: 'Sunset',
    palette: {
      backgroundColor: 'spectrum.yellow[10]',
      foregroundColor: 'spectrum.red[50]',
      lineOne: 'spectrum.yellow[30]',
      lineTwo: 'spectrum.yellow[40]',
      lineThree: 'spectrum.red[30]',
      lineFour: 'spectrum.red[40]',
    },
  },
  {
    label: 'Forest',
    palette: {
      backgroundColor: 'spectrum.green[10]',
      foregroundColor: 'spectrum.green[70]',
      lineOne: 'spectrum.green[20]',
      lineTwo: 'spectrum.green[30]',
      lineThree: 'spectrum.green[40]',
      lineFour: 'spectrum.green[50]',
    },
  },
  {
    label: 'Midnight',
    palette: {
      backgroundColor: 'spectrum.gray[90]',
      foregroundColor: 'spectrum.gray[5]',
      lineOne: 'spectrum.blue[30]',
      lineTwo: 'spectrum.purple[30]',
      lineThree: 'spectrum.blue[40]',
      lineFour: 'spectrum.gray[20]',
    },
  },
  {
    label: 'Rose',
    palette: {
      backgroundColor: 'spectrum.red[10]',
      foregroundColor: 'spectrum.red[70]',
      lineOne: 'spectrum.red[20]',
      lineTwo: 'spectrum.red[30]',
      lineThree: 'spectrum.purple[30]',
      lineFour: 'spectrum.red[50]',
    },
  },
]
