'use client'
import React, { useRef, useState, useEffect, ReactNode } from 'react'
import {
  PanelSection, Row, Slider, Toggle, SegmentedControl, Select,
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
  isDark: boolean
  onToggleDark: () => void
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
        className="w-full aspect-square rounded-[12px] transition-transform duration-150 active:scale-[0.93]"
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
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left py-4 text-[15px] transition-opacity duration-100 active:opacity-50"
        style={{ color: isDark ? 'rgba(255,255,255,0.9)' : '#000000' }}
      >
        {title}
      </button>
      {open && (
        <div
          className="rounded-[16px] p-4 flex flex-col gap-3.5 mb-1"
          style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.6)' }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function Sidebar({ state, onChange, onExport, onCopy, exportProgress, isDark, onToggleDark }: Props) {
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
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-4 shrink-0">
        <svg width="52" height="17" viewBox="0 0 799 261" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M204.249 89.1163C204.249 84.0819 204.249 81.5648 205.196 79.6285C206.102 77.7745 207.598 76.2754 209.449 75.3672C211.381 74.4186 213.893 74.4186 218.918 74.4186H375.261C380.285 74.4186 382.798 74.4186 384.73 75.3672C386.58 76.2754 388.077 77.7745 388.983 79.6285C389.93 81.5648 389.93 84.0819 389.93 89.1163V245.767C389.93 250.802 389.93 253.319 388.983 255.255C388.077 257.109 386.58 258.608 384.73 259.517C382.798 260.465 380.285 260.465 375.261 260.465H218.918C213.893 260.465 211.381 260.465 209.449 259.517C207.598 258.608 206.102 257.109 205.196 255.255C204.249 253.319 204.249 250.802 204.249 245.767V89.1163Z" fill={isDark ? '#ffffff' : '#0000FF'}/>
          <path d="M408.498 89.1163C408.498 84.0819 408.498 81.5648 409.445 79.6285C410.351 77.7745 411.847 76.2754 413.698 75.3672C415.63 74.4186 418.142 74.4186 423.167 74.4186H579.51C584.534 74.4186 587.047 74.4186 588.979 75.3672C590.829 76.2754 592.326 77.7745 593.232 79.6285C594.179 81.5648 594.179 84.0819 594.179 89.1163V245.767C594.179 250.802 594.179 253.319 593.232 255.255C592.326 257.109 590.829 258.608 588.979 259.517C587.047 260.465 584.534 260.465 579.51 260.465H423.167C418.142 260.465 415.63 260.465 413.698 259.517C411.847 258.608 410.351 257.109 409.445 255.255C408.498 253.319 408.498 250.802 408.498 245.767V89.1163Z" fill={isDark ? '#ffffff' : '#0000FF'}/>
          <path d="M612.747 89.1163C612.747 84.0819 612.747 81.5648 613.694 79.6285C614.6 77.7745 616.096 76.2754 617.946 75.3672C619.879 74.4186 622.391 74.4186 627.416 74.4186H783.759C788.783 74.4186 791.296 74.4186 793.228 75.3672C795.078 76.2754 796.575 77.7745 797.481 79.6285C798.428 81.5648 798.428 84.0819 798.428 89.1163V245.767C798.428 250.802 798.428 253.319 797.481 255.255C796.575 257.109 795.078 258.608 793.228 259.517C791.296 260.465 788.783 260.465 783.759 260.465H627.416C622.391 260.465 619.879 260.465 617.946 259.517C616.096 258.608 614.6 257.109 613.694 255.255C612.747 253.319 612.747 250.802 612.747 245.767V89.1163Z" fill={isDark ? '#ffffff' : '#0000FF'}/>
          <path d="M0.946716 5.20987C0 7.14616 0 9.66333 0 14.6977V245.767C0 250.802 0 253.319 0.946716 255.255C1.85316 257.109 3.34935 258.608 5.19963 259.517C7.13212 260.465 9.64434 260.465 14.6688 260.465H171.012C176.037 260.465 178.549 260.465 180.481 259.517C182.332 258.608 183.828 257.109 184.734 255.255C185.681 253.319 185.681 250.802 185.681 245.767V89.1163C185.681 84.0819 185.681 81.5648 184.734 79.6285C183.828 77.7745 182.332 76.2754 180.481 75.3672C178.549 74.4186 176.037 74.4186 171.012 74.4186H88.9411C83.9167 74.4186 81.4045 74.4186 79.472 73.47C77.6217 72.5618 76.1255 71.0627 75.2191 69.2087C74.2723 67.2724 74.2723 64.7553 74.2723 59.7209V14.6977C74.2723 9.66333 74.2723 7.14616 73.3256 5.20987C72.4192 3.35594 70.923 1.85681 69.0727 0.948581C67.1402 0 64.628 0 59.6036 0H14.6688C9.64434 0 7.13212 0 5.19963 0.948581C3.34935 1.85681 1.85316 3.35594 0.946716 5.20987Z" fill={isDark ? '#ffffff' : '#0000FF'}/>
        </svg>
        <button
          onClick={onToggleDark}
          className="w-5 h-5 rounded-full transition-all duration-150 active:scale-[0.9]"
          style={{ background: isDark ? '#ffffff' : '#000000' }}
          title={isDark ? 'Light mode' : 'Dark mode'}
        />
      </div>

      {/* Scrollable accordion sections */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 flex flex-col">

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
                  className="w-full py-3 rounded-[10px] text-[13px] transition-all duration-150 active:scale-[0.98]"
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
                  className="w-full py-3 rounded-[10px] text-[13px] transition-all duration-150 active:scale-[0.98]"
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

        <AccordionSection title="Lines" isDark={isDark}>
          <PanelSection label="Shape">
            <SegmentedControl
              options={[
                { label: 'Lines',   value: 'lines'   },
                { label: 'Squares', value: 'squares' },
              ]}
              value={state.lineRenderer.shapeMode}
              onChange={(v) => setLines('shapeMode', v as AppState['lineRenderer']['shapeMode'])}
            />
          </PanelSection>
          {state.lineRenderer.shapeMode === 'lines' && (
            <PanelSection label="Direction">
              <SegmentedControl
                options={[{ label: 'Vertical', value: 'true' }, { label: 'Horizontal', value: 'false' }]}
                value={String(state.lineRenderer.vertical)}
                onChange={(v) => setLines('vertical', v === 'true')}
              />
            </PanelSection>
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
          <Row label="Show underlay">
            <Toggle checked={state.lineRenderer.showUnderlay} onChange={(v) => setLines('showUnderlay', v)} />
          </Row>
        </AccordionSection>

        <AccordionSection title="Colors" isDark={isDark}>
          <Select
            value={COLOR_PRESETS.find((p) => p.palette.backgroundColor === state.palette.backgroundColor)?.label ?? 'Custom'}
            options={COLOR_PRESETS.map((p) => ({ label: p.label, value: p.label }))}
            onChange={(label) => {
              const preset = COLOR_PRESETS.find((p) => p.label === label)
              if (preset) {
                onChange('palette', preset.palette as AppState['palette'])
                if (preset.lineRenderer) onChange('lineRenderer', { ...state.lineRenderer, ...preset.lineRenderer })
              }
            }}
          />

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-medium tracking-[0.08em] uppercase" style={{ color: 'var(--ui-label)' }}>Mono</span>
            <div className="grid grid-cols-4 gap-2">
              <LargeSwatch color={resolveColor(state.palette.backgroundColor)} onChange={(v) => setPalette('backgroundColor', v)} />
              <LargeSwatch color={resolveColor(state.palette.foregroundColor)} onChange={(v) => setPalette('foregroundColor', v)} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-medium tracking-[0.08em] uppercase" style={{ color: 'var(--ui-label)' }}>Multi</span>
            <div className="grid grid-cols-4 gap-2">
              {(['lineOne', 'lineTwo', 'lineThree', 'lineFour'] as const).map((key) => (
                <LargeSwatch key={key} color={resolveColor(state.palette[key])} onChange={(v) => setPalette(key, v)} />
              ))}
            </div>
          </div>
        </AccordionSection>

        <AccordionSection title="Canvas" isDark={isDark}>
          <SegmentedControl
            options={ASPECT_OPTIONS}
            value={state.global.aspectRatioMode}
            onChange={(v) => setGlobal('aspectRatioMode', v)}
          />
        </AccordionSection>

      </div>

      {/* Footer / Export */}
      <div
        className="px-4 py-4 flex flex-col gap-2"
        style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)' }}
      >
        <Select
          value={format}
          options={
            state.global.mediaMode === 'image'
              ? [{ label: 'PNG', value: 'png' }, { label: 'SVG', value: 'svg' }, { label: 'Config', value: 'config' }]
              : [{ label: 'MP4', value: 'mp4' }, { label: 'WebM', value: 'webm' }, { label: 'Config', value: 'config' }]
          }
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
                style={{ width: `${exportProgress * 100}%`, background: '#0000FF' }}
              />
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => onExport(format)}
              className="flex-1 py-2.5 rounded-[10px] text-[13px] font-medium text-white transition-all duration-150 active:scale-[0.97]"
              style={{ background: '#0000FF' }}
            >
              Export
            </button>
            <button
              onClick={() => onCopy(format)}
              disabled={format === 'mp4' || format === 'webm'}
              className="flex-1 py-2.5 rounded-[10px] text-[13px] transition-all duration-150 active:scale-[0.97] disabled:opacity-30 disabled:pointer-events-none"
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
