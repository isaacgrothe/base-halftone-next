/**
 * CPU-side halftone → SVG export.
 *
 * Mirrors the GLSL fragment shader logic exactly, operating on raw pixel data
 * from an OffscreenCanvas. Emits one SVG <rect> per visible line segment with
 * rounded corners determined by capRoundness.
 *
 * Output is a standalone SVG file that can be opened in Illustrator / Figma.
 */

import type { AppState } from './types'
import { resolveColor } from './spectrum'

// ─── Helpers ────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '')
  return [
    parseInt(c.slice(0, 2), 16),
    parseInt(c.slice(2, 4), 16),
    parseInt(c.slice(4, 6), 16),
  ]
}

function luma(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

function applyContrast(v: number, contrast: number): number {
  return Math.max(0, Math.min(1, (v - 0.5) * contrast + 0.5))
}

// Returns tier (-1 = blank, 0..3 = active) and normalised thickness [0..1]
function lumToTier(lum: number, blankSpots: boolean): { tier: number; thickness: number } {
  if (blankSpots) {
    if (lum < 0.20) return { tier: -1, thickness: 0 }
    if (lum < 0.40) return { tier: 0, thickness: 0.333 }
    if (lum < 0.60) return { tier: 1, thickness: 0.555 }
    if (lum < 0.80) return { tier: 2, thickness: 0.777 }
    return { tier: 3, thickness: 1.0 }
  } else {
    if (lum < 0.25) return { tier: 0, thickness: 0.25 }
    if (lum < 0.50) return { tier: 1, thickness: 0.50 }
    if (lum < 0.75) return { tier: 2, thickness: 0.75 }
    return { tier: 3, thickness: 1.0 }
  }
}

// ─── Main export function ────────────────────────────────────────────────────

export async function exportSvg(state: AppState, canvasW: number, canvasH: number): Promise<string> {
  const { lineRenderer, palette, image } = state

  // ── 1. Load source image into an OffscreenCanvas ─────────────────────────
  const img = new Image()
  img.crossOrigin = 'anonymous'
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
    img.src = image.src
  })

  // Use the exact on-screen canvas dimensions so cell count matches the display
  const imgAR = img.naturalWidth / img.naturalHeight
  const renderW = canvasW
  const renderH = canvasH
  const targetAR = renderW / renderH

  const oc = new OffscreenCanvas(renderW, renderH)
  const ctx = oc.getContext('2d')!

  // Cover-mode draw: fill the target frame, cropping the image as needed
  let drawW: number, drawH: number, drawX: number, drawY: number
  if (imgAR > targetAR) {
    // Image wider than frame: fill height, crop sides
    drawH = renderH
    drawW = renderH * imgAR
    drawX = (renderW - drawW) / 2
    drawY = 0
  } else {
    // Image taller than frame: fill width, crop top/bottom
    drawW = renderW
    drawH = renderW / imgAR
    drawX = 0
    drawY = (renderH - drawH) / 2
  }

  // Apply blur if set
  if (image.blurPx > 0) {
    ctx.filter = `blur(${image.blurPx}px)`
  }
  ctx.drawImage(img, drawX, drawY, drawW, drawH)
  ctx.filter = 'none'

  const pixels = ctx.getImageData(0, 0, renderW, renderH).data

  // ── 2. Compute cell grid ──────────────────────────────────────────────────
  let cellCountX: number
  let cellCountY: number
  if (lineRenderer.vertical) {
    cellCountX = Math.round(renderW * lineRenderer.resolution)
    cellCountY = Math.round(cellCountX * (renderH / renderW))
  } else {
    cellCountY = Math.round(renderH * lineRenderer.resolution)
    cellCountX = Math.round(cellCountY * (renderW / renderH))
  }

  const cellW = renderW / cellCountX   // cell width in pixels
  const cellH = renderH / cellCountY   // cell height in pixels

  // ── 3. Resolve line colors ────────────────────────────────────────────────
  const tierColors = [
    hexToRgb(resolveColor(palette.lineOne)),
    hexToRgb(resolveColor(palette.lineTwo)),
    hexToRgb(resolveColor(palette.lineThree)),
    hexToRgb(resolveColor(palette.lineFour)),
  ]
  const fgColor = hexToRgb(resolveColor(palette.foregroundColor))
  const bgColor = resolveColor(palette.backgroundColor)

  // ── 4. Precompute tier grid ───────────────────────────────────────────────
  // Sampling per cell is cheap; precomputing avoids 4× redundant lookups when
  // checking adjacent cells for continuity.
  const tierGrid: number[][] = Array.from({ length: cellCountY }, (_, cy) =>
    Array.from({ length: cellCountX }, (_, cx) => {
      const px = Math.min(Math.round((cx + 0.5) * cellW), renderW - 1)
      const py = Math.min(Math.round((cy + 0.5) * cellH), renderH - 1)
      const idx = (py * renderW + px) * 4
      let l = luma(pixels[idx], pixels[idx + 1], pixels[idx + 2])
      l = applyContrast(l, lineRenderer.contrast)
      if (!lineRenderer.invert) l = 1 - l
      return lumToTier(l, lineRenderer.blankSpots).tier
    })
  )

  const getTier = (cy: number, cx: number): number =>
    cy >= 0 && cy < cellCountY && cx >= 0 && cx < cellCountX
      ? tierGrid[cy][cx]
      : -99  // out-of-bounds always disconnects

  // SVG path helpers ────────────────────────────────────────────────────────
  const f = (n: number) => n.toFixed(2)

  // Vertical segment: caps on top (low Y) and bottom (high Y)
  function vertSegPath(x: number, y: number, w: number, h: number, rxTop: number, rxBottom: number): string {
    const rt = Math.min(rxTop,    w / 2, h / 2)
    const rb = Math.min(rxBottom, w / 2, h / 2)
    if (rt < 0.01 && rb < 0.01)
      return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}"`
    if (Math.abs(rt - rb) < 0.01)
      return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(rt)}"`
    // Asymmetric: use path
    return `<path d="M ${f(x+rt)} ${f(y)} L ${f(x+w-rt)} ${f(y)} ` +
      (rt > 0 ? `A ${f(rt)} ${f(rt)} 0 0 1 ${f(x+w)} ${f(y+rt)} ` : '') +
      `L ${f(x+w)} ${f(y+h-rb)} ` +
      (rb > 0 ? `A ${f(rb)} ${f(rb)} 0 0 1 ${f(x+w-rb)} ${f(y+h)} ` : '') +
      `L ${f(x+rb)} ${f(y+h)} ` +
      (rb > 0 ? `A ${f(rb)} ${f(rb)} 0 0 1 ${f(x)} ${f(y+h-rb)} ` : '') +
      `L ${f(x)} ${f(y+rt)} ` +
      (rt > 0 ? `A ${f(rt)} ${f(rt)} 0 0 1 ${f(x+rt)} ${f(y)} ` : '') +
      `Z"`
  }

  // Horizontal segment: caps on left (low X) and right (high X)
  function horizSegPath(x: number, y: number, w: number, h: number, rxLeft: number, rxRight: number): string {
    const rl = Math.min(rxLeft,  w / 2, h / 2)
    const rr = Math.min(rxRight, w / 2, h / 2)
    if (rl < 0.01 && rr < 0.01)
      return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}"`
    if (Math.abs(rl - rr) < 0.01)
      return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(rl)}"`
    return `<path d="M ${f(x)} ${f(y+rl)} L ${f(x)} ${f(y+h-rl)} ` +
      (rl > 0 ? `A ${f(rl)} ${f(rl)} 0 0 0 ${f(x+rl)} ${f(y+h)} ` : '') +
      `L ${f(x+w-rr)} ${f(y+h)} ` +
      (rr > 0 ? `A ${f(rr)} ${f(rr)} 0 0 0 ${f(x+w)} ${f(y+h-rr)} ` : '') +
      `L ${f(x+w)} ${f(y+rr)} ` +
      (rr > 0 ? `A ${f(rr)} ${f(rr)} 0 0 0 ${f(x+w-rr)} ${f(y)} ` : '') +
      `L ${f(x+rl)} ${f(y)} ` +
      (rl > 0 ? `A ${f(rl)} ${f(rl)} 0 0 0 ${f(x)} ${f(y+rl)} ` : '') +
      `Z"`
  }

  // ── 5. Build SVG ──────────────────────────────────────────────────────────
  const svgW = renderW
  const svgH = renderH
  const rects: string[] = []
  const GAP_FRAC = 0.05   // gap at tier-change ends only; same-tier runs merge seamlessly

  const THICK_BLANK = [0.333, 0.555, 0.777, 1.0]
  const THICK_FLAT  = [0.25,  0.50,  0.75,  1.0]

  for (let cy = 0; cy < cellCountY; cy++) {
    for (let cx = 0; cx < cellCountX; cx++) {
      const tier = tierGrid[cy][cx]
      if (tier < 0) continue

      const t = (lineRenderer.blankSpots ? THICK_BLANK[tier] : THICK_FLAT[tier]) * lineRenderer.scale
      if (t < 0.01) continue

      const [r, g, b] = lineRenderer.useColors ? tierColors[tier] : fgColor
      const fill = `fill="rgb(${r},${g},${b})"`

      if (lineRenderer.vertical) {
        const stripW = t * cellW
        const x = cx * cellW + (cellW - stripW) / 2

        if (!lineRenderer.showGaps) {
          rects.push(`<rect x="${f(x)}" y="${f(cy * cellH)}" width="${f(stripW)}" height="${f(cellH)}" ${fill}/>`)
        } else {
          // SVG Y increases downward; cell above on screen = cy-1 (shader's connectHigh)
          const connectTop    = getTier(cy - 1, cx) === tier
          const connectBottom = getTier(cy + 1, cx) === tier

          const gapTop    = connectTop    ? 0 : GAP_FRAC
          const gapBottom = connectBottom ? 0 : GAP_FRAC

          const segY = cy * cellH + gapTop * cellH
          const segH = cellH * (1 - gapTop - gapBottom)
          const capR = lineRenderer.capRoundness * stripW * 0.5
          const rxTop    = connectTop    ? 0 : capR
          const rxBottom = connectBottom ? 0 : capR

          rects.push(vertSegPath(x, segY, stripW, segH, rxTop, rxBottom) + ` ${fill}/>`)
        }
      } else {
        const stripH = t * cellH
        const y = cy * cellH + (cellH - stripH) / 2

        if (!lineRenderer.showGaps) {
          rects.push(`<rect x="${f(cx * cellW)}" y="${f(y)}" width="${f(cellW)}" height="${f(stripH)}" ${fill}/>`)
        } else {
          const connectLeft  = getTier(cy, cx - 1) === tier
          const connectRight = getTier(cy, cx + 1) === tier

          const gapLeft  = connectLeft  ? 0 : GAP_FRAC
          const gapRight = connectRight ? 0 : GAP_FRAC

          const segX = cx * cellW + gapLeft * cellW
          const segW = cellW * (1 - gapLeft - gapRight)
          const capR = lineRenderer.capRoundness * stripH * 0.5
          const rxLeft  = connectLeft  ? 0 : capR
          const rxRight = connectRight ? 0 : capR

          rects.push(horizSegPath(segX, y, segW, stripH, rxLeft, rxRight) + ` ${fill}/>`)
        }
      }
    }
  }

  // ── 5. Serialise and download ─────────────────────────────────────────────
  const svg = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">`,
    ...(lineRenderer.alpha ? [] : [`  <rect width="${svgW}" height="${svgH}" fill="${bgColor}"/>`]),
    ...rects,
    `</svg>`,
  ].join('\n')

  return svg
}
