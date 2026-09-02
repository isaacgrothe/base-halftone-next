export type AspectRatioMode = 'auto' | '16:9' | '9:16' | '1:1' | 'fullscreen'
export type ShapeMode = 'lines' | 'dots' | 'squares' | 'diamonds'
export type HeroMode = 'off' | 'light' | 'dark'
export type MediaMode = 'image' | 'video'

export interface GlobalConfig {
  mediaMode: MediaMode
  outputCornerRadiusPx: number
  backgroundImageSrc: string
  aspectRatioMode: AspectRatioMode
  heroMode: HeroMode
}

export interface PaletteConfig {
  backgroundColor: string
  foregroundColor: string
  lineOne: string
  lineTwo: string
  lineThree: string
  lineFour: string
}

export interface LineRendererConfig {
  shapeMode: ShapeMode
  invert: boolean
  blankSpots: boolean
  contrast: number
  showGaps: boolean
  useColors: boolean
  scale: number
  vertical: boolean
  capRoundness: number
  resolution: number
  alpha: boolean
  showUnderlay: boolean
}

export interface ImageConfig {
  src: string
  secondSrc: string | null
  imageCycleIndex: number
  blurPx: number
}

export interface VideoConfig {
  src: string
  loop: boolean
  muted: boolean
  autoPlay: boolean
  blurPx: number
}

export interface AppState {
  global: GlobalConfig
  palette: PaletteConfig
  lineRenderer: LineRendererConfig
  image: ImageConfig
  video: VideoConfig
}
