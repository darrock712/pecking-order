import { describe, expect, it } from 'vitest'
import { scoreRound } from './scoring'
import { parseSave } from './storage'

const round = scoreRound([0, 1, 2, 4, 3])
const pecked = scoreRound([0, 1, 2, 3, 4], [1, 0, 2, 3, 4])
const hinted = scoreRound([0, 1, 2, 4, 3], undefined, { kind: 'value', item: 3, slot: 4 })

describe('parseSave', () => {
  it('returns an empty save for anything that is not an object', () => {
    for (const junk of [null, undefined, 7, 'x', []]) {
      expect(parseSave(junk)).toEqual({ days: {}, hard: false, muted: false })
    }
  })

  it('round-trips a real save through JSON', () => {
    const save = {
      days: { 3: { rounds: [round, pecked], hard: true, live: true, pending: [4, 3, 2, 1, 0], pendingHint: { kind: 'check', item: 1, slot: 0 } }, 4: { rounds: [hinted], hard: false, live: true } },
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
    const day = parseSave({ days: { 1: { rounds: [bad], pendingHint: { kind: 'value', item: 7, slot: 0 } } } }).days[1]
    expect(day.rounds).toEqual([round])
    expect(day.pendingHint).toBeUndefined()
  })

  it('never keeps more than three rounds or a first peck on a finished day', () => {
    const day = parseSave({ days: { 1: { rounds: [round, round, round, round], pending: [0, 1, 2, 3, 4] } } }).days[1]
    expect(day.rounds).toHaveLength(3)
    expect(day.pending).toBeUndefined()
  })
})
