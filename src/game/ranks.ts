/** Lifetime points needed for each rank. At ~65 points a day the top takes about four months. */
export const RANKS = [
  [0, 'Egg'],
  [100, 'Hatchling'],
  [300, 'Fledgling'],
  [700, 'Sparrow'],
  [1500, 'Magpie'],
  [3000, 'Hawk'],
  [5000, 'Eagle'],
  [8000, 'Top Bird'],
] as const

export interface Rank {
  level: number
  name: string
  /** 0..1 of the way to the next rank; 1 at the top. */
  progress: number
  next?: { name: string; at: number }
}

export function rankFor(points: number): Rank {
  let level = 0
  while (level < RANKS.length - 1 && points >= RANKS[level + 1][0]) level++
  const [from, name] = RANKS[level]
  const upcoming = RANKS[level + 1]
  if (!upcoming) return { level, name, progress: 1 }
  return {
    level,
    name,
    progress: (points - from) / (upcoming[0] - from),
    next: { name: upcoming[1], at: upcoming[0] },
  }
}
