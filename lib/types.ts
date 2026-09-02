export type AspectRatioMode = 'auto' | '16:9' | '9:16' | '1:1' | 'fullscreen' | 'custom'
export type ShapeMode = 'lines' | 'squares' | 'mixed'
export type HeroMode = 'off' | 'light' | 'dark'
export type MediaMode = 'image' | 'video'

export interface GlobalConfig {
  mediaMode: MediaMode
  outputCornerRadiusPx: number
  backgroundImageSrc: string
  aspectRatioMode: AspectRatioMode
  customWidth: number
  customHeight: number
  heroMode: HeroMode
  isDark: boolean
}

export interface PaletteConfig {
  backgroundColor: string
  foregroundColor: string
  lineOne: string
  lineTwo: string
  lineThree: string
  lineFour: string
  // Mixed-mode shape colors — 7 entries ordered lightest→darkest tier
  // (cross, thin bar, wide bar, small diamond, large diamond, two squares, frame)
  mixLight: [string, string, string, string, string, string, string]
  mixDark:  [string, string, string, string, string, string, string]
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
  sizeVariation: number
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
