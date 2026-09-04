/**
 * CPU-side halftone → SVG export.
 *
 * Mirrors the GLSL fragment shader logic exactly, operating on raw pixel data
 * from an OffscreenCanvas. Emits SVG primitives for lines, squares, and mixed
 * shape modes.
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
  const { lineRenderer, palette, image, global: globalCfg } = state

  // ── 1. Load source image into an OffscreenCanvas ─────────────────────────
  const img = new Image()
  img.crossOrigin = 'anonymous'
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
    img.src = image.src
  })

  const imgAR = img.naturalWidth / img.naturalHeight
  const renderW = canvasW
  const renderH = canvasH
  const targetAR = renderW / renderH

  const oc = new OffscreenCanvas(renderW, renderH)
  const ctx = oc.getContext('2d')!

  let drawW: number, drawH: number, drawX: number, drawY: number
  if (imgAR > targetAR) {
    drawH = renderH; drawW = renderH * imgAR
    drawX = (renderW - drawW) / 2; drawY = 0
  } else {
    drawW = renderW; drawH = renderW / imgAR
    drawX = 0; drawY = (renderH - drawH) / 2
  }

  if (image.blurPx > 0) ctx.filter = `blur(${image.blurPx}px)`
  ctx.drawImage(img, drawX, drawY, drawW, drawH)
  ctx.filter = 'none'

  const pixels = ctx.getImageData(0, 0, renderW, renderH).data

  // ── 2. Compute cell grid ──────────────────────────────────────────────────
  let cellCountX: number, cellCountY: number
  if (lineRenderer.vertical) {
    cellCountX = Math.round(renderW * lineRenderer.resolution)
    cellCountY = Math.round(cellCountX * (renderH / renderW))
  } else {
    cellCountY = Math.round(renderH * lineRenderer.resolution)
    cellCountX = Math.round(cellCountY * (renderW / renderH))
  }

  const cellW = renderW / cellCountX
  const cellH = renderH / cellCountY

  // ── 3. Resolve colors ─────────────────────────────────────────────────────
  const tierColors = [
    hexToRgb(resolveColor(palette.lineOne)),
    hexToRgb(resolveColor(palette.lineTwo)),
    hexToRgb(resolveColor(palette.lineThree)),
    hexToRgb(resolveColor(palette.lineFour)),
  ]
  const fgColor = hexToRgb(resolveColor(palette.foregroundColor))
  const bgColor = resolveColor(palette.backgroundColor)

  // ── 4. Precompute tier + lum grids ────────────────────────────────────────
  const tierGrid: number[][] = []
  const lumGrid: number[][] = []

  for (let cy = 0; cy < cellCountY; cy++) {
    tierGrid[cy] = []
    lumGrid[cy] = []
    for (let cx = 0; cx < cellCountX; cx++) {
      const px = Math.min(Math.round((cx + 0.5) * cellW), renderW - 1)
      const py = Math.min(Math.round((cy + 0.5) * cellH), renderH - 1)
      const idx = (py * renderW + px) * 4
      let l = luma(pixels[idx], pixels[idx + 1], pixels[idx + 2])
      l = applyContrast(l, lineRenderer.contrast)
      if (!lineRenderer.invert) l = 1 - l
      lumGrid[cy][cx] = l
      tierGrid[cy][cx] = lumToTier(l, lineRenderer.blankSpots).tier
    }
  }

  const getTier = (cy: number, cx: number): number =>
    cy >= 0 && cy < cellCountY && cx >= 0 && cx < cellCountX ? tierGrid[cy][cx] : -99

  // ── SVG path helpers ──────────────────────────────────────────────────────
  const f = (n: number) => n.toFixed(2)

  function vertSegPath(x: number, y: number, w: number, h: number, rxTop: number, rxBottom: number): string {
    const rt = Math.min(rxTop,    w / 2, h / 2)
    const rb = Math.min(rxBottom, w / 2, h / 2)
    if (rt < 0.01 && rb < 0.01)
      return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}"`
    if (Math.abs(rt - rb) < 0.01)
      return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(rt)}"`
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

  const THICK_BLANK = [0.333, 0.555, 0.777, 1.0]
  const THICK_FLAT  = [0.25,  0.50,  0.75,  1.0]
  const GAP_FRAC    = 0.05

  if (lineRenderer.shapeMode === 'squares') {
    // ── Squares ─────────────────────────────────────────────────────────────
    for (let cy = 0; cy < cellCountY; cy++) {
      for (let cx = 0; cx < cellCountX; cx++) {
        const tier = tierGrid[cy][cx]
        if (tier < 0) continue

        const thicknessVal = lineRenderer.blankSpots ? THICK_BLANK[tier] : THICK_FLAT[tier]
        const thickness = thicknessVal * lineRenderer.scale

        let r: number
        if (lineRenderer.showGaps) {
          r = (lineRenderer.scale + (thickness - lineRenderer.scale) * lineRenderer.sizeVariation) * 0.45
        } else {
          r = 0.5 + (thicknessVal * 0.5 - 0.5) * lineRenderer.sizeVariation
        }

        const [rr, rg, rb] = lineRenderer.useColors ? tierColors[tier] : fgColor
        const fill = `fill="rgb(${rr},${rg},${rb})"`
        const ox = (cx + 0.5) * cellW
        const oy = (cy + 0.5) * cellH
        const hw = r * cellW
        const hh = r * cellH

        rects.push(`<rect x="${f(ox - hw)}" y="${f(oy - hh)}" width="${f(2 * hw)}" height="${f(2 * hh)}" ${fill}/>`)
      }
    }

  } else if (lineRenderer.shapeMode === 'mixed') {
    // ── Mixed — 7 brand shapes ───────────────────────────────────────────────
    // Tier order (lightest→darkest): cross, thin bar, small diamond, wide bar,
    //   large diamond, two squares, frame — mirrors the GLSL shader exactly.
    const isDark = globalCfg.isDark
    const mixColors = (isDark ? palette.mixDark : palette.mixLight) ?? palette.mixLight
    const lumMin = lineRenderer.blankSpots ? 0.20 : 0.0
    const s7 = (1.0 - lumMin) / 7.0
    // showGaps scales p by 1.3 in the shader → shapes are 1/1.3 of cell size
    const sc = lineRenderer.showGaps ? (1.0 / 1.3) : 1.0

    for (let cy = 0; cy < cellCountY; cy++) {
      for (let cx = 0; cx < cellCountX; cx++) {
        const l = lumGrid[cy][cx]
        if (l < lumMin) continue

        const lAdj = l - lumMin
        const ox = (cx + 0.5) * cellW
        const oy = (cy + 0.5) * cellH
        const W = cellW * sc   // effective half-cell (×2) in x
        const H = cellH * sc   // effective half-cell (×2) in y

        let tierIdx: number
        if      (lAdj < s7)       tierIdx = 0
        else if (lAdj < 2 * s7)   tierIdx = 1
        else if (lAdj < 3 * s7)   tierIdx = 2
        else if (lAdj < 4 * s7)   tierIdx = 3
        else if (lAdj < 5 * s7)   tierIdx = 4
        else if (lAdj < 6 * s7)   tierIdx = 5
        else                       tierIdx = 6

        const [cr, cg, cb] = hexToRgb(resolveColor(mixColors[tierIdx]))
        const fill = `fill="rgb(${cr},${cg},${cb})"`

        if (tierIdx === 0) {
          // Cross: two overlapping bars
          const hw = 0.502 * W, hh = 0.1044 * H
          const vw = 0.1044 * W, vh = 0.502 * H
          rects.push(`<rect x="${f(ox-hw)}" y="${f(oy-hh)}" width="${f(2*hw)}" height="${f(2*hh)}" ${fill}/>`)
          rects.push(`<rect x="${f(ox-vw)}" y="${f(oy-vh)}" width="${f(2*vw)}" height="${f(2*vh)}" ${fill}/>`)

        } else if (tierIdx === 1) {
          // Thin horizontal bar
          const hw = 0.502 * W, hh = 0.0572 * H
          rects.push(`<rect x="${f(ox-hw)}" y="${f(oy-hh)}" width="${f(2*hw)}" height="${f(2*hh)}" ${fill}/>`)

        } else if (tierIdx === 2) {
          // Small diamond
          const dw = 0.208 * W, dh = 0.208 * H
          rects.push(`<polygon points="${f(ox)},${f(oy-dh)} ${f(ox+dw)},${f(oy)} ${f(ox)},${f(oy+dh)} ${f(ox-dw)},${f(oy)}" ${fill}/>`)

        } else if (tierIdx === 3) {
          // Wide horizontal bar
          const hw = 0.502 * W, hh = 0.1515 * H
          rects.push(`<rect x="${f(ox-hw)}" y="${f(oy-hh)}" width="${f(2*hw)}" height="${f(2*hh)}" ${fill}/>`)

        } else if (tierIdx === 4) {
          // Large diamond
          const dw = 0.404 * W, dh = 0.404 * H
          rects.push(`<polygon points="${f(ox)},${f(oy-dh)} ${f(ox+dw)},${f(oy)} ${f(ox)},${f(oy+dh)} ${f(ox-dw)},${f(oy)}" ${fill}/>`)

        } else if (tierIdx === 5) {
          // Two diagonal squares
          const hw = 0.252 * W, hh = 0.252 * H
          const ocx = 0.25 * W, ocy = 0.25 * H
          rects.push(`<rect x="${f(ox-ocx-hw)}" y="${f(oy+ocy-hh)}" width="${f(2*hw)}" height="${f(2*hh)}" ${fill}/>`)
          rects.push(`<rect x="${f(ox+ocx-hw)}" y="${f(oy-ocy-hh)}" width="${f(2*hw)}" height="${f(2*hh)}" ${fill}/>`)

        } else {
          // Frame (hollow square) — even-odd path
          const ow = 0.502 * W, oh = 0.502 * H
          const iw = 0.210 * W, ih = 0.210 * H
          rects.push(
            `<path fill-rule="evenodd" d="` +
            `M ${f(ox-ow)} ${f(oy-oh)} L ${f(ox+ow)} ${f(oy-oh)} L ${f(ox+ow)} ${f(oy+oh)} L ${f(ox-ow)} ${f(oy+oh)} Z ` +
            `M ${f(ox-iw)} ${f(oy-ih)} L ${f(ox+iw)} ${f(oy-ih)} L ${f(ox+iw)} ${f(oy+ih)} L ${f(ox-iw)} ${f(oy+ih)} Z` +
            `" ${fill}/>`)
        }
      }
    }

  } else {
    // ── Lines ────────────────────────────────────────────────────────────────
    if (!lineRenderer.showGaps) {
      // Merge consecutive same-tier cells into single continuous rects
      if (lineRenderer.vertical) {
        for (let cx = 0; cx < cellCountX; cx++) {
          let runStart = -1, runTier = -2
          const emitRun = (cyEnd: number) => {
            if (runStart < 0 || runTier < 0) return
            const t = (lineRenderer.blankSpots ? THICK_BLANK[runTier] : THICK_FLAT[runTier]) * lineRenderer.scale
            if (t < 0.01) return
            const [r, g, b] = lineRenderer.useColors ? tierColors[runTier] : fgColor
            const stripW = t * cellW
            const x = cx * cellW + (cellW - stripW) / 2
            rects.push(`<rect x="${f(x)}" y="${f(runStart * cellH)}" width="${f(stripW)}" height="${f((cyEnd - runStart) * cellH)}" fill="rgb(${r},${g},${b})"/>`)
          }
          for (let cy = 0; cy <= cellCountY; cy++) {
            const tier = cy < cellCountY ? tierGrid[cy][cx] : -99
            if (tier !== runTier) { emitRun(cy); runTier = tier; runStart = tier >= 0 ? cy : -1 }
          }
        }
      } else {
        for (let cy = 0; cy < cellCountY; cy++) {
          let runStart = -1, runTier = -2
          const emitRun = (cxEnd: number) => {
            if (runStart < 0 || runTier < 0) return
            const t = (lineRenderer.blankSpots ? THICK_BLANK[runTier] : THICK_FLAT[runTier]) * lineRenderer.scale
            if (t < 0.01) return
            const [r, g, b] = lineRenderer.useColors ? tierColors[runTier] : fgColor
            const stripH = t * cellH
            const y = cy * cellH + (cellH - stripH) / 2
            rects.push(`<rect x="${f(runStart * cellW)}" y="${f(y)}" width="${f((cxEnd - runStart) * cellW)}" height="${f(stripH)}" fill="rgb(${r},${g},${b})"/>`)
          }
          for (let cx = 0; cx <= cellCountX; cx++) {
            const tier = cx < cellCountX ? tierGrid[cy][cx] : -99
            if (tier !== runTier) { emitRun(cx); runTier = tier; runStart = tier >= 0 ? cx : -1 }
          }
        }
      }
    } else {
      // showGaps: per-cell segments with gap/cap logic
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
            const connectTop    = getTier(cy - 1, cx) === tier
            const connectBottom = getTier(cy + 1, cx) === tier
            const gapTop    = connectTop    ? 0 : GAP_FRAC
            const gapBottom = connectBottom ? 0 : GAP_FRAC
            const segY = cy * cellH + gapTop * cellH
            const segH = cellH * (1 - gapTop - gapBottom)
            const capR = lineRenderer.capRoundness * stripW * 0.5
            rects.push(vertSegPath(x, segY, stripW, segH, connectTop ? 0 : capR, connectBottom ? 0 : capR) + ` ${fill}/>`)
          } else {
            const stripH = t * cellH
            const y = cy * cellH + (cellH - stripH) / 2
            const connectLeft  = getTier(cy, cx - 1) === tier
            const connectRight = getTier(cy, cx + 1) === tier
            const gapLeft  = connectLeft  ? 0 : GAP_FRAC
            const gapRight = connectRight ? 0 : GAP_FRAC
            const segX = cx * cellW + gapLeft * cellW
            const segW = cellW * (1 - gapLeft - gapRight)
            const capR = lineRenderer.capRoundness * stripH * 0.5
            rects.push(horizSegPath(segX, y, segW, stripH, connectLeft ? 0 : capR, connectRight ? 0 : capR) + ` ${fill}/>`)
          }
        }
      }
    }
  }

  // ── 6. Serialise ──────────────────────────────────────────────────────────
  const svg = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">`,
    ...(lineRenderer.alpha ? [] : [`  <rect width="${svgW}" height="${svgH}" fill="${bgColor}"/>`]),
    ...rects,
    `</svg>`,
  ].join('\n')

  return svg
}
