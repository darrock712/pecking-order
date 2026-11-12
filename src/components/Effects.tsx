import { useEffect, useMemo, useState } from 'react'
import { rng } from '../game/daily'
import { prefersReducedMotion } from '../lib/feedback'
import { formatNumber } from '../lib/format'

const COLORS = ['#3fb37f', '#f2b134', '#ef6a5b', '#5b8def', '#b07cf0']

/** A one-shot burst of confetti. Purely decorative, so hidden from assistive tech. */
export function Confetti({ pieces = 28 }: { pieces?: number }) {
  const bits = useMemo(() => {
    // Seeded so rendering stays pure; nobody can tell one confetti burst from another.
    const random = rng(pieces)
    return Array.from({ length: pieces }, (_, i) => ({
      left: random() * 100,
      delay: random() * 0.25,
      duration: 1.2 + random() * 0.9,
      drift: (random() - 0.5) * 160,
      color: COLORS[i % COLORS.length],
    }))
  }, [pieces])
  if (prefersReducedMotion()) return null
  return (
    <div className="confetti" aria-hidden="true">
      {bits.map((b, i) => (
        <i
          key={i}
          style={{
            left: `${b.left}%`,
            background: b.color,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
            ['--drift' as string]: `${b.drift}px`,
          }}
        />
      ))}
    </div>
  )
}

/** Animates a number from zero up to `value`. Shows the final value at once under reduced motion. */
export function CountUp({ value, places, ms = 600 }: { value: number; places?: number; ms?: number }) {
  const [progress, setProgress] = useState(0)
  const instant = prefersReducedMotion()

  useEffect(() => {
    if (instant) return
    let frame = 0
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      setProgress(1 - (1 - t) ** 3)
      if (t < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    // Animation frames pause in background tabs; make sure the real number always lands.
    const settle = window.setTimeout(() => setProgress(1), ms + 200)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(settle)
    }
  }, [value, ms, instant])

  const digits = places ?? (String(value).split('.')[1] ?? '').length
  return <>{formatNumber(instant || progress === 1 ? value : value * progress, digits)}</>
}
