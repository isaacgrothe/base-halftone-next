'use client'
import { ReactNode, useRef } from 'react'
import { motion, useDragControls } from 'framer-motion'

interface Props {
  title: string
  children: ReactNode
  initialX?: number
  initialY?: number
  onClose?: () => void
}

export function DraggablePanel({ title, children, initialX = 20, initialY = 20, onClose }: Props) {
  const dragControls = useDragControls()

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      initial={{ x: initialX, y: initialY, opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.15 }}
      className="absolute z-20 min-w-[260px] max-w-[300px] rounded-2xl overflow-hidden shadow-2xl"
      style={{
        background: 'rgba(15, 15, 20, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Drag handle */}
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="flex items-center justify-between px-4 py-3 cursor-grab active:cursor-grabbing select-none border-b border-white/5"
      >
        <span className="text-xs font-mono text-white/50 uppercase tracking-widest">{title}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/70 text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-3 flex flex-col gap-3 max-h-[70vh] overflow-y-auto">
        {children}
      </div>
    </motion.div>
  )
}
