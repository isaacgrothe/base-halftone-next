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
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 rounded-2xl px-3 py-2 shadow-2xl"
      style={{
        background: 'rgba(15, 15, 20, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {PANELS.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => onToggle(id)}
          title={label}
          className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 text-sm transition-colors ${
            open.has(id) ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/10'
          }`}
        >
          <span className="text-base leading-none">{icon}</span>
          <span className="text-[9px] font-mono">{label}</span>
        </button>
      ))}

      <div className="w-px h-6 bg-white/10 mx-1" />

      <button
        onClick={onExportConfig}
        title="Export config JSON"
        className="w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
      >
        <span className="text-base leading-none">↑</span>
        <span className="text-[9px] font-mono">Export</span>
      </button>

      <button
        onClick={onImportConfig}
        title="Import config JSON"
        className="w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
      >
        <span className="text-base leading-none">↓</span>
        <span className="text-[9px] font-mono">Import</span>
      </button>
    </div>
  )
}
