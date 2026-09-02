'use client'
import { DraggablePanel } from '../DraggablePanel'
import { PanelSection, Row, Slider, Toggle, SegmentedControl, Divider } from '../ui'
import type { LineRendererConfig } from '@/lib/types'

interface Props {
  config: LineRendererConfig
  mediaMode: 'image' | 'video'
  onChange: (c: LineRendererConfig) => void
  onClose: () => void
  onExportSvg?: () => void
}

export function LinesPanel({ config, mediaMode, onChange, onClose, onExportSvg }: Props) {
  const set = <K extends keyof LineRendererConfig>(key: K, value: LineRendererConfig[K]) =>
    onChange({ ...config, [key]: value })

  return (
    <DraggablePanel title="Lines" initialX={660} initialY={80} onClose={onClose}>
      <PanelSection label="Renderer">
        <Row label="Orientation">
          <SegmentedControl
            options={[{ label: 'Vertical', value: true as unknown as string }, { label: 'Horizontal', value: false as unknown as string }]}
            value={String(config.vertical)}
            onChange={(v) => set('vertical', v === 'true')}
          />
        </Row>
        <Row label="Resolution">
          <Slider value={config.resolution} min={0.005} max={0.12} step={0.001} onChange={(v) => set('resolution', v)} />
        </Row>
        <Row label="Contrast">
          <Slider value={config.contrast} min={0.5} max={10} step={0.1} onChange={(v) => set('contrast', v)} />
        </Row>
      </PanelSection>

      <Divider />

      <PanelSection label="Options">
        <Row label="Invert">
          <Toggle checked={config.invert} onChange={(v) => set('invert', v)} />
        </Row>
        <Row label="Blank spots">
          <Toggle checked={config.blankSpots} onChange={(v) => set('blankSpots', v)} />
        </Row>
        <Row label="Show gaps">
          <Toggle checked={config.showGaps} onChange={(v) => set('showGaps', v)} />
        </Row>
        <Row label="Use colors">
          <Toggle checked={config.useColors} onChange={(v) => set('useColors', v)} />
        </Row>
        <Row label="Alpha">
          <Toggle checked={config.alpha} onChange={(v) => set('alpha', v)} />
        </Row>
        <Row label="Show underlay">
          <Toggle checked={config.showUnderlay} onChange={(v) => set('showUnderlay', v)} />
        </Row>
      </PanelSection>

      {mediaMode === 'image' && onExportSvg && (
        <>
          <Divider />
          <PanelSection label="Export">
            <button
              onClick={onExportSvg}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono tracking-wide transition-colors"
            >
              Export SVG
            </button>
          </PanelSection>
        </>
      )}
    </DraggablePanel>
  )
}
