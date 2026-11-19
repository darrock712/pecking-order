import { useEffect, useMemo, useRef, useState } from 'react'
import { shuffledOrder } from '../game/daily'
import { CHECKS, ROUND_MAX, isPerfectRound, scoreRound, verdict } from '../game/scoring'
import type { Check, PuzzleSet, RoundResult } from '../game/types'
import { playFanfare, playLock, playMark, playTick, prefersReducedMotion } from '../lib/feedback'
import { endLabels, formatValue, isCountable, scaleValues, unitOf } from '../lib/format'
import { Confetti, CountUp } from './Effects'

interface Props {
  set: PuzzleSet
  /** Hard mode: the rule is hidden and this solved set is the only clue. Without one, the rule shows. */
  example?: PuzzleSet
  hard: boolean
  seed: number
  label: string
  showHint: boolean
  muted: boolean
  nextLabel: string
  /** A first peck already made on this round (restored after a reload). */
  firstPeck?: number[]
  /** The first lock that wasn't perfect: "not quite", two checks and one more go. */
  onPeck?: (order: number[]) => void
  /** Checks already used on this round (restored after a reload). */
  usedChecks?: Check[]
  onCheck?: (checks: Check[]) => void
  onLock: (result: RoundResult) => void
  onNext: () => void
}

/** arrange → reveal (tiles resolve one by one) → done (verdict shown, tiles slide into the true order). */
type Phase = 'arrange' | 'reveal' | 'done'

const STEP_MS = 650
const FINAL_PAUSE_MS = 500
const SETTLE_MS = 1100
// How long the "Locked in" beat holds before the reveal starts.
const LOCK_MS = 480
const INTERVAL_KEYS = ['year', 'temp']

/** What a check said, pinned to its tile wherever that tile moves. */
const checkText = (check: Check) => (check.item === check.slot ? `✓ right in slot ${check.slot + 1}` : `✗ not slot ${check.slot + 1}`)

const move = (order: number[], from: number, to: number) => {
  const next = [...order]
  next.splice(to, 0, ...next.splice(from, 1))
  return next
}

export function Round({ set, example, hard, seed, label, showHint, muted, nextLabel, firstPeck, onPeck, usedChecks, onCheck, onLock, onNext }: Props) {
  const count = set.items.length
  const [order, setOrder] = useState(() => firstPeck ?? shuffledOrder(count, seed))
  // The first peck, once made. It only says "not quite": the colours wait for the final reveal.
  const [first, setFirst] = useState<number[] | null>(firstPeck ?? null)
  const unchanged = !!first && first.every((item, position) => item === order[position])
  const [selected, setSelected] = useState<number | null>(null)
  const [phase, setPhase] = useState<Phase>('arrange')
  // The player's answer, frozen at lock-in. `order` keeps driving the layout so
  // the tiles can slide into the correct order afterwards.
  const [locked, setLocked] = useState<RoundResult | null>(null)
  const [revealed, setRevealed] = useState(0)
  const [settled, setSettled] = useState(false)
  const [drag, setDrag] = useState<{ item: number; offset: number } | null>(null)
  const [announcement, setAnnouncement] = useState('')
  // After a wrong first peck, up to CHECKS tiles can be checked. `picking` is the tile-choosing mode.
  const [checks, setChecks] = useState<Check[]>(usedChecks ?? [])
  const [picking, setPicking] = useState(false)
  const checksLeft = first ? CHECKS - checks.length : 0
  const checkRef = useRef<HTMLButtonElement>(null)
  const focusAfter = useRef<'check' | number | null>(null)

  const listRef = useRef<HTMLOListElement>(null)
  const pointer = useRef<{ item: number; startY: number; startPos: number; moved: boolean } | null>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const [locking, setLocking] = useState(false)
  const lockTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => clearTimeout(lockTimer.current), [])

  const scale = useMemo(
    () => scaleValues(set.items.map(([, value]) => value), INTERVAL_KEYS.includes(set.key)),
    [set],
  )
  const [firstEnd, lastEnd] = endLabels(set.rule)
  // A mixed-bag round has no rule to guess: the units on the tiles are the puzzle.
  const mixed = set.units !== undefined
  const ruleHidden = hard && !mixed && !!example && phase === 'arrange'
  const name = (item: number) => set.items[item][0]

  // The reveal: tiles resolve one at a time from the top, with a held beat before the last.
  useEffect(() => {
    if (phase !== 'reveal' || !locked) return
    const timers: number[] = []
    for (let i = 0; i < count; i++) {
      const delay = 350 + i * STEP_MS + (i === count - 1 ? FINAL_PAUSE_MS : 0)
      timers.push(
        window.setTimeout(() => {
          setRevealed(i + 1)
          playMark(locked.marks[i], muted)
        }, delay),
      )
    }
    const end = 350 + (count - 1) * STEP_MS + FINAL_PAUSE_MS + 750
    timers.push(
      window.setTimeout(() => {
        setPhase('done')
        if (isPerfectRound(locked)) playFanfare(muted)
      }, end),
    )
    return () => timers.forEach(clearTimeout)
  }, [phase, locked, count, muted])

  // Impatient? Show every tile at once.
  const skipReveal = () => {
    if (phase !== 'reveal' || !locked) return
    setRevealed(count)
    setPhase('done')
    if (isPerfectRound(locked)) playFanfare(muted)
  }

  // After the verdict has had a moment, slide every tile to where it really belongs.
  useEffect(() => {
    if (phase !== 'done') return
    nextRef.current?.focus({ preventScroll: true })
    const timer = window.setTimeout(
      () => {
        setOrder(set.items.map((_, i) => i))
        setSettled(true)
      },
      prefersReducedMotion() ? 0 : SETTLE_MS,
    )
    return () => clearTimeout(timer)
  }, [phase, set])

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

  const startCheck = () => {
    setSelected(null)
    setPicking(true)
    setAnnouncement('Tap the tile to check. Escape cancels.')
  }

  const cancelCheck = () => {
    setPicking(false)
    focusAfter.current = 'check'
  }

  const checkTile = (item: number) => {
    const check: Check = { item, slot: order.indexOf(item) }
    const right = check.item === check.slot
    const next = [...checks, check]
    setChecks(next)
    setPicking(false)
    onCheck?.(next)
    playMark(right ? 'hit' : 'miss', muted)
    focusAfter.current = item
    setAnnouncement(`${name(item)}: ${right ? 'right' : 'wrong'} in slot ${check.slot + 1}.`)
  }

  /** The latest check on a tile: what the player knows about it now. */
  const checkOf = (item: number) => checks.findLast((c) => c.item === item)

  // Keep keyboard focus somewhere sensible as the check mode comes and goes.
  const tileButton = (item: number) => listRef.current?.querySelectorAll<HTMLButtonElement>('.tile')[item]
  useEffect(() => {
    const target = focusAfter.current
    focusAfter.current = null
    if (picking) tileButton(order[0])?.focus({ preventScroll: true })
    else if (target === 'check') checkRef.current?.focus({ preventScroll: true })
    else if (typeof target === 'number') tileButton(target)?.focus({ preventScroll: true })
    // Only when the check mode changes, not on every reorder.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picking, checks])

  const tap = (item: number) => {
    if (picking) return checkTile(item)
    if (selected === null) setSelected(item)
    else if (selected === item) setSelected(null)
    else {
      swap(selected, item)
      setSelected(null)
    }
  }

  const rowHeight = () => (listRef.current ? listRef.current.offsetHeight / count : 64)

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>, item: number) => {
    if (phase !== 'arrange' || locking || e.button > 0) return
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Capture is a nicety (keeps the drag alive off the tile); carry on without it.
    }
    pointer.current = { item, startY: e.clientY, startPos: order.indexOf(item), moved: false }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const p = pointer.current
    if (!p || picking) return
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
    if (phase !== 'arrange' || locking) return
    const position = order.indexOf(item)
    if (picking && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) return
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

  // A short "Locked in" beat first, so pressing the button feels like committing.
  const lock = () => {
    if (locking) return
    setPicking(false)
    if (prefersReducedMotion()) return commit()
    setSelected(null)
    setLocking(true)
    playLock(muted)
    lockTimer.current = window.setTimeout(commit, LOCK_MS)
  }

  const commit = () => {
    setSelected(null)
    setLocking(false)
    if (!first && order.some((item, position) => item !== position)) {
      // First peck, not perfect: just "not quite". Two checks, then one more go.
      setFirst([...order])
      onPeck?.([...order])
      playMark('miss', muted)
      setAnnouncement(`Not quite. Check up to ${CHECKS} tiles for a clue, then have one more go.`)
      return
    }
    const result = scoreRound(order, first ?? undefined)
    setLocked(result)
    onLock(result)
    if (prefersReducedMotion()) {
      // No staged reveal: show everything at once.
      setRevealed(count)
      setPhase('done')
    } else {
      setPhase('reveal')
    }
  }

  const perfect = phase === 'done' && !!locked && isPerfectRound(locked)

  return (
    <section
      className="round"
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && picking) cancelCheck()
      }}
    >
      <div className="round-head">
        <p className="round-label">{label}</p>
        <h2 className="rule">{ruleHidden ? 'Mystery rule' : set.rule}</h2>
      </div>

      {ruleHidden && example && (
        <div className="example">
          <p>These are in order. Spot the rule:</p>
          <ol>
            {example.items.map(([itemName]) => (
              <li key={itemName}>{itemName}</li>
            ))}
          </ol>
        </div>
      )}

      {mixed && !first && phase === 'arrange' && (
        <p className="hint">Each tile counts something different. Just compare the numbers.</p>
      )}

      {showHint && !mixed && !first && phase === 'arrange' && (
        <p className="hint">Drag to reorder, or tap two to swap. Then lock it in.</p>
      )}

      {first && phase === 'arrange' && (
        <p className="peck-note">
          <b>Not quite!</b> 🔍 Check up to {CHECKS} tiles for a clue, then have one more go.
        </p>
      )}

      {!ruleHidden && (
        <p className="end-label">
          <b>1</b> = {firstEnd}
        </p>
      )}
      <div className={mixed ? 'board mixed' : 'board'} style={{ ['--count' as string]: count }}>
        <ol className="slots" aria-hidden="true">
          {set.items.map((_, slot) => (
            <li key={slot} className={slot === 0 || slot === count - 1 ? 'end' : undefined}>{slot + 1}</li>
          ))}
        </ol>
        <ol className={locking ? 'tiles locking' : 'tiles'} ref={listRef}>
          {set.items.map((item, id) => {
            const position = order.indexOf(id)
            // Where the player put this item, which is what the colour reports on.
            const guessed = locked ? locked.order.indexOf(id) : position
            const shown = !!locked && guessed < revealed
            const mark = shown ? locked.marks[guessed] : undefined
            const dragging = drag?.item === id
            const unit = unitOf(set, id)
            const check = phase === 'arrange' ? checkOf(id) : undefined
            const checkedRight = !!check && check.item === check.slot
            return (
              <li
                key={id}
                className={['tile-slot', dragging && 'dragging', settled && 'settling'].filter(Boolean).join(' ')}
                style={{
                  top: `calc(var(--row) * ${position})`,
                  ['--i' as string]: position,
                  transform: dragging ? `translateY(${drag.offset}px) scale(1.03)` : undefined,
                }}
              >
                <button
                  type="button"
                  className={['tile', mark, selected === id && 'selected', picking && 'picking', showHint && position === 0 && phase === 'arrange' && 'nudge']
                    .filter(Boolean)
                    .join(' ')}
                  disabled={phase !== 'arrange'}
                  aria-label={
                    phase === 'arrange'
                      ? picking
                        ? `Check ${item[0]} in slot ${position + 1}`
                        : `${item[0]}${mixed ? ` (${unit})` : ''}, position ${position + 1} of ${count}.${check ? ` Checked: ${checkedRight ? 'right' : 'wrong'} in slot ${check.slot + 1}.` : ''} Arrow keys move it.`
                      : `${item[0]}, ${formatValue(item, unit)}`
                  }
                  aria-pressed={phase === 'arrange' ? selected === id : undefined}
                  onPointerDown={(e) => onPointerDown(e, id)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  onKeyDown={(e) => onKeyDown(e, id)}
                >
                  <span className="tile-name">
                    {item[0]}
                    {mixed && !shown && <small className="tile-unit">{unit}</small>}
                    {check && <small className={`tile-clue ${checkedRight ? 'yes' : 'no'}`}>{checkText(check)}</small>}
                  </span>
                  {shown ? (
                    <span className="tile-value">
                      {isCountable(item, unit) ? (
                        <>
                          <CountUp value={item[1]} /> {unit}
                        </>
                      ) : (
                        formatValue(item, unit)
                      )}
                      {mark !== 'hit' && !settled && <small>belongs at {id + 1}</small>}
                    </span>
                  ) : (
                    phase === 'arrange' && <span className="grip" aria-hidden="true">⋮⋮</span>
                  )}
                  {shown && <span className="bar" aria-hidden="true" style={{ width: `${scale.fractions[id] * 100}%` }} />}
                </button>
              </li>
            )
          })}
        </ol>
      </div>
      {!ruleHidden && (
        <p className="end-label">
          <b>{count}</b> = {lastEnd}
        </p>
      )}

      <p className="sr-only" aria-live="polite">{announcement}</p>

      {first && phase === 'arrange' && !locking && (
        <div className="check-row">
          {picking ? (
            <>
              <p>🔍 Tap a tile to check it.</p>
              <button type="button" className="hint-cancel" onClick={cancelCheck}>Cancel</button>
            </>
          ) : (
            <button type="button" className="hint-btn" ref={checkRef} disabled={checksLeft === 0} onClick={startCheck}>
              {checksLeft > 0 ? `🔍 Check a tile · ${checksLeft} left` : 'No checks left'}
            </button>
          )}
        </div>
      )}

      {phase === 'arrange' && (
        <button type="button" className={locking ? 'primary lock locking' : 'primary lock'} aria-disabled={locking} onClick={lock}>
          <span key={locking ? 'locked' : 'idle'}>
            {locking ? 'Locked in ✓' : !first ? 'Lock it in' : unchanged ? 'Show me the answer' : 'Final answer'}
          </span>
        </button>
      )}

      {phase === 'reveal' && (
        <button type="button" className="hint-cancel skip" onClick={skipReveal}>Skip ›</button>
      )}

      {phase === 'done' && locked && (
        <div className="result" aria-live="polite">
          {perfect && <Confetti />}
          <p className={`verdict ${perfect ? 'perfect' : ''}`}>{verdict(locked.order, !!locked.first)}</p>
          <p className="points">
            +<CountUp value={locked.score} places={0} /> <span>of {ROUND_MAX}</span>
          </p>
          {hard && example && !mixed && <p className="rule-reveal">The rule was: {set.rule}</p>}
          {scale.log && <p className="scale-note">Bars are squeezed to fit. The real gaps are even bigger.</p>}
          <button type="button" className="primary" ref={nextRef} onClick={onNext}>
            {nextLabel}
          </button>
        </div>
      )}
    </section>
  )
}
