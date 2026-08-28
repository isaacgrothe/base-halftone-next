// Static asset presets — references the live site's public assets.
// When running locally, put your own images in /public/images/ and /public/videos/
// or change these to absolute URLs.

export const IMAGE_PRESETS: { label: string; src: string }[] = [
  { label: 'Globe',      src: '/images/backgrounds/webp/globe.webp' },
  { label: 'Sky',        src: '/images/backgrounds/webp/sky.webp' },
  { label: 'Gradient',   src: '/images/backgrounds/webp/gradient.webp' },
  { label: 'Liquid',     src: '/images/backgrounds/webp/liquid.webp' },
  { label: 'Motion',     src: '/images/backgrounds/webp/motion.webp' },
  { label: 'Penny',      src: '/images/backgrounds/webp/penny.webp' },
  { label: 'Shield',     src: '/images/backgrounds/webp/shield.webp' },
  { label: 'Speed',      src: '/images/backgrounds/webp/speed.webp' },
  { label: 'Secure',     src: '/images/backgrounds/webp/secure.webp' },
]

export const GRADIENT_PRESETS: { label: string; src: string }[] = [
  { label: 'Always On',     src: '/images/backgrounds/gradients/webp/always-on.webp' },
  { label: 'Bridge',        src: '/images/backgrounds/gradients/webp/bridge.webp' },
  { label: 'Decentralized', src: '/images/backgrounds/gradients/webp/decentralized.webp' },
  { label: 'Privacy',       src: '/images/backgrounds/gradients/webp/privacy.webp' },
  { label: 'Secure',        src: '/images/backgrounds/gradients/webp/secure.webp' },
]

export const VIDEO_PRESETS: { label: string; src: string }[] = [
  { label: 'Lines', src: '/videos/lines-small.webm' },
  { label: 'Waves', src: '/videos/waves-small.webm' },
  { label: 'Horse', src: '/videos/horse.webm' },
]

export const BG_PRESETS: { label: string; src: string }[] = [
  { label: 'Sky', src: '/images/backgrounds/webp/sky.webp' },
]
