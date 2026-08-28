'use client'
import { DraggablePanel } from '../DraggablePanel'
import { PanelSection, Row, ColorSwatch, Select, Divider } from '../ui'
import { resolveColor, COLOR_PRESETS } from '@/lib/spectrum'
import type { PaletteConfig } from '@/lib/types'

interface Props {
  config: PaletteConfig
  onChange: (c: PaletteConfig) => void
  onClose: () => void
}

export function ColorsPanel({ config, onChange, onClose }: Props) {
  const set = <K extends keyof PaletteConfig>(key: K, value: PaletteConfig[K]) =>
    onChange({ ...config, [key]: value })

  return (
    <DraggablePanel title="Colors" initialX={340} initialY={80} onClose={onClose}>
      <PanelSection label="Preset">
        <Select
          value={COLOR_PRESETS.find((p) => p.palette.backgroundColor === config.backgroundColor)?.label ?? 'Custom'}
          options={[
            ...COLOR_PRESETS.map((p) => ({ label: p.label, value: p.label })),
            { label: 'Custom', value: 'Custom' },
          ]}
          onChange={(label) => {
            const preset = COLOR_PRESETS.find((p) => p.label === label)
            if (preset) onChange(preset.palette as PaletteConfig)
          }}
        />
      </PanelSection>

      <Divider />

      <PanelSection label="Base">
        <Row label="Background">
          <ColorSwatch
            color={resolveColor(config.backgroundColor)}
            onChange={(v) => set('backgroundColor', v)}
          />
        </Row>
        <Row label="Foreground">
          <ColorSwatch
            color={resolveColor(config.foregroundColor)}
            onChange={(v) => set('foregroundColor', v)}
          />
        </Row>
      </PanelSection>

      <Divider />

      <PanelSection label="Line Colors">
        <Row label="Tier 1">
          <ColorSwatch color={resolveColor(config.lineOne)} onChange={(v) => set('lineOne', v)} />
        </Row>
        <Row label="Tier 2">
          <ColorSwatch color={resolveColor(config.lineTwo)} onChange={(v) => set('lineTwo', v)} />
        </Row>
        <Row label="Tier 3">
          <ColorSwatch color={resolveColor(config.lineThree)} onChange={(v) => set('lineThree', v)} />
        </Row>
        <Row label="Tier 4">
          <ColorSwatch color={resolveColor(config.lineFour)} onChange={(v) => set('lineFour', v)} />
        </Row>
      </PanelSection>
    </DraggablePanel>
  )
}
