export type Difficulty = 'easy' | 'medium' | 'twist'

/** [name, value, optional display override for the value] */
export type Item = readonly [name: string, value: number, display?: string]

export interface PuzzleSet {
  /** Groups sets that are ordered by the same thing, e.g. "weight". Hard mode
   *  uses another set with the same key + rule as its worked example. */
  key: string
  /** Shown to the player, e.g. "Lightest → heaviest". */
  rule: string
  unit: string
  difficulty: Difficulty
  /** Listed in the correct order. */
  items: readonly Item[]
  /** The "wait, really?" line shown after the reveal. */
  surprise: string
  /** Spoiler-free hook used in the share text. */
  teaser: string
}

/** 'hit' = right spot, 'near' = one position off, 'miss' = further away. */
export type Mark = 'hit' | 'near' | 'miss'

export interface RoundResult {
  /** The player's order, as indexes into the set's (correctly ordered) items. */
  order: number[]
  marks: Mark[]
  score: number
}

export interface DayRecord {
  rounds: RoundResult[]
  hard: boolean
  /** True when played on its own calendar day (counts for streak and stats). */
  live: boolean
}

export interface Save {
  days: Record<number, DayRecord>
  hard: boolean
  muted: boolean
}
