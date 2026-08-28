'use client'
import { useRef } from 'react'
import { DraggablePanel } from '../DraggablePanel'
import { PanelSection, Row, Slider, Divider, Select } from '../ui'
import { IMAGE_PRESETS, GRADIENT_PRESETS } from '@/lib/presets'
import type { ImageConfig } from '@/lib/types'

interface Props {
  config: ImageConfig
  onChange: (c: ImageConfig) => void
  onClose: () => void
}

const ALL_PRESETS = [
  ...IMAGE_PRESETS.map((p) => ({ label: p.label, value: p.src })),
  ...GRADIENT_PRESETS.map((p) => ({ label: `Grad: ${p.label}`, value: p.src })),
]

export function ImagePanel({ config, onChange, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const set = <K extends keyof ImageConfig>(key: K, value: ImageConfig[K]) =>
    onChange({ ...config, [key]: value })

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    set('src', url)
  }

  return (
    <DraggablePanel title="Image" initialX={20} initialY={340} onClose={onClose}>
      <PanelSection label="Source">
        <Select
          value={config.src}
          options={ALL_PRESETS}
          onChange={(v) => set('src', v)}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="text-xs text-blue-400 hover:text-blue-300 text-left"
        >
          Upload image…
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </PanelSection>

      <Divider />

      <PanelSection label="Behaviour">
        <Row label="Blur">
          <Slider value={config.blurPx} min={0} max={40} step={0.5} onChange={(v) => set('blurPx', v)} />
        </Row>
      </PanelSection>
    </DraggablePanel>
  )
}
