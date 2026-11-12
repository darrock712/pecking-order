import { isPerfectRound, scoreDay } from './scoring'
import type { DayRecord, Save } from './types'

export interface Stats {
  played: number
  average: number
  perfectRounds: number
  perfectDays: number
  streak: number
  bestStreak: number
}

const isFinished = (r: DayRecord | undefined): r is DayRecord => !!r && r.rounds.length === 3

/**
 * Stats only count days finished on their own calendar day, so the archive
 * can't be used to pad a streak. The streak counts days *played*: a low score
 * never breaks it. It stays alive through today until the day is over.
 */
export function computeStats(days: Save['days'], today: number): Stats {
  const live = Object.entries(days)
    .filter(([, r]) => isFinished(r) && r.live)
    .map(([d, r]) => [Number(d), r] as const)
    .sort((a, b) => a[0] - b[0])

  let best = 0
  let run = 0
  let previous = Number.NaN
  for (const [day] of live) {
    run = day === previous + 1 ? run + 1 : 1
    best = Math.max(best, run)
    previous = day
  }
  const streak = previous === today || previous === today - 1 ? run : 0

  const scores = live.map(([, r]) => scoreDay(r.rounds))
  return {
    played: live.length,
    average: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    perfectRounds: live.reduce((n, [, r]) => n + r.rounds.filter(isPerfectRound).length, 0),
    perfectDays: live.filter(([, r]) => r.rounds.every(isPerfectRound)).length,
    streak,
    bestStreak: best,
  }
}
