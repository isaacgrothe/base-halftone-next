'use client'
import { useState, useRef, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'

import { NavBar } from '@/components/NavBar'
import { GlobalPanel } from '@/components/panels/GlobalPanel'
import { ColorsPanel } from '@/components/panels/ColorsPanel'
import { ImagePanel } from '@/components/panels/ImagePanel'
import { VideoPanel } from '@/components/panels/VideoPanel'
import { LinesPanel } from '@/components/panels/LinesPanel'
import { DEFAULT_STATE } from '@/lib/defaultState'
import { resolveColor } from '@/lib/spectrum'
import { exportSvg } from '@/lib/exportSvg'
import type { AppState } from '@/lib/types'

type PanelId = 'global' | 'colors' | 'image' | 'video' | 'lines'

// Scene must be client-only (WebGL)
const SceneDynamic = dynamic(
  () => import('@/components/scene/SceneWrapper').then((m) => m.SceneWrapper),
  { ssr: false }
)

export default function Home() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE)
  const [openPanels, setOpenPanels] = useState<Set<PanelId>>(new Set(['global', 'lines']))
  const importRef = useRef<HTMLInputElement>(null)

  const patch = useCallback(<K extends keyof AppState>(key: K, value: AppState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }))
  }, [])

  const togglePanel = useCallback((id: PanelId) => {
    setOpenPanels((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const handleExportConfig = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'halftone-config.json'
    a.click()
  }, [state])

  const handleImportConfig = useCallback(() => importRef.current?.click(), [])
  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string) as AppState
        setState(imported)
      } catch {
        alert('Invalid config JSON')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  const handleExportSvg = useCallback(async () => {
    await exportSvg(state)
  }, [state])

  const canvasStyle: React.CSSProperties = (() => {
    switch (state.global.aspectRatioMode) {
      case '16:9': return { aspectRatio: '16/9', width: '100%', height: 'auto', maxHeight: '100%' }
      case '1:1':  return { width: 'min(100vw, 100vh)', height: 'min(100vw, 100vh)' }
      case 'fullscreen': return { width: '100%', height: '100%' }
      default: return { width: '100%', height: '100%' }
    }
  })()

  const bgColor = resolveColor(state.palette.backgroundColor)

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Background image behind canvas */}
      {state.global.backgroundImageSrc && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${state.global.backgroundImageSrc})`,
            opacity: 0.25,
          }}
        />
      )}

      {/* Canvas */}
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div
          className="relative"
          style={{
            ...canvasStyle,
            borderRadius: state.global.outputCornerRadiusPx,
            overflow: 'hidden',
            background: bgColor,
          }}
        >
          <Canvas
            gl={{ preserveDrawingBuffer: true, antialias: false }}
            camera={{ near: 0.01, far: 100, position: [0, 0, 1] }}
            style={{ width: '100%', height: '100%' }}
          >
            <SceneDynamic state={state} />
          </Canvas>
        </div>
      </div>

      {/* Panels */}
      <AnimatePresence>
        {openPanels.has('global') && (
          <GlobalPanel
            key="global"
            config={state.global}
            onChange={(c) => patch('global', c)}
            onClose={() => togglePanel('global')}
          />
        )}
        {openPanels.has('colors') && (
          <ColorsPanel
            key="colors"
            config={state.palette}
            onChange={(c) => patch('palette', c)}
            onClose={() => togglePanel('colors')}
          />
        )}
        {openPanels.has('image') && state.global.mediaMode === 'image' && (
          <ImagePanel
            key="image"
            config={state.image}
            onChange={(c) => patch('image', c)}
            onClose={() => togglePanel('image')}
          />
        )}
        {openPanels.has('video') && state.global.mediaMode === 'video' && (
          <VideoPanel
            key="video"
            config={state.video}
            onChange={(c) => patch('video', c)}
            onClose={() => togglePanel('video')}
          />
        )}
        {openPanels.has('lines') && (
          <LinesPanel
            key="lines"
            config={state.lineRenderer}
            mediaMode={state.global.mediaMode}
            onChange={(c) => patch('lineRenderer', c)}
            onClose={() => togglePanel('lines')}
            onExportSvg={handleExportSvg}
          />
        )}
      </AnimatePresence>

      <NavBar
        open={openPanels}
        onToggle={togglePanel}
        onExportConfig={handleExportConfig}
        onImportConfig={handleImportConfig}
      />

      <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
    </main>
  )
}
