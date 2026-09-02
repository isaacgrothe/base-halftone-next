'use client'
import React, { useRef, useState, useEffect, ReactNode } from 'react'
import {
  PanelSection, Row, Slider, Toggle, SegmentedControl,
} from './ui'
import { resolveColor, COLOR_PRESETS } from '@/lib/spectrum'
import type { AppState } from '@/lib/types'

type ExportFormat = 'png' | 'svg' | 'config' | 'mp4' | 'webm'

interface Props {
  state: AppState
  onChange: <K extends keyof AppState>(key: K, value: AppState[K]) => void
  onExport: (format: ExportFormat) => void
  onCopy: (format: ExportFormat) => void
  exportProgress: number | null
}

const LIGHT_VARS = {
  '--ui-label':             'rgba(0,0,0,0.4)',
  '--ui-text':              'rgba(0,0,0,0.75)',
  '--ui-muted':             'rgba(0,0,0,0.4)',
  '--ui-ctrl-bg':           'rgba(0,0,0,0.05)',
  '--ui-ctrl-border':       'rgba(0,0,0,0.0)',
  '--ui-toggle-off':        'rgba(0,0,0,0.15)',
  '--ui-seg-bg':            'rgba(0,0,0,0.06)',
  '--ui-seg-border':        'rgba(0,0,0,0.0)',
  '--ui-seg-active-bg':     '#ffffff',
  '--ui-seg-active-text':   'rgba(0,0,0,0.85)',
  '--ui-seg-inactive-text': 'rgba(0,0,0,0.4)',
  '--ui-swatch-border':     'rgba(0,0,0,0.10)',
  '--ui-divider':           'rgba(0,0,0,0.07)',
  '--ui-slider-track':      'rgba(0,0,0,0.10)',
  '--ui-slider-thumb':      '#0000FF',
  '--ui-accent':            '#0000FF',
} as const

const DARK_VARS = {
  '--ui-label':             'rgba(255,255,255,0.35)',
  '--ui-text':              'rgba(255,255,255,0.75)',
  '--ui-muted':             'rgba(255,255,255,0.35)',
  '--ui-ctrl-bg':           'rgba(255,255,255,0.07)',
  '--ui-ctrl-border':       'rgba(255,255,255,0.0)',
  '--ui-toggle-off':        'rgba(255,255,255,0.18)',
  '--ui-seg-bg':            'rgba(255,255,255,0.07)',
  '--ui-seg-border':        'rgba(255,255,255,0.0)',
  '--ui-seg-active-bg':     'rgba(255,255,255,0.15)',
  '--ui-seg-active-text':   'rgba(255,255,255,0.9)',
  '--ui-seg-inactive-text': 'rgba(255,255,255,0.35)',
  '--ui-swatch-border':     'rgba(255,255,255,0.12)',
  '--ui-divider':           'rgba(255,255,255,0.07)',
  '--ui-slider-track':      'rgba(255,255,255,0.12)',
  '--ui-slider-thumb':      '#ffffff',
  '--ui-accent':            '#7575FF',
} as const

const ASPECT_OPTIONS = [
  { label: 'Auto',  value: 'auto'       as const },
  { label: '16:9',  value: '16:9'       as const },
  { label: '9:16',  value: '9:16'       as const },
  { label: '1:1',   value: '1:1'        as const },
  { label: 'Full',  value: 'fullscreen' as const },
]

function LargeSwatch({ color, onChange }: { color: string; onChange: (v: string) => void }) {
  return (
    <label className="relative cursor-pointer">
      <div
        className="w-full aspect-square rounded-[6px] transition-transform duration-150 active:scale-[0.93]"
        style={{ backgroundColor: color, border: '1.5px solid var(--ui-swatch-border)' }}
      />
      <input
        type="color"
        value={color.startsWith('#') ? color : '#266eff'}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
      />
    </label>
  )
}

function AccordionSection({
  title,
  children,
  defaultOpen = false,
  isDark,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  isDark: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div
      className="rounded-[16px] mb-3 transition-colors duration-150"
      style={open ? { background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.6)' } : {}}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full text-left px-3 py-3 text-[15px] rounded-[10px] transition-colors duration-150 active:opacity-50 ${!open ? 'hover:bg-[var(--ui-ctrl-bg)]' : ''}`}
        style={{ color: isDark ? 'rgba(255,255,255,0.9)' : '#000000' }}
      >
        {title}
      </button>
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3.5">
          {children}
        </div>
      )}
    </div>
  )
}

function DimField({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [text, setText] = useState(String(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setText(String(value))
  }, [value, focused])

  const commit = () => {
    const parsed = parseInt(text, 10)
    if (!isNaN(parsed) && parsed > 0) onChange(Math.min(8192, Math.max(1, parsed)))
    else setText(String(value))
    setFocused(false)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={text}
      onFocus={() => setFocused(true)}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
      className="flex-1 text-[12px] tabular-nums rounded-[8px] px-2 py-1.5 text-center focus:outline-none min-w-0"
      style={{ background: 'var(--ui-ctrl-bg)', color: 'var(--ui-text)' }}
    />
  )
}

function DimInputRow({ width, height, onChange }: { width: number; height: number; onChange: (w: number, h: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <DimField value={width}  onChange={(w) => onChange(w, height)} />
      <span className="text-[12px] shrink-0" style={{ color: 'var(--ui-label)' }}>×</span>
      <DimField value={height} onChange={(h) => onChange(width, h)} />
    </div>
  )
}

export function Sidebar({ state, onChange, onExport, onCopy, exportProgress }: Props) {
  const isDark = state.global.isDark
  const imageFileRef = useRef<HTMLInputElement>(null)
  const videoFileRef = useRef<HTMLInputElement>(null)
  const [format, setFormat] = useState<ExportFormat>('png')

  useEffect(() => {
    if (state.global.mediaMode === 'video' && format !== 'mp4' && format !== 'config') setFormat('mp4')
    if (state.global.mediaMode === 'image' && (format === 'mp4' || format === 'webm')) setFormat('png')
  }, [state.global.mediaMode])

  const setGlobal  = <K extends keyof AppState['global']>(k: K, v: AppState['global'][K]) =>
    onChange('global', { ...state.global, [k]: v })
  const setLines   = <K extends keyof AppState['lineRenderer']>(k: K, v: AppState['lineRenderer'][K]) =>
    onChange('lineRenderer', { ...state.lineRenderer, [k]: v })
  const setPalette = <K extends keyof AppState['palette']>(k: K, v: AppState['palette'][K]) =>
    onChange('palette', { ...state.palette, [k]: v })
  const setImage   = <K extends keyof AppState['image']>(k: K, v: AppState['image'][K]) =>
    onChange('image', { ...state.image, [k]: v })
  const setVideo   = <K extends keyof AppState['video']>(k: K, v: AppState['video'][K]) =>
    onChange('video', { ...state.video, [k]: v })

  const themeVars = isDark ? DARK_VARS : LIGHT_VARS

  return (
    <aside
      className="absolute right-0 top-0 h-full z-20 flex flex-col overflow-hidden"
      style={{
        width: 272,
        background: isDark ? '#1A1A1A' : '#EBEBEB',
        transition: 'background 0.2s ease',
        ...themeVars,
      } as React.CSSProperties}
    >
      {/* Scrollable accordion sections */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pt-4 pb-4 flex flex-col">

        <AccordionSection title="Source" defaultOpen isDark={isDark}>
          <PanelSection label="Type">
            <SegmentedControl
              options={[{ label: 'Image', value: 'image' as const }, { label: 'Video', value: 'video' as const }]}
              value={state.global.mediaMode}
              onChange={(v) => setGlobal('mediaMode', v)}
            />
          </PanelSection>
          <PanelSection label="Input">
            {state.global.mediaMode === 'image' ? (
              <>
                <button
                  onClick={() => imageFileRef.current?.click()}
                  className="w-full py-3 rounded-[10px] text-[12px] transition-all duration-150 active:scale-[0.98]"
                  style={{ color: 'var(--ui-muted)', background: 'var(--ui-ctrl-bg)' }}
                >
                  ↑  Choose file
                </button>
                <input ref={imageFileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) setImage('src', URL.createObjectURL(f))
                  }}
                />
              </>
            ) : (
              <>
                <button
                  onClick={() => videoFileRef.current?.click()}
                  className="w-full py-3 rounded-[10px] text-[12px] transition-all duration-150 active:scale-[0.98]"
                  style={{ color: 'var(--ui-muted)', background: 'var(--ui-ctrl-bg)' }}
                >
                  ↑  Choose file
                </button>
                <input ref={videoFileRef} type="file" accept="video/*" className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) setVideo('src', URL.createObjectURL(f))
                  }}
                />
              </>
            )}
          </PanelSection>
        </AccordionSection>

        <AccordionSection title="Pattern" isDark={isDark}>
          {state.lineRenderer.shapeMode === 'lines' && (
            <SegmentedControl
              options={[{ label: 'Vertical', value: 'true' }, { label: 'Horizontal', value: 'false' }]}
              value={String(state.lineRenderer.vertical)}
              onChange={(v) => setLines('vertical', v === 'true')}
            />
          )}
          {state.lineRenderer.shapeMode === 'squares' && (
            <Row label="Size variation">
              <Slider value={state.lineRenderer.sizeVariation} min={0} max={1} step={0.01} onChange={(v) => setLines('sizeVariation', v)} />
            </Row>
          )}
          <Row label="Resolution">
            <Slider value={state.lineRenderer.resolution} min={0.005} max={0.25} step={0.001} onChange={(v) => setLines('resolution', v)} />
          </Row>
          <Row label="Contrast">
            <Slider value={state.lineRenderer.contrast} min={0.5} max={10} step={0.1} onChange={(v) => setLines('contrast', v)} />
          </Row>
          <Row label="Blur">
            <Slider
              value={state.global.mediaMode === 'image' ? state.image.blurPx : state.video.blurPx}
              min={0} max={40} step={0.5}
              onChange={(v) => state.global.mediaMode === 'image' ? setImage('blurPx', v) : setVideo('blurPx', v)}
            />
          </Row>
        </AccordionSection>

        <AccordionSection title="Options" isDark={isDark}>
          <Row label="Invert">
            <Toggle checked={state.lineRenderer.invert} onChange={(v) => setLines('invert', v)} />
          </Row>
          <Row label="Blank spots">
            <Toggle checked={state.lineRenderer.blankSpots} onChange={(v) => setLines('blankSpots', v)} />
          </Row>
          <Row label="Show gaps">
            <Toggle checked={state.lineRenderer.showGaps} onChange={(v) => setLines('showGaps', v)} />
          </Row>
          <Row label="Use colors">
            <Toggle checked={state.lineRenderer.useColors} onChange={(v) => setLines('useColors', v)} />
          </Row>
          <Row label="Alpha">
            <Toggle checked={state.lineRenderer.alpha} onChange={(v) => setLines('alpha', v)} />
          </Row>
          <Row label="Underlay">
            <Toggle checked={state.lineRenderer.showUnderlay} onChange={(v) => setLines('showUnderlay', v)} />
          </Row>
        </AccordionSection>

        <AccordionSection title="Colors" isDark={isDark}>
          <SegmentedControl
            options={[{ label: 'Light', value: 'Core' }, { label: 'Dark', value: 'Dark Mode' }]}
            value={isDark ? 'Dark Mode' : 'Core'}
            onChange={(label) => {
              const preset = COLOR_PRESETS.find((p) => p.label === label)
              if (preset) {
                onChange('palette', { ...state.palette, ...preset.palette } as AppState['palette'])
                if (preset.lineRenderer) onChange('lineRenderer', { ...state.lineRenderer, ...preset.lineRenderer })
                if (preset.isDark !== undefined) onChange('global', { ...state.global, isDark: preset.isDark })
              }
            }}
          />

          <div className="flex flex-col gap-2">
            <span className="text-[12px]" style={{ color: 'var(--ui-label)' }}>Mono</span>
            <div className="grid grid-cols-7 gap-1.5">
              <LargeSwatch color={resolveColor(state.palette.backgroundColor)} onChange={(v) => setPalette('backgroundColor', v)} />
              <LargeSwatch color={resolveColor(state.palette.foregroundColor)} onChange={(v) => setPalette('foregroundColor', v)} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[12px]" style={{ color: 'var(--ui-label)' }}>Multi</span>
            {state.lineRenderer.shapeMode === 'mixed' ? (
              <div className="grid grid-cols-7 gap-1.5">
                {(isDark ? state.palette.mixDark : state.palette.mixLight)?.map((c, i) => (
                  <LargeSwatch
                    key={i}
                    color={resolveColor(c)}
                    onChange={(v) => {
                      const mixKey = isDark ? 'mixDark' : 'mixLight'
                      const arr = state.palette[mixKey]!
                      const next = [...arr] as typeof arr
                      next[i] = v
                      setPalette(mixKey, next)
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1.5">
                {(['lineOne', 'lineTwo', 'lineThree', 'lineFour'] as const).map((key) => (
                  <LargeSwatch key={key} color={resolveColor(state.palette[key])} onChange={(v) => setPalette(key, v)} />
                ))}
              </div>
            )}
          </div>
        </AccordionSection>

        <AccordionSection title="Canvas" isDark={isDark}>
          <SegmentedControl
            options={ASPECT_OPTIONS}
            value={state.global.aspectRatioMode}
            onChange={(v) => setGlobal('aspectRatioMode', v)}
          />
          <DimInputRow
            width={state.global.customWidth}
            height={state.global.customHeight}
            onChange={(w, h) => onChange('global', { ...state.global, customWidth: w, customHeight: h, aspectRatioMode: 'custom' })}
          />
        </AccordionSection>

      </div>

      {/* Footer / Export */}
      <div
        className="px-4 py-4 flex flex-col gap-2"
        style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)' }}
      >
        <SegmentedControl
          options={
            state.global.mediaMode === 'image'
              ? [{ label: 'PNG', value: 'png' }, { label: 'SVG', value: 'svg' }, { label: 'Config', value: 'config' }]
              : [{ label: 'MP4', value: 'mp4' }, { label: 'WebM', value: 'webm' }, { label: 'Config', value: 'config' }]
          }
          value={format}
          onChange={(v) => setFormat(v as ExportFormat)}
        />

        {(format === 'mp4' || format === 'webm') && exportProgress !== null ? (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-[12px]" style={{ color: 'var(--ui-muted)' }}>
              <span>Exporting…</span>
              <span>{Math.round(exportProgress * 100)}%</span>
            </div>
            <div className="w-full rounded-full h-1" style={{ background: 'var(--ui-slider-track)' }}>
              <div
                className="h-1 rounded-full transition-all duration-150"
                style={{ width: `${exportProgress * 100}%`, background: 'var(--ui-accent)' }}
              />
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => onExport(format)}
              className="flex-1 py-2.5 rounded-[10px] text-[12px] font-medium text-white transition-all duration-150 active:scale-[0.97]"
              style={{ background: 'var(--ui-accent)' }}
            >
              Export
            </button>
            <button
              onClick={() => onCopy(format)}
              disabled={format === 'mp4' || format === 'webm'}
              className="flex-1 py-2.5 rounded-[10px] text-[12px] transition-all duration-150 active:scale-[0.97] disabled:opacity-30 disabled:pointer-events-none"
              style={{ color: 'var(--ui-muted)', background: 'var(--ui-ctrl-bg)' }}
            >
              Copy
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
