import { describe, expect, it } from 'vitest'
import { scoreRound } from './scoring'
import { parseSave } from './storage'

const round = scoreRound([0, 1, 2, 4, 3])
const pecked = scoreRound([0, 1, 2, 3, 4], [1, 0, 2, 3, 4])
const hinted = { ...scoreRound([0, 1, 2, 4, 3]), hint: { kind: 'value', item: 3, slot: 4 } as const }

describe('parseSave', () => {
  it('returns an empty save for anything that is not an object', () => {
    for (const junk of [null, undefined, 7, 'x', []]) {
      expect(parseSave(junk)).toEqual({ days: {}, hard: false, muted: false })
    }
  })

  it('round-trips a real save through JSON', () => {
    const save = {
      days: { 3: { rounds: [round, pecked], hard: true, live: true, pending: [4, 3, 2, 1, 0], pendingChecks: [{ item: 1, slot: 0 }, { item: 3, slot: 2 }] }, 4: { rounds: [hinted], hard: false, live: true } },
      hard: true,
      muted: true,
    }
    expect(parseSave(JSON.parse(JSON.stringify(save)))).toEqual(save)
  })

  it('keeps the rounds before a damaged one and drops the rest', () => {
    const days = { 2: { rounds: [round, { order: [0, 0, 0, 0, 0], marks: [], score: 'lots' }, round], hard: false, live: true } }
    expect(parseSave({ days }).days[2].rounds).toEqual([round])
  })

  it('drops days that are not records and keys that are not day numbers', () => {
    const days = { 1: 'nope', soon: { rounds: [] }, 4: { rounds: [round], hard: false, live: false } }
    expect(Object.keys(parseSave({ days }).days)).toEqual(['4'])
  })

  it('drops a malformed hint but keeps the round', () => {
    const bad = { ...round, hint: { kind: 'peek', item: 9, slot: -1 } }
    expect(parseSave({ days: { 1: { rounds: [bad] } } }).days[1].rounds).toEqual([round])
  })

  it('keeps at most two well-formed checks', () => {
    const pendingChecks = [{ item: 7, slot: 0 }, { item: 1, slot: 1 }, 'x', { item: 2, slot: 0 }, { item: 3, slot: 3 }]
    // Only the first two entries count, so a hand-edited save can't buy extra checks.
    expect(parseSave({ days: { 1: { rounds: [], pendingChecks } } }).days[1].pendingChecks).toEqual([{ item: 1, slot: 1 }])
  })

  it('never keeps more than three rounds or a first peck on a finished day', () => {
    const day = parseSave({ days: { 1: { rounds: [round, round, round, round], pending: [0, 1, 2, 3, 4] } } }).days[1]
    expect(day.rounds).toHaveLength(3)
    expect(day.pending).toBeUndefined()
  })
})
