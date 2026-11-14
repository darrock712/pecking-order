import type { DayRecord, Mark, RoundResult } from './types'

/** `fixed` is a tile moved into its right spot on the second peck. */
export const POINTS = { hit: 6, near: 3, miss: 0, fixed: 4, perfectRound: 3, perfectDay: 1 } as const
/** 5 items x 6 + 3 bonus. Three rounds plus the perfect-day point makes 100. */
export const ROUND_MAX = 33
export const DAY_MAX = 100

/**
 * `order[position]` is the index of the item the player put there. Items are
 * stored in the correct order, so an item is right when it equals its position.
 */
export function markOrder(order: readonly number[]): Mark[] {
  return order.map((item, position) => {
    const distance = Math.abs(item - position)
    return distance === 0 ? 'hit' : distance === 1 ? 'near' : 'miss'
  })
}

/**
 * Each round allows two pecks. `first` is the first-peck order; locking the
 * same order again is keeping it, and scores exactly like a single try. After
 * a real second peck, greens that were already right keep 6, greens that were
 * fixed earn 4, and the perfect-round bonus is off the table.
 */
export function scoreRound(order: readonly number[], first?: readonly number[]): RoundResult {
  const marks = markOrder(order)
  const pecked = first?.some((item, position) => item !== order[position]) ? [...first] : undefined
  const perfect = !pecked && marks.every((m) => m === 'hit')
  const score =
    marks.reduce(
      (sum, m, position) =>
        sum + (m === 'hit' && pecked && pecked[position] !== position ? POINTS.fixed : POINTS[m]),
      0,
    ) + (perfect ? POINTS.perfectRound : 0)
  return pecked ? { order: [...order], marks, score, first: pecked } : { order: [...order], marks, score }
}

/** Perfect means all five right on the first peck. */
export const isPerfectRound = (r: RoundResult) => !r.first && r.marks.every((m) => m === 'hit')

/** The colour of the bird that lands for a round: green from 80% of the points, amber from 40%. */
export function roundTone(score: number): Mark {
  return score >= ROUND_MAX * 0.8 ? 'hit' : score >= ROUND_MAX * 0.4 ? 'near' : 'miss'
}

export function scoreDay(rounds: readonly RoundResult[]): number {
  const total = rounds.reduce((sum, r) => sum + r.score, 0)
  const perfectDay = rounds.length === 3 && rounds.every(isPerfectRound)
  return total + (perfectDay ? POINTS.perfectDay : 0)
}

/** Fewest swaps needed to fix the order (cycle decomposition). */
export function swapsAway(order: readonly number[]): number {
  const seen = new Array<boolean>(order.length).fill(false)
  let swaps = 0
  for (let i = 0; i < order.length; i++) {
    let length = 0
    for (let j = i; !seen[j]; j = order[j]) {
      seen[j] = true
      length++
    }
    if (length > 1) swaps += length - 1
  }
  return swaps
}

export function verdict(order: readonly number[], pecked = false): string {
  const swaps = swapsAway(order)
  if (swaps === 0) return pecked ? 'Fixed it on the second peck' : 'Perfect!'
  if (swaps === 1) return 'So close — one swap away'
  const hits = markOrder(order).filter((m) => m === 'hit').length
  if (hits === 0) return 'Scrambled — but now you know'
  return `${hits} of ${order.length} in the right spot`
}

const EMOJI: Record<Mark, string> = { hit: '🟩', near: '🟨', miss: '🟥' }

export function shareText(day: number, record: DayRecord, teaser: string, url: string): string {
  const total = scoreDay(record.rounds)
  const title = `Pecking Order #${day} — ${total}/${DAY_MAX}${record.hard ? ' 🔥 hard' : ''}`
  const grid = record.rounds.map((r) => r.marks.map((m) => EMOJI[m]).join('') + (r.first ? ' ↻' : '')).join('\n')
  return [title, grid, teaser, url].join('\n')
}
