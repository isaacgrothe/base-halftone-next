import type { AppState } from './types'

export const DEFAULT_STATE: AppState = {
  global: {
    mediaMode: 'image',
    outputCornerRadiusPx: 10,
    backgroundImageSrc: '/images/backgrounds/webp/sky.webp',
    aspectRatioMode: 'auto',
    heroMode: 'off',
  },
  palette: {
    backgroundColor: '#FFFFFF',
    foregroundColor: '#0000FF',
    lineOne: '#FFBE00',
    lineTwo: '#009C5C',
    lineThree: '#D796FF',
    lineFour: '#0000FF',
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
