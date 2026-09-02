'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'

// Disable Three.js color management so hex colors pass through unchanged,
// matching the SVG export which uses raw sRGB hex values directly.
THREE.ColorManagement.enabled = false

import dynamic from 'next/dynamic'
import { Sidebar } from '@/components/Sidebar'
import { ShapeSelector, LEFT_PANEL_W } from '@/components/ShapeSelector'
import { DEFAULT_STATE } from '@/lib/defaultState'
import { resolveColor } from '@/lib/spectrum'
import { exportSvg } from '@/lib/exportSvg'
import { exportMp4 } from '@/lib/exportMp4'
import { exportWebm } from '@/lib/exportWebm'
import type { AppState } from '@/lib/types'

// Scene must be client-only (WebGL)
const SceneDynamic = dynamic(
  () => import('@/components/scene/SceneWrapper').then((m) => m.SceneWrapper),
  { ssr: false }
)

const SIDEBAR_W = 272

export default function Home() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE)
  const [sourceAspect, setSourceAspect] = useState<number | null>(null)
  const [videoDuration, setVideoDuration] = useState<number>(0)
  const [exportProgress, setExportProgress] = useState<number | null>(null)
  const isDark = state.global.isDark
  const glRef = useRef<THREE.WebGLRenderer | null>(null)
  const imageSrcRef = useRef(DEFAULT_STATE.image.src)
  const videoSrcRef = useRef(DEFAULT_STATE.video.src)
  const [windowSize, setWindowSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const update = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const patch = useCallback(<K extends keyof AppState>(key: K, value: AppState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }))
    if (key === 'image') {
      const src = (value as AppState['image']).src
      if (src !== imageSrcRef.current) { imageSrcRef.current = src; setSourceAspect(null) }
    }
    if (key === 'video') {
      const src = (value as AppState['video']).src
      if (src !== videoSrcRef.current) { videoSrcRef.current = src; setSourceAspect(null) }
    }
  }, [])

  type ExportFormat = 'png' | 'svg' | 'config' | 'mp4' | 'webm'

  const handleExport = useCallback(async (format: ExportFormat) => {
    if (format === 'mp4') {
      const canvas = glRef.current?.domElement
      if (!canvas || !videoDuration) return
      setExportProgress(0)
      await exportMp4(canvas, videoDuration, 30, setExportProgress)
      setExportProgress(null)
    } else if (format === 'webm') {
      const canvas = glRef.current?.domElement
      if (!canvas || !videoDuration) return
      setExportProgress(0)
      await exportWebm(canvas, videoDuration, 30, setExportProgress)
      setExportProgress(null)
    } else if (format === 'png') {
      const canvas = glRef.current?.domElement
      if (!canvas) return
      canvas.toBlob((blob) => {
        if (!blob) return
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'halftone.png'
        a.click()
      })
    } else if (format === 'svg') {
      const canvas = glRef.current?.domElement
      const w = canvas?.clientWidth ?? 0
      const h = canvas?.clientHeight ?? 0
      const svg = await exportSvg(state, w, h)
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'halftone.svg'
      a.click()
    } else {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'halftone-config.json'
      a.click()
    }
  }, [state, videoDuration])

  const handleCopy = useCallback(async (format: ExportFormat) => {
    if (format === 'png') {
      const canvas = glRef.current?.domElement
      if (!canvas) return
      canvas.toBlob(async (blob) => {
        if (!blob) return
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      })
    } else if (format === 'svg') {
      const canvas = glRef.current?.domElement
      const w = canvas?.clientWidth ?? 0
      const h = canvas?.clientHeight ?? 0
      const svg = await exportSvg(state, w, h)
      await navigator.clipboard.writeText(svg)
    } else if (format === 'config') {
      await navigator.clipboard.writeText(JSON.stringify(state, null, 2))
    }
  }, [state])

  const canvasStyle: React.CSSProperties = (() => {
    const ar = state.global.aspectRatioMode
    if (ar === 'auto') {
      if (sourceAspect && windowSize.w) {
        const PAD = 16        // p-4 = 1rem = 16px each side
        const cw = windowSize.w - SIDEBAR_W - PAD * 2
        const ch = windowSize.h - PAD * 2
        const w = sourceAspect > cw / ch ? cw : ch * sourceAspect
        const h = sourceAspect > cw / ch ? cw / sourceAspect : ch
        return { width: Math.round(w), height: Math.round(h) }
      }
      return { width: '100%', height: '100%' }
    }
    if (ar === 'custom') {
      const ratio = state.global.customWidth / Math.max(state.global.customHeight, 1)
      if (windowSize.w) {
        const PAD = 32
        const cw = windowSize.w - SIDEBAR_W - PAD * 2
        const ch = windowSize.h - PAD * 2
        const w = ratio > cw / ch ? cw : ch * ratio
        const h = ratio > cw / ch ? cw / ratio : ch
        return { width: Math.round(w), height: Math.round(h) }
      }
      return { aspectRatio: `${state.global.customWidth}/${state.global.customHeight}`, width: '100%', height: 'auto', maxHeight: '100%' }
    }
    if (ar === '16:9') return { aspectRatio: '16/9', width: '100%', height: 'auto', maxHeight: '100%' }
    if (ar === '9:16') return { aspectRatio: '9/16', width: 'auto', height: '100%', maxWidth: '100%' }
    if (ar === '1:1')  return { aspectRatio: '1/1',  width: 'auto', height: '100%', maxWidth: '100%' }
    return { width: '100%', height: '100%' }  // fullscreen
  })()

  const bgColor = resolveColor(state.palette.backgroundColor)

  return (
    <main
      className="relative w-screen h-screen overflow-hidden"
      style={{ background: isDark ? '#141414' : '#EFEFEF', transition: 'background 0.2s ease' }}
    >

      {/* Left shape selector panel */}
      <ShapeSelector
        shapeMode={state.lineRenderer.shapeMode}
        onChange={(mode) => patch('lineRenderer', { ...state.lineRenderer, shapeMode: mode })}
        isDark={isDark}
      />

      {/* Canvas area — inset from both panels */}
      <div
        className="absolute top-0 bottom-0 flex items-center justify-center p-4"
        style={{ left: LEFT_PANEL_W, right: SIDEBAR_W }}
      >
        <div
          className="relative"
          style={{
            ...canvasStyle,
            borderRadius: state.global.outputCornerRadiusPx,
            overflow: 'hidden',
            boxShadow: isDark ? '0 0 0 1px rgba(255,255,255,0.10)' : '0 0 0 1px rgba(0,0,0,0.08)',
            ...(state.lineRenderer.alpha ? {
              backgroundColor: isDark ? '#222222' : '#f0f0f0',
              backgroundImage: isDark ? [
                'linear-gradient(45deg, #2e2e2e 25%, transparent 25%, transparent 75%, #2e2e2e 75%)',
                'linear-gradient(45deg, #2e2e2e 25%, transparent 25%, transparent 75%, #2e2e2e 75%)',
              ].join(', ') : [
                'linear-gradient(45deg, #d8d8d8 25%, transparent 25%, transparent 75%, #d8d8d8 75%)',
                'linear-gradient(45deg, #d8d8d8 25%, transparent 25%, transparent 75%, #d8d8d8 75%)',
              ].join(', '),
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 8px 8px',
            } : {
              background: bgColor,
            }),
          }}
        >
          <Canvas
            gl={{ preserveDrawingBuffer: true, antialias: false, alpha: true, toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.LinearSRGBColorSpace }}
            camera={{ near: 0.01, far: 100, position: [0, 0, 1] }}
            style={{ width: '100%', height: '100%' }}
            onCreated={({ gl }) => { glRef.current = gl }}
          >
            <SceneDynamic state={state} onAspect={setSourceAspect} onDuration={setVideoDuration} />
          </Canvas>
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar
        state={state}
        onChange={patch}
        onExport={handleExport}
        onCopy={handleCopy}
        exportProgress={exportProgress}
      />

    </main>
  )
}
