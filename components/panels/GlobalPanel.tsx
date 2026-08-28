'use client'
import { DraggablePanel } from '../DraggablePanel'
import { PanelSection, Row, SegmentedControl, NumberInput, Select } from '../ui'
import type { GlobalConfig } from '@/lib/types'

interface Props {
  config: GlobalConfig
  onChange: (c: GlobalConfig) => void
  onClose: () => void
}

const ASPECT_OPTIONS = [
  { label: 'Auto', value: 'auto' as const },
  { label: '16:9', value: '16:9' as const },
  { label: '1:1', value: '1:1' as const },
  { label: 'Full', value: 'fullscreen' as const },
]

const HERO_OPTIONS = [
  { label: 'Off', value: 'off' as const },
  { label: 'Light', value: 'light' as const },
  { label: 'Dark', value: 'dark' as const },
]

export function GlobalPanel({ config, onChange, onClose }: Props) {
  const set = <K extends keyof GlobalConfig>(key: K, value: GlobalConfig[K]) =>
    onChange({ ...config, [key]: value })

  return (
    <DraggablePanel title="Global" initialX={20} initialY={80} onClose={onClose}>
      <PanelSection label="Media">
        <SegmentedControl
          options={[{ label: 'Image', value: 'image' as const }, { label: 'Video', value: 'video' as const }]}
          value={config.mediaMode}
          onChange={(v) => set('mediaMode', v)}
        />
      </PanelSection>

      <PanelSection label="Aspect Ratio">
        <SegmentedControl options={ASPECT_OPTIONS} value={config.aspectRatioMode} onChange={(v) => set('aspectRatioMode', v)} />
      </PanelSection>

      <PanelSection label="Hero Mode">
        <SegmentedControl options={HERO_OPTIONS} value={config.heroMode} onChange={(v) => set('heroMode', v)} />
      </PanelSection>

      <PanelSection label="Canvas">
        <Row label="Corner radius">
          <NumberInput
            value={config.outputCornerRadiusPx}
            min={0}
            max={64}
            step={1}
            onChange={(v) => set('outputCornerRadiusPx', v)}
          />
          <span className="text-xs text-white/40 ml-1">px</span>
        </Row>
      </PanelSection>
    </DraggablePanel>
  )
}
