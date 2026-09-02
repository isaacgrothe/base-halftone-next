'use client'
import { useRef, useState, useEffect } from 'react'
import {
  PanelSection, Row, Slider, Toggle, SegmentedControl,
  ColorSwatch, NumberInput, Select, Divider,
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

const ASPECT_OPTIONS = [
  { label: 'Auto',  value: 'auto'       as const },
  { label: '16:9',  value: '16:9'       as const },
  { label: '9:16',  value: '9:16'       as const },
  { label: '1:1',   value: '1:1'        as const },
  { label: 'Full',  value: 'fullscreen' as const },
]


export function Sidebar({ state, onChange, onExport, onCopy, exportProgress }: Props) {
  const imageFileRef = useRef<HTMLInputElement>(null)
  const videoFileRef = useRef<HTMLInputElement>(null)
  const [format, setFormat] = useState<ExportFormat>('png')

  // Sync format when switching media modes
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

  return (
    <aside
      className="absolute right-0 top-0 h-full z-20 flex flex-col overflow-hidden"
      style={{
        width: 272,
        background: 'rgba(255, 255, 255, 0.97)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(0,0,0,0.07)',
      }}
    >
      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 flex flex-col gap-5">

        {/* ── Source ── */}
        <PanelSection label="Source">
          <SegmentedControl
            options={[{ label: 'Image', value: 'image' as const }, { label: 'Video', value: 'video' as const }]}
            value={state.global.mediaMode}
            onChange={(v) => setGlobal('mediaMode', v)}
          />

          {state.global.mediaMode === 'image' ? (
            <>
              <button
                onClick={() => imageFileRef.current?.click()}
                className="w-full py-2 rounded-[6px] text-[12px] text-black/45 hover:text-black/70 border border-black/10 hover:border-black/20 transition-all duration-150 active:scale-[0.97]"
              >
                Upload image
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
                className="w-full py-2 rounded-[6px] text-[12px] text-black/45 hover:text-black/70 border border-black/10 hover:border-black/20 transition-all duration-150 active:scale-[0.97]"
              >
                Upload video
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

        <Divider />

        {/* ── Lines ── */}
        <PanelSection label="Lines">
          <SegmentedControl
            options={[{ label: 'Vertical', value: 'true' }, { label: 'Horizontal', value: 'false' }]}
            value={String(state.lineRenderer.vertical)}
            onChange={(v) => setLines('vertical', v === 'true')}
          />
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
        </PanelSection>

        <Divider />

        {/* ── Options ── */}
        <PanelSection label="Options">
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
        </PanelSection>

        <Divider />

        {/* ── Colors ── */}
        <PanelSection label="Colors">
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

          {/* Background + Foreground */}
          <div className="flex gap-2.5 mt-0.5">
            <div className="flex flex-col items-center gap-1.5">
              <ColorSwatch color={resolveColor(state.palette.backgroundColor)} onChange={(v) => setPalette('backgroundColor', v)} />
              <span className="text-[10px]" style={{ color: 'rgba(0,0,0,0.35)' }}>BG</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <ColorSwatch color={resolveColor(state.palette.foregroundColor)} onChange={(v) => setPalette('foregroundColor', v)} />
              <span className="text-[10px]" style={{ color: 'rgba(0,0,0,0.35)' }}>FG</span>
            </div>
          </div>

          {/* Tier colors */}
          <div className="flex gap-2.5 mt-0.5">
            {([
              ['lineOne',   '1'] as const,
              ['lineTwo',   '2'] as const,
              ['lineThree', '3'] as const,
              ['lineFour',  '4'] as const,
            ] as const).map(([key, label]) => (
              <div key={key} className="flex flex-col items-center gap-1.5">
                <ColorSwatch
                  color={resolveColor(state.palette[key])}
                  onChange={(v) => setPalette(key, v)}
                />
                <span className="text-[10px]" style={{ color: 'rgba(0,0,0,0.35)' }}>{label}</span>
              </div>
            ))}
          </div>
        </PanelSection>

        <Divider />

        {/* ── Canvas ── */}
        <PanelSection label="Canvas">
          <SegmentedControl options={ASPECT_OPTIONS} value={state.global.aspectRatioMode} onChange={(v) => setGlobal('aspectRatioMode', v)} />

        </PanelSection>

      </div>

      {/* ── Footer / Export ── */}
      <div className="px-4 py-4 flex flex-col gap-2" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>

        {/* Format selector */}
        <Select
          value={format}
          options={
            state.global.mediaMode === 'image'
              ? [{ label: 'PNG', value: 'png' }, { label: 'SVG', value: 'svg' }, { label: 'Config', value: 'config' }]
              : [{ label: 'MP4', value: 'mp4' }, { label: 'WebM', value: 'webm' }, { label: 'Config', value: 'config' }]
          }
          onChange={(v) => setFormat(v as ExportFormat)}
        />

        {/* MP4 progress bar */}
        {(format === 'mp4' || format === 'webm') && exportProgress !== null ? (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-[12px]" style={{ color: 'rgba(0,0,0,0.4)' }}>
              <span>Exporting…</span>
              <span>{Math.round(exportProgress * 100)}%</span>
            </div>
            <div className="w-full rounded-[6px] h-1" style={{ background: 'rgba(0,0,0,0.08)' }}>
              <div
                className="h-1 rounded-[6px] transition-all duration-150"
                style={{ width: `${exportProgress * 100}%`, background: '#0000FF' }}
              />
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => onExport(format)}
              className="flex-1 py-2.5 rounded-[6px] text-[13px] font-medium text-white transition-all duration-150 active:scale-[0.97]"
              style={{ background: '#0000FF' }}
            >
              Export
            </button>
            <button
              onClick={() => onCopy(format)}
              disabled={format === 'mp4' || format === 'webm'}
              className="flex-1 py-2.5 rounded-[6px] text-[13px] text-black/45 hover:text-black/70 border border-black/10 hover:border-black/20 transition-all duration-150 active:scale-[0.97] disabled:opacity-30 disabled:pointer-events-none"
            >
              Copy
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
