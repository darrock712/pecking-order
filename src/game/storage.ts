import type { Check, DayRecord, Hint, Mark, RoundResult, Save } from './types'
import { CHECKS } from './scoring'

/** Kept from before the rename to Peckish, so existing streaks carry on. */
const KEY = 'pecking-order:v1'
const EMPTY: Save = { days: {}, hard: false, muted: false }
const MARKS: readonly unknown[] = ['hit', 'near', 'miss'] satisfies Mark[]
const ROUNDS_PER_DAY = 3
const TILES = 5

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

/** Five slots holding each of the tiles 0–4 exactly once. */
const isOrder = (value: unknown): value is number[] =>
  Array.isArray(value) && value.length === TILES && value.every((_, tile) => value.includes(tile))

const isTile = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0 && (value as number) < TILES

function parseHint(value: unknown): Hint | undefined {
  if (!isObject(value) || (value.kind !== 'check' && value.kind !== 'value')) return undefined
  return isTile(value.item) && isTile(value.slot) ? { kind: value.kind, item: value.item, slot: value.slot } : undefined
}

function parseChecks(value: unknown): Check[] | undefined {
  if (!Array.isArray(value)) return undefined
  const checks = value
    .slice(0, CHECKS)
    .filter((c): c is Record<string, unknown> => isObject(c) && isTile(c.item) && isTile(c.slot))
    .map((c) => ({ item: c.item as number, slot: c.slot as number }))
  return checks.length ? checks : undefined
}

function parseRound(value: unknown): RoundResult | undefined {
  if (!isObject(value) || !isOrder(value.order)) return undefined
  const { order, marks, score, first } = value
  const hint = parseHint(value.hint)
  if (!Array.isArray(marks) || marks.length !== TILES || !marks.every((m) => MARKS.includes(m))) return undefined
  if (typeof score !== 'number' || !Number.isFinite(score)) return undefined
  const round: RoundResult = { order, marks: marks as Mark[], score }
  if (isOrder(first)) round.first = first
  if (hint) round.hint = hint
  return round
}

function parseDay(value: unknown): DayRecord | undefined {
  if (!isObject(value) || !Array.isArray(value.rounds)) return undefined
  // Keep the rounds up to the first damaged one, so the day can be picked up from there.
  const rounds: RoundResult[] = []
  for (const entry of value.rounds.slice(0, ROUNDS_PER_DAY)) {
    const round = parseRound(entry)
    if (!round) break
    rounds.push(round)
  }
  const record: DayRecord = { rounds, hard: value.hard === true, live: value.live === true }
  if (rounds.length < ROUNDS_PER_DAY) {
    if (isOrder(value.pending)) record.pending = value.pending
    const checks = parseChecks(value.pendingChecks)
    if (checks) record.pendingChecks = checks
  }
  return record
}

/**
 * Rebuilds a save from whatever was in storage. Anything that isn't the right
 * shape is dropped rather than trusted: an old version, a half-written value
 * or a hand-edited one must never be able to crash the game.
 */
export function parseSave(value: unknown): Save {
  if (!isObject(value)) return { ...EMPTY }
  const days: Save['days'] = {}
  if (isObject(value.days)) {
    for (const [key, entry] of Object.entries(value.days)) {
      const day = Number(key)
      const record = Number.isInteger(day) ? parseDay(entry) : undefined
      if (record) days[day] = record
    }
  }
  return { days, hard: value.hard === true, muted: value.muted === true }
}

/** localStorage can throw (private mode, blocked storage); the game must still run. */
export function loadSave(): Save {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? parseSave(JSON.parse(raw)) : { ...EMPTY }
  } catch {
    return { ...EMPTY }
  }
}

export function storeSave(save: Save): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(save))
  } catch {
    // Progress just won't persist this session.
  }
}
