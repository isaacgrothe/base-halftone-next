'use client'
// Minimal shared UI primitives for the panels

import { ReactNode, InputHTMLAttributes } from 'react'

export function PanelSection({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {label && <div className="text-[10px] font-mono uppercase tracking-widest text-white/40">{label}</div>}
      {children}
    </div>
  )
}

export function Row({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 min-h-[28px]">
      {label && <span className="text-xs text-white/60 shrink-0 w-28">{label}</span>}
      {children}
    </div>
  )
}

export function Slider({
  value,
  min,
  max,
  step,
  onChange,
  className,
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  className?: string
}) {
  return (
    <div className={`flex items-center gap-2 flex-1 ${className ?? ''}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 0.001}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-blue-500 h-1"
      />
      <span className="text-xs text-white/60 w-10 text-right font-mono">{value.toFixed(2)}</span>
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`w-9 h-5 rounded-full transition-colors relative ${checked ? 'bg-blue-500' : 'bg-white/20'}`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`}
        />
      </div>
      {label && <span className="text-xs text-white/60">{label}</span>}
    </label>
  )
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-1.5 px-2 text-center transition-colors ${
            value === opt.value ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/70'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function ColorSwatch({
  color,
  onChange,
  label,
}: {
  color: string
  onChange: (v: string) => void
  label?: string
}) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-white/60 flex-1">{label}</span>}
      <label className="relative cursor-pointer">
        <div
          className="w-7 h-7 rounded-md border border-white/20"
          style={{ backgroundColor: color }}
        />
        <input
          type="color"
          value={color.startsWith('#') ? color : '#266eff'}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
      </label>
    </div>
  )
}

export function NumberInput({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (v: number) => void
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-20 bg-white/10 text-white text-xs font-mono rounded px-2 py-1 text-right border border-white/10 focus:outline-none focus:border-blue-400"
    />
  )
}

export function Select({
  value,
  options,
  onChange,
}: {
  value: string
  options: { label: string; value: string }[]
  onChange: (v: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white/10 text-white text-xs rounded px-2 py-1 border border-white/10 focus:outline-none focus:border-blue-400 flex-1"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-gray-900">
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function Divider() {
  return <div className="h-px bg-white/10 my-1" />
}
