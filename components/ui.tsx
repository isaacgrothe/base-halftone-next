'use client'
// Minimal shared UI primitives — Base design system aesthetic

import { ReactNode, useState, useEffect } from 'react'

export function PanelSection({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      {label && (
        <div className="text-[11px] font-medium tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {label}
        </div>
      )}
      {children}
    </div>
  )
}

export function Row({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 min-h-[30px]">
      {label && (
        <span className="text-[13px] shrink-0 w-28" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {label}
        </span>
      )}
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
  const [text, setText] = useState(value.toFixed(2))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setText(value.toFixed(2))
  }, [value, focused])

  const commit = () => {
    const parsed = parseFloat(text)
    if (!isNaN(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed))
      onChange(clamped)
      setText(clamped.toFixed(2))
    } else {
      setText(value.toFixed(2))
    }
    setFocused(false)
  }

  return (
    <div className={`flex items-center gap-3 flex-1 ${className ?? ''}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 0.001}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 base-slider"
      />
      <input
        type="text"
        inputMode="decimal"
        value={text}
        onFocus={() => { setFocused(true); setText(value.toFixed(2)) }}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.currentTarget.blur(); return }
          const delta = 0.01
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault()
            const current = parseFloat(text)
            const base = isNaN(current) ? value : current
            const next = Math.min(max, Math.max(min, base + (e.key === 'ArrowUp' ? delta : -delta)))
            setText(next.toFixed(2))
            onChange(next)
          }
        }}
        className="text-[12px] w-9 text-right tabular-nums shrink-0 bg-transparent border-b border-transparent focus:border-white/30 outline-none transition-colors duration-150 cursor-text"
        style={{ color: 'rgba(255,255,255,0.45)' }}
      />
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
        className="relative"
        style={{
          width: 36,
          height: 20,
          borderRadius: 5,
          background: checked ? '#0000FF' : 'rgba(255,255,255,0.14)',
          transition: 'background 0.15s ease-out',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: 2,
            width: 16,
            height: 16,
            borderRadius: 3,
            background: 'white',
            transition: 'transform 0.15s ease-out',
            transform: checked ? 'translateX(16px)' : 'translateX(0)',
          }}
        />
      </div>
      {label && (
        <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {label}
        </span>
      )}
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
    <div
      className="flex gap-0.5 p-0.5 rounded-[6px] text-[12px]"
      style={{
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-1.5 px-2 text-center rounded-[5px] transition-all duration-150 active:scale-[0.96] ${
            value === opt.value
              ? 'bg-white text-black font-medium'
              : 'hover:text-white'
          }`}
          style={value === opt.value ? {} : { color: 'rgba(255,255,255,0.45)' }}
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
      {label && (
        <span className="text-[13px] flex-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {label}
        </span>
      )}
      <label className="relative cursor-pointer">
        <div
          className="w-8 h-8 rounded-[6px] transition-transform duration-150 active:scale-[0.9]"
          style={{
            backgroundColor: color,
            border: '1.5px solid rgba(255,255,255,0.18)',
          }}
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
      className="w-20 text-white text-[12px] tabular-nums rounded-[6px] px-3 py-1.5 text-right border focus:outline-none transition-colors"
      style={{
        background: 'rgba(255,255,255,0.07)',
        borderColor: 'rgba(255,255,255,0.1)',
      }}
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
      className="text-white text-[12px] rounded-[6px] px-3 py-1.5 border focus:outline-none transition-colors flex-1 appearance-none"
      style={{
        background: 'rgba(255,255,255,0.07)',
        borderColor: 'rgba(255,255,255,0.1)',
      }}
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
  return <div className="h-px my-0.5" style={{ background: 'rgba(255,255,255,0.07)' }} />
}
