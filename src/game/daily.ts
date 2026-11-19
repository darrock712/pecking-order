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

const pick = <T,>(pool: readonly T[], index: number): T => pool[((index % pool.length) + pool.length) % pool.length]

/**
 * The plain deal: one easy, one medium and one twist round, each pool taken in
 * order and looping when it runs out. This is how days 1 to 4 were dealt.
 */
export function setsForDay(day: number, all: readonly PuzzleSet[]): PuzzleSet[] {
  return ORDER.map((difficulty) => pick(all.filter((s) => s.difficulty === difficulty), day - 1))
}

/**
 * Mixed-bag rounds arrive on day 5 and then every other day. Starting late
 * keeps day 1 simple and leaves the days already played as they were.
 */
export const MIXED_FROM = 5
export const isMixedDay = (day: number) => day >= MIXED_FROM && (day - MIXED_FROM) % 2 === 0

/**
 * Builds the function that deals a day's three rounds. From day 5 on it deals
 * from queues instead of by index, which buys two things:
 *
 * - a mixed-bag round can take the middle slot on mixed days without the
 *   medium set it displaced being skipped, and
 * - a day never repeats a category: each slot takes the next set in its queue
 *   whose category hasn't come up yet that day.
 *
 * A day's deal depends only on the days before it, so everyone gets the same
 * rounds, and results are remembered so each day is only worked out once.
 */
export function createDealer(all: readonly PuzzleSet[], mixed: readonly PuzzleSet[] = []) {
  const pools = ORDER.map((difficulty) => all.filter((s) => s.difficulty === difficulty))
  // Days 1 to 4 already used the first four sets of each pool.
  const queues = pools.map((pool) => pool.slice(MIXED_FROM - 1))
  const mixedQueue: PuzzleSet[] = []
  const dealt: PuzzleSet[][] = []

  const take = (queue: PuzzleSet[], pool: readonly PuzzleSet[], taken: readonly string[]): PuzzleSet => {
    const fresh = (set: PuzzleSet) => !taken.includes(set.key)
    // Top the queue up when it is empty, or when everything left in it would repeat a category.
    if (!queue.some(fresh)) queue.push(...pool)
    return queue.splice(Math.max(queue.findIndex(fresh), 0), 1)[0]
  }

  return (day: number): PuzzleSet[] => {
    if (day < MIXED_FROM) return setsForDay(day, all)
    while (dealt.length <= day - MIXED_FROM) {
      const dealing = MIXED_FROM + dealt.length
      const easy = take(queues[0], pools[0], [])
      const middle =
        mixed.length > 0 && isMixedDay(dealing) ? take(mixedQueue, mixed, []) : take(queues[1], pools[1], [easy.key])
      const twist = take(queues[2], pools[2], [easy.key, middle.key])
      dealt.push([easy, middle, twist])
    }
    return dealt[day - MIXED_FROM]
  }
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
 * order, that follows the same rule and shares no item with it. Returns
 * undefined if no such set exists (the rule is then shown instead).
 */
export function exampleFor(
  set: PuzzleSet,
  all: readonly PuzzleSet[],
  exclude: readonly PuzzleSet[] = [],
): PuzzleSet | undefined {
  const names = new Set(set.items.map(([name]) => name))
  // An example sharing an item with the puzzle would give that item's place away.
  const matches = all.filter(
    (s) =>
      s !== set &&
      s.key === set.key &&
      s.rule === set.rule &&
      !exclude.includes(s) &&
      !s.items.some(([name]) => names.has(name)),
  )
  if (matches.length === 0) return undefined
  return matches[all.indexOf(set) % matches.length]
}
