import type { DayRecord, Mark, RoundResult } from './types'

export const POINTS = { hit: 6, near: 3, miss: 0, perfectRound: 3, perfectDay: 1 } as const
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

export function scoreRound(order: readonly number[]): RoundResult {
  const marks = markOrder(order)
  const perfect = marks.every((m) => m === 'hit')
  const score =
    marks.reduce((sum, m) => sum + POINTS[m], 0) + (perfect ? POINTS.perfectRound : 0)
  return { order: [...order], marks, score }
}

export const isPerfectRound = (r: RoundResult) => r.marks.every((m) => m === 'hit')

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

export function verdict(order: readonly number[]): string {
  const swaps = swapsAway(order)
  if (swaps === 0) return 'Perfect!'
  if (swaps === 1) return 'So close — one swap away'
  const hits = markOrder(order).filter((m) => m === 'hit').length
  if (hits === 0) return 'Scrambled — but now you know'
  return `${hits} of ${order.length} in the right spot`
}

const EMOJI: Record<Mark, string> = { hit: '🟩', near: '🟨', miss: '🟥' }

export function shareText(day: number, record: DayRecord, teaser: string, url: string): string {
  const total = scoreDay(record.rounds)
  const title = `Pecking Order #${day} — ${total}/${DAY_MAX}${record.hard ? ' 🔥 hard' : ''}`
  const grid = record.rounds.map((r) => r.marks.map((m) => EMOJI[m]).join('')).join('\n')
  return [title, grid, teaser, url].join('\n')
}
