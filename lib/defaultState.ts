import type { AppState } from './types'

export const DEFAULT_STATE: AppState = {
  global: {
    mediaMode: 'image',
    outputCornerRadiusPx: 16,
    backgroundImageSrc: '/images/backgrounds/webp/sky.webp',
    aspectRatioMode: 'auto',
    heroMode: 'off',
  },
  palette: {
    backgroundColor: 'spectrum.gray[5]',
    foregroundColor: 'spectrum.blue[40]',
    lineOne: 'spectrum.yellow[40]',
    lineTwo: 'spectrum.green[50]',
    lineThree: 'spectrum.purple[30]',
    lineFour: 'spectrum.brand',
  },
  lineRenderer: {
    invert: false,
    blankSpots: true,
    contrast: 4.2,
    showGaps: true,
    useColors: true,
    scale: 0.8,
    vertical: true,
    capRoundness: 0.5,
    resolution: 0.03,
    alpha: false,
    showUnderlay: false,
  },
  image: {
    src: '/images/backgrounds/webp/globe.webp',
    secondSrc: null,
    imageCycleIndex: 0,
    blurPx: 0,
  },
  video: {
    src: '/videos/lines-small.webm',
    loop: true,
    muted: true,
    autoPlay: true,
  },
}
