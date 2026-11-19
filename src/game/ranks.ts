/** Lifetime points needed for each rank. At ~65 points a day the top takes about four months. */
export const RANKS = [
  [0, 'Egg', 'Something is stirring in there.'],
  [100, 'Hatchling', 'Out of the shell. Hello, world!'],
  [300, 'Fledgling', 'Real feathers now. Mind the edge.'],
  [700, 'Sparrow', 'First proper flight.'],
  [1500, 'Magpie', 'A sharp eye for the shiny details.'],
  [3000, 'Hawk', 'Very little gets past you.'],
  [5000, 'Eagle', 'The air is thin up here.'],
  [8000, 'Top Bird', 'Top of the pecking order.'],
] as const

export interface Rank {
  level: number
  name: string
  /** One short line said when the rank is reached. */
  line: string
  /** 0..1 of the way to the next rank; 1 at the top. */
  progress: number
  next?: { name: string; at: number }
}

export function rankFor(points: number): Rank {
  let level = 0
  while (level < RANKS.length - 1 && points >= RANKS[level + 1][0]) level++
  const [from, name, line] = RANKS[level]
  const upcoming = RANKS[level + 1]
  if (!upcoming) return { level, name, line, progress: 1 }
  return {
    level,
    name,
    line,
    progress: (points - from) / (upcoming[0] - from),
    next: { name: upcoming[1], at: upcoming[0] },
  }
}

/** Days of play until `at`, at the player's usual daily score. Undefined without a usual score yet. */
export function daysUntil(points: number, at: number, perDay: number): number | undefined {
  if (perDay <= 0) return undefined
  return Math.max(1, Math.ceil((at - points) / perDay))
}
