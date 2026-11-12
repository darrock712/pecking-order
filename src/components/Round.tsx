import { useEffect, useMemo, useRef, useState } from 'react'
import { shuffledOrder } from '../game/daily'
import { ROUND_MAX, isPerfectRound, scoreRound, verdict } from '../game/scoring'
import type { PuzzleSet, RoundResult } from '../game/types'
import { playFanfare, playMark, playTick, prefersReducedMotion } from '../lib/feedback'
import { formatValue, isCountable } from '../lib/format'
import { Confetti, CountUp } from './Effects'

interface Props {
  set: PuzzleSet
  /** Hard mode: the rule is hidden and this solved set is shown as the only clue. */
  example?: PuzzleSet
  hard: boolean
  seed: number
  label: string
  showHint: boolean
  muted: boolean
  nextLabel: string
  onLock: (result: RoundResult) => void
  onNext: () => void
}

type Phase = 'arrange' | 'reveal' | 'done'

const STEP_MS = 650
const FINAL_PAUSE_MS = 500

const move = (order: number[], from: number, to: number) => {
  const next = [...order]
  next.splice(to, 0, ...next.splice(from, 1))
  return next
}

export function Round({ set, example, hard, seed, label, showHint, muted, nextLabel, onLock, onNext }: Props) {
  const count = set.items.length
  const [order, setOrder] = useState(() => shuffledOrder(count, seed))
  const [selected, setSelected] = useState<number | null>(null)
  const [phase, setPhase] = useState<Phase>('arrange')
  const [revealed, setRevealed] = useState(0)
  const [drag, setDrag] = useState<{ item: number; offset: number } | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const listRef = useRef<HTMLOListElement>(null)
  const pointer = useRef<{ item: number; startY: number; startPos: number; moved: boolean } | null>(null)
  const nextRef = useRef<HTMLButtonElement>(null)

  const result = useMemo(() => scoreRound(order), [order])
  const [first, last] = set.rule.split(' → ')
  const ruleHidden = hard && phase === 'arrange'
  const name = (item: number) => set.items[item][0]

  // The reveal: tiles resolve one at a time from the top, with a held beat before the last.
  useEffect(() => {
    if (phase !== 'reveal') return
    if (prefersReducedMotion()) {
      setRevealed(count)
      setPhase('done')
      return
    }
    const timers: number[] = []
    for (let i = 0; i < count; i++) {
      const delay = 350 + i * STEP_MS + (i === count - 1 ? FINAL_PAUSE_MS : 0)
      timers.push(
        window.setTimeout(() => {
          setRevealed(i + 1)
          playMark(result.marks[i], muted)
        }, delay),
      )
    }
    const end = 350 + (count - 1) * STEP_MS + FINAL_PAUSE_MS + 750
    timers.push(
      window.setTimeout(() => {
        setPhase('done')
        if (isPerfectRound(result)) playFanfare(muted)
      }, end),
    )
    return () => timers.forEach(clearTimeout)
    // The order is frozen once the reveal starts, so `result` cannot change underneath it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  useEffect(() => {
    if (phase === 'done') nextRef.current?.focus({ preventScroll: true })
  }, [phase])

  const reorder = (from: number, to: number) => {
    if (from === to) return
    setOrder((o) => move(o, from, to))
    playTick(muted)
  }

  const swap = (a: number, b: number) => {
    setOrder((o) => {
      const next = [...o]
      const [pa, pb] = [next.indexOf(a), next.indexOf(b)]
      ;[next[pa], next[pb]] = [next[pb], next[pa]]
      return next
    })
    playTick(muted)
    setAnnouncement(`Swapped ${name(a)} and ${name(b)}.`)
  }

  const tap = (item: number) => {
    if (selected === null) setSelected(item)
    else if (selected === item) setSelected(null)
    else {
      swap(selected, item)
      setSelected(null)
    }
  }

  const rowHeight = () => (listRef.current ? listRef.current.offsetHeight / count : 64)

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>, item: number) => {
    if (phase !== 'arrange' || e.button > 0) return
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Capture is a nicety (keeps the drag alive off the tile); carry on without it.
    }
    pointer.current = { item, startY: e.clientY, startPos: order.indexOf(item), moved: false }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const p = pointer.current
    if (!p) return
    const dy = e.clientY - p.startY
    if (!p.moved && Math.abs(dy) < 6) return
    p.moved = true
    setSelected(null)
    const row = rowHeight()
    const position = order.indexOf(p.item)
    const target = Math.max(0, Math.min(count - 1, Math.round(p.startPos + dy / row)))
    // The tile's slot moves as the list reorders, so subtract that from the finger offset.
    setDrag({ item: p.item, offset: dy - (target - p.startPos) * row })
    reorder(position, target)
  }

  const onPointerUp = () => {
    const p = pointer.current
    pointer.current = null
    setDrag(null)
    if (p && !p.moved) tap(p.item)
  }

  const onKeyDown = (e: React.KeyboardEvent, item: number) => {
    if (phase !== 'arrange') return
    const position = order.indexOf(item)
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const target = Math.max(0, Math.min(count - 1, position + (e.key === 'ArrowUp' ? -1 : 1)))
      reorder(position, target)
      setAnnouncement(`${name(item)} moved to position ${target + 1} of ${count}.`)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      tap(item)
    }
  }

  const lock = () => {
    setSelected(null)
    onLock(result)
    setPhase('reveal')
  }

  const perfect = phase === 'done' && isPerfectRound(result)

  return (
    <section className="round" aria-label={label}>
      <p className="round-label">{label}</p>
      <h2 className="rule">{ruleHidden ? 'Hidden rule' : set.rule}</h2>

      {hard && example && phase === 'arrange' && (
        <div className="example">
          <p>Your only clue — these are in the right order:</p>
          <ol>
            {example.items.map(([itemName]) => (
              <li key={itemName}>{itemName}</li>
            ))}
          </ol>
        </div>
      )}

      {showHint && phase === 'arrange' && (
        <p className="hint">Drag to reorder, or tap two to swap. Then lock it in.</p>
      )}

      <p className="end-label">{ruleHidden ? '?' : first}</p>
      <ol className="tiles" ref={listRef} style={{ ['--count' as string]: count }}>
        {set.items.map((item, id) => {
          const position = order.indexOf(id)
          const shown = phase !== 'arrange' && position < revealed
          const mark = shown ? result.marks[position] : undefined
          const dragging = drag?.item === id
          return (
            <li
              key={id}
              className={['tile-slot', dragging && 'dragging'].filter(Boolean).join(' ')}
              style={{
                top: `calc(var(--row) * ${position})`,
                transform: dragging ? `translateY(${drag.offset}px) scale(1.03)` : undefined,
              }}
            >
              <button
                type="button"
                className={['tile', mark, selected === id && 'selected', showHint && position === 0 && phase === 'arrange' && 'nudge']
                  .filter(Boolean)
                  .join(' ')}
                disabled={phase !== 'arrange'}
                aria-label={
                  phase === 'arrange'
                    ? `${item[0]}, position ${position + 1} of ${count}. Arrow keys move it.`
                    : `${item[0]}, ${formatValue(item, set.unit)}`
                }
                aria-pressed={phase === 'arrange' ? selected === id : undefined}
                onPointerDown={(e) => onPointerDown(e, id)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={(e) => onKeyDown(e, id)}
              >
                <span className="tile-rank" aria-hidden="true">{position + 1}</span>
                <span className="tile-name">{item[0]}</span>
                {shown ? (
                  <span className="tile-value">
                    {isCountable(item, set.unit) ? (
                      <>
                        <CountUp value={item[1]} /> {set.unit}
                      </>
                    ) : (
                      formatValue(item, set.unit)
                    )}
                    {mark !== 'hit' && <small>belongs at {id + 1}</small>}
                  </span>
                ) : (
                  phase === 'arrange' && <span className="grip" aria-hidden="true">⋮⋮</span>
                )}
              </button>
            </li>
          )
        })}
      </ol>
      <p className="end-label">{ruleHidden ? '?' : last}</p>

      <p className="sr-only" aria-live="polite">{announcement}</p>

      {phase === 'arrange' && (
        <button type="button" className="primary" onClick={lock}>
          Lock it in
        </button>
      )}

      {phase === 'done' && (
        <div className="result" aria-live="polite">
          {perfect && <Confetti />}
          <p className={`verdict ${perfect ? 'perfect' : ''}`}>{verdict(order)}</p>
          <p className="points">
            +<CountUp value={result.score} places={0} /> <span>of {ROUND_MAX}</span>
          </p>
          {hard && <p className="rule-reveal">The rule was: {set.rule}</p>}
          <p className="surprise">{set.surprise}</p>
          <button type="button" className="primary" ref={nextRef} onClick={onNext}>
            {nextLabel}
          </button>
        </div>
      )}
    </section>
  )
}
