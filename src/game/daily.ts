import type { Difficulty, PuzzleSet } from './types'

/** Day 1 of the game, as a local calendar date. */
export const EPOCH = { year: 2026, month: 11, day: 11 }

const DAY_MS = 86_400_000
const ORDER: Difficulty[] = ['easy', 'medium', 'twist']

/**
 * Puzzle number for a moment in time, using the player's local calendar date.
 * Both dates are projected onto UTC midnight first, so a 23- or 25-hour DST day
 * can never skip or repeat a puzzle.
 */
export function dayNumber(now: Date): number {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const start = Date.UTC(EPOCH.year, EPOCH.month - 1, EPOCH.day)
  return Math.round((today - start) / DAY_MS) + 1
}

export function dateForDay(day: number): Date {
  return new Date(EPOCH.year, EPOCH.month - 1, EPOCH.day + day - 1)
}

export function msUntilNextDay(now: Date): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return next.getTime() - now.getTime()
}

/** The three rounds for a day: one easy, one medium, one twist. Loops when content runs out. */
export function setsForDay(day: number, all: readonly PuzzleSet[]): PuzzleSet[] {
  return ORDER.map((difficulty) => {
    const pool = all.filter((s) => s.difficulty === difficulty)
    return pool[(((day - 1) % pool.length) + pool.length) % pool.length]
  })
}

/** Small deterministic PRNG (mulberry32) so every player sees the same shuffle. */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Starting order for a round. At most one item starts in its correct place and
 * the list is never the exact reverse, so the answer always takes real thought.
 */
export function shuffledOrder(count: number, seed: number): number[] {
  const random = rng(seed)
  const solved = Array.from({ length: count }, (_, i) => i)
  const isGiveaway = (o: number[]) =>
    o.filter((v, i) => v === i).length > 1 || o.every((v, i) => v === count - 1 - i)

  for (let attempt = 0; attempt < 50; attempt++) {
    const order = [...solved]
    for (let i = count - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }
    if (!isGiveaway(order)) return order
  }
  // Practically unreachable; a rotation has no item in place and is not the reverse.
  return [...solved.slice(1), solved[0]]
}

/**
 * Hard mode hides the rule and instead shows a different set, already in
 * order, that follows the same rule. Returns undefined if no such set exists.
 */
export function exampleFor(
  set: PuzzleSet,
  all: readonly PuzzleSet[],
  exclude: readonly PuzzleSet[] = [],
): PuzzleSet | undefined {
  const matches = all.filter(
    (s) => s !== set && s.key === set.key && s.rule === set.rule && !exclude.includes(s),
  )
  if (matches.length === 0) return undefined
  return matches[all.indexOf(set) % matches.length]
}
