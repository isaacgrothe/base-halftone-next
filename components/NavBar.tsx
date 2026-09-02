'use client'

type PanelId = 'global' | 'colors' | 'image' | 'video' | 'lines'

interface Props {
  open: Set<PanelId>
  onToggle: (id: PanelId) => void
  onExportConfig: () => void
  onImportConfig: () => void
}

const PANELS: { id: PanelId; label: string; icon: string }[] = [
  { id: 'global', label: 'Global', icon: '⊞' },
  { id: 'colors', label: 'Colors', icon: '◉' },
  { id: 'image',  label: 'Image',  icon: '⬜' },
  { id: 'video',  label: 'Video',  icon: '▷' },
  { id: 'lines',  label: 'Lines',  icon: '≡' },
]

export function NavBar({ open, onToggle, onExportConfig, onImportConfig }: Props) {
  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-0.5 rounded-[10px] px-2 py-1.5 shadow-2xl"
      style={{
        background: 'rgba(10, 10, 14, 0.92)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {PANELS.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => onToggle(id)}
          title={label}
          className="w-11 h-10 rounded-[8px] flex flex-col items-center justify-center gap-0.5 transition-all duration-150 active:scale-[0.92]"
          style={{
            background: open.has(id) ? 'rgba(255,255,255,0.12)' : 'transparent',
            color: open.has(id) ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.38)',
          }}
        >
          <span className="text-[15px] leading-none">{icon}</span>
          <span className="text-[9px] tracking-wide">{label}</span>
        </button>
      ))}

      <div className="w-px h-5 mx-1" style={{ background: 'rgba(255,255,255,0.08)' }} />

      <button
        onClick={onExportConfig}
        title="Export config JSON"
        className="w-11 h-10 rounded-[8px] flex flex-col items-center justify-center gap-0.5 transition-all duration-150 active:scale-[0.92]"
        style={{ color: 'rgba(255,255,255,0.38)' }}
      >
        <span className="text-[15px] leading-none">↑</span>
        <span className="text-[9px] tracking-wide">Export</span>
      </button>

      <button
        onClick={onImportConfig}
        title="Import config JSON"
        className="w-11 h-10 rounded-[8px] flex flex-col items-center justify-center gap-0.5 transition-all duration-150 active:scale-[0.92]"
        style={{ color: 'rgba(255,255,255,0.38)' }}
      >
        <span className="text-[15px] leading-none">↓</span>
        <span className="text-[9px] tracking-wide">Import</span>
      </button>
    </div>
  )
}
