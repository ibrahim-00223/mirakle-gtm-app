'use client'

import { useEffect, useRef } from 'react'
import { formatScore } from '@/lib/utils'

interface ScoreBarProps {
  score: number
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export function ScoreBar({ score, showLabel = true, size = 'md' }: ScoreBarProps) {
  const fillRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = fillRef.current
    if (!el) return
    // Start at 0, animate to score
    el.style.width = '0%'
    const timeout = setTimeout(() => {
      el.style.width = `${score}%`
    }, 50)
    return () => clearTimeout(timeout)
  }, [score])

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex-1 bg-white/[0.08] rounded-full overflow-hidden ${size === 'sm' ? 'h-1.5' : 'h-2'}`}
      >
        <div
          ref={fillRef}
          className="h-full rounded-full transition-all duration-700 ease-out score-bar-fill"
          style={{ width: '0%' }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono text-slate-400 w-9 shrink-0 text-right">
          {formatScore(score)}
        </span>
      )}
    </div>
  )
}
