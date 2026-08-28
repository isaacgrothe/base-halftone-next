'use client'
import { useRef } from 'react'
import { DraggablePanel } from '../DraggablePanel'
import { PanelSection, Row, Toggle, Divider, Select } from '../ui'
import { VIDEO_PRESETS } from '@/lib/presets'
import type { VideoConfig } from '@/lib/types'

interface Props {
  config: VideoConfig
  onChange: (c: VideoConfig) => void
  onClose: () => void
}

export function VideoPanel({ config, onChange, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const set = <K extends keyof VideoConfig>(key: K, value: VideoConfig[K]) =>
    onChange({ ...config, [key]: value })

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    set('src', URL.createObjectURL(file))
  }

  return (
    <DraggablePanel title="Video" initialX={340} initialY={340} onClose={onClose}>
      <PanelSection label="Source">
        <Select
          value={config.src}
          options={VIDEO_PRESETS.map((p) => ({ label: p.label, value: p.src }))}
          onChange={(v) => set('src', v)}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="text-xs text-blue-400 hover:text-blue-300 text-left"
        >
          Upload video…
        </button>
        <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleUpload} />
      </PanelSection>

      <Divider />

      <PanelSection label="Playback">
        <Row label="Loop">
          <Toggle checked={config.loop} onChange={(v) => set('loop', v)} />
        </Row>
        <Row label="Muted">
          <Toggle checked={config.muted} onChange={(v) => set('muted', v)} />
        </Row>
        <Row label="Auto-play">
          <Toggle checked={config.autoPlay} onChange={(v) => set('autoPlay', v)} />
        </Row>
      </PanelSection>
    </DraggablePanel>
  )
}
