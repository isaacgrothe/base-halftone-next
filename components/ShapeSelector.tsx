'use client'
import React from 'react'
import type { ShapeMode } from '@/lib/types'

// All SVG coordinates are derived from the user's 128.878×128.878 button artwork,
// converted to button-local space then scaled to a 44×44 viewBox (scale = 44/128.878).

function LinesIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      {/* Left column — tall bar (top), short bar (bottom) */}
      <rect x="10.32" y="9.44"  width="7.10" height="14.13" rx="1.02" fill="currentColor"/>
      <rect x="11.99" y="25.10" width="3.76" height="9.45"  rx="1.02" fill="currentColor"/>
      {/* Center column — short bar (top), tall bar (bottom) */}
      <rect x="18.45" y="20.44" width="7.10" height="14.13" rx="1.02" fill="currentColor"/>
      <rect x="20.12" y="9.44"  width="3.76" height="9.45"  rx="1.02" fill="currentColor"/>
      {/* Right column — tall bar (top), short bar (bottom) */}
      <rect x="26.59" y="9.44"  width="7.10" height="14.13" rx="1.02" fill="currentColor"/>
      <rect x="28.26" y="25.10" width="3.76" height="9.45"  rx="1.02" fill="currentColor"/>
    </svg>
  )
}

function SquaresIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <rect x="11.65" y="11.65" width="9.30" height="9.30" rx="1.02" fill="currentColor"/>
      <rect x="23.06" y="11.65" width="9.30" height="9.30" rx="1.02" fill="currentColor"/>
      <rect x="23.06" y="23.06" width="9.30" height="9.30" rx="1.02" fill="currentColor"/>
      <rect x="11.65" y="23.06" width="9.30" height="9.30" rx="1.02" fill="currentColor"/>
    </svg>
  )
}

function MixedIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      {/* Hollow square (frame) — top right */}
      <path
        fillRule="evenodd"
        fill="currentColor"
        d="M21.56 11.10H32.45V22.00H21.56V11.10ZM24.70 14.24H29.32V18.86H24.70V14.24Z"
      />
      {/* Diamond — top left */}
      <rect
        x="15.29" y="12.33" width="5.96" height="5.96"
        transform="rotate(45 15.29 12.33)"
        fill="currentColor"
      />
      {/* Cross / plus — bottom left */}
      <path
        fill="currentColor"
        d="M16.87 27.40H20.63V29.45H16.87V33.22H14.81V29.45H11.04V27.40H14.81V23.63H16.87V27.40Z"
      />
      {/* Wide bar — bottom right */}
      <rect x="24.12" y="26.50" width="8.24" height="3.85" fill="currentColor"/>
    </svg>
  )
}

const MODES: { mode: ShapeMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'lines',   label: 'Lines',   icon: <LinesIcon />   },
  { mode: 'squares', label: 'Squares', icon: <SquaresIcon /> },
  { mode: 'mixed',   label: 'Mixed',   icon: <MixedIcon />   },
]

export const LEFT_PANEL_W = 80

interface Props {
  shapeMode: ShapeMode
  onChange: (mode: ShapeMode) => void
  isDark: boolean
}

export function ShapeSelector({ shapeMode, onChange, isDark }: Props) {
  const logoColor = isDark ? '#ffffff' : '#0000FF'
  return (
    <aside
      className="absolute left-0 top-0 h-full z-20 flex flex-col items-center"
      style={{
        width: LEFT_PANEL_W,
        background: isDark ? '#1A1A1A' : '#EBEBEB',
        transition: 'background 0.2s ease',
        borderRight: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
      }}
    >
      {/* Logo */}
      <div className="pt-4 pb-2 flex items-center justify-center w-full">
        <svg width="52" height="27" viewBox="0 0 510 266" fill="none">
          <g fill={logoColor}>
            <rect x="78.5991" y="0.293945" width="97.0455" height="76.9947"/>
            <path d="M0 187.167L-4.71228e-06 79.3622C-4.74297e-06 78.6599 0.569291 78.0906 1.27155 78.0906L76.9947 78.0906L76.9947 187.167L0 187.167Z"/>
            <rect x="0.0380859" y="78.501" width="110.602" height="76.9947" transform="rotate(-45 0.0380859 78.501)"/>
            <path d="M254.559 78.5015L175.764 0.293946L121.908 54.7374L200.116 132.945L254.559 78.5015Z"/>
            <rect width="97.0455" height="76.9947" transform="matrix(1 0 0 -1 78.5991 265.279)"/>
            <rect width="110.602" height="76.9947" transform="matrix(0.707107 0.707107 0.707107 -0.707107 0.0385742 187.071)"/>
            <path d="M254.56 187.071L175.764 265.293L121.909 210.835L200.116 132.628L254.56 187.071Z"/>
            <rect width="97.0455" height="76.9947" transform="matrix(-1 0 0 1 430.689 0.293945)"/>
            <path d="M509.288 187.167L509.288 79.3622C509.288 78.6599 508.719 78.0906 508.017 78.0906L432.293 78.0906L432.293 187.167L509.288 187.167Z"/>
            <rect width="110.602" height="76.9947" transform="matrix(-0.707107 -0.707107 -0.707107 0.707107 509.25 78.5015)"/>
            <path d="M254.729 78.5015L333.265 0.293703L387.38 54.7374L309.173 132.945L254.729 78.5015Z"/>
            <rect x="430.689" y="265.28" width="97.0455" height="76.9947" transform="rotate(-180 430.689 265.28)"/>
            <rect x="509.25" y="187.072" width="110.602" height="76.9947" transform="rotate(135 509.25 187.072)"/>
            <path d="M254.728 187.072L333.264 265.294L387.379 210.836L309.172 132.629L254.728 187.072Z"/>
          </g>
        </svg>
      </div>

      {/* Shape mode buttons */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        {MODES.map(({ mode, label, icon }) => (
          <button
            key={mode}
            onClick={() => onChange(mode)}
            title={label}
            className="flex items-center justify-center transition-all duration-150 active:scale-[0.93]"
            style={{
              width: 60,
              height: 60,
              borderRadius: 10,
              color: isDark ? '#FFFFFF' : '#0000FF',
              background: shapeMode === mode
                ? (isDark ? '#2A2A2A' : 'rgba(0,0,0,0.08)')
                : 'transparent',
            }}
          >
            {icon}
          </button>
        ))}
      </div>
    </aside>
  )
}
