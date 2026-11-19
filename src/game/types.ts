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
  /** Mixed-bag rounds only: one unit per item, used instead of `unit`. */
  units?: readonly string[]
  difficulty: Difficulty
  /** Listed in the correct order. */
  items: readonly Item[]
  /** Spoiler-free hook used in the share text. */
  teaser: string
}

/** 'hit' = right spot, 'near' = one position off, 'miss' = further away. */
export type Mark = 'hit' | 'near' | 'miss'

/** After a wrong first peck: one tile checked in the slot it sat in. It was right when item === slot. */
export interface Check {
  item: number
  slot: number
}

/** Older saves only: the 💡 hint that rounds used to allow. Kept so past shares still show it. */
export interface Hint {
  kind: 'check' | 'value'
  /** The tile asked about (its index in the correctly ordered items). */
  item: number
  /** The slot (0-based) it sat in when the hint was used. */
  slot: number
}

export interface RoundResult {
  /** The player's order, as indexes into the set's (correctly ordered) items. */
  order: number[]
  marks: Mark[]
  score: number
  /** The first-peck order, kept only when the player changed it on the second peck. */
  first?: number[]
  /** Older saves only: the round used a 💡 hint. */
  hint?: Hint
}

export interface DayRecord {
  rounds: RoundResult[]
  hard: boolean
  /** True when played on its own calendar day (counts for streak and stats). */
  live: boolean
  /** First-peck order of the round in play, so a reload can't buy a fresh first try. */
  pending?: number[]
  /** Checks used on the round in play, kept so a reload can't buy fresh ones. */
  pendingChecks?: Check[]
}

export interface Save {
  days: Record<number, DayRecord>
  hard: boolean
  muted: boolean
}
