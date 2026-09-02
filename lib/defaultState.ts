import type { AppState } from './types'

export const DEFAULT_STATE: AppState = {
  global: {
    mediaMode: 'image',
    outputCornerRadiusPx: 10,
    backgroundImageSrc: '/images/backgrounds/webp/sky.webp',
    aspectRatioMode: 'auto',
    customWidth: 1920,
    customHeight: 1080,
    heroMode: 'off',
    isDark: false,
  },
  palette: {
    backgroundColor: '#FFFFFF',
    foregroundColor: '#0000FF',
    lineOne: '#FFBE00',
    lineTwo: '#009C5C',
    lineThree: '#D796FF',
    lineFour: '#0000FF',
    // Mixed mode: lightest→darkest (cross, thin bar, wide bar, sm diamond, lg diamond, 2-squares, frame)
    mixLight: ['#B6F569', '#D796FF', '#FFBE00', '#FF7F16', '#009C5C', '#3C8AFF', '#0000FF'],
    mixDark:  ['#0000FF', '#0071FF', '#7B7BFF', '#8C8CFF', '#58A2FF', '#96C5FF', '#FFFFFF'],
  },
  lineRenderer: {
    shapeMode: 'lines' as const,
    invert: false,
    blankSpots: true,
    contrast: 2.5,
    showGaps: true,
    useColors: true,
    scale: 0.8,
    vertical: true,
    capRoundness: 0.3,
    resolution: 0.10,
    alpha: false,
    showUnderlay: false,
    sizeVariation: 0,
  },
  image: {
    src: '/images/karel-martens.jpg',
    secondSrc: null,
    imageCycleIndex: 0,
    blurPx: 0,
  },
  video: {
    src: '/videos/horse.webm',
    loop: true,
    muted: true,
    autoPlay: true,
    blurPx: 0,
  },
}
