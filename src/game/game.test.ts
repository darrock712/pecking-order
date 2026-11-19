import { describe, expect, it } from 'vitest'
import { dateForDay, dayNumber, exampleFor, msUntilNextDay, setsForDay, shuffledOrder } from './daily'
import { DAY_MAX, ROUND_MAX, isPerfectRound, markOrder, scoreDay, scoreRound, shareText, swapsAway, verdict } from './scoring'
import { daysUntil, rankFor } from './ranks'
import { computeStats } from './stats'
import type { DayRecord, Difficulty, PuzzleSet } from './types'

const fake = (name: string, difficulty: Difficulty, key = 'weight'): PuzzleSet => ({
  key,
  rule: 'Lightest → heaviest',
  unit: 'kg',
  difficulty,
  items: [['a', 1], ['b', 2], ['c', 3], ['d', 4], ['e', 5]],
  teaser: name,
})

const POOL = [
  fake('e1', 'easy'), fake('e2', 'easy'),
  fake('m1', 'medium'), fake('m2', 'medium'),
  fake('t1', 'twist'), fake('t2', 'twist', 'speed'),
]

const SOLVED = [0, 1, 2, 3, 4]
const day = (rounds: number[][], live = true, hard = false): DayRecord => ({
  rounds: rounds.map((r) => scoreRound(r)),
  live,
  hard,
})

describe('dayNumber', () => {
  it('is 1 on the epoch date, at any time of day', () => {
    expect(dayNumber(new Date(2026, 10, 11, 0, 0, 0))).toBe(1)
    expect(dayNumber(new Date(2026, 10, 11, 23, 59, 59))).toBe(1)
  })

  it('rolls over exactly at local midnight', () => {
    expect(dayNumber(new Date(2026, 10, 12, 0, 0, 0))).toBe(2)
  })

  it('advances one per calendar day across DST changes and year ends', () => {
    let previous = dayNumber(new Date(2026, 10, 11, 12))
    for (let i = 1; i <= 400; i++) {
      const current = dayNumber(new Date(2026, 10, 11 + i, 1, 30))
      expect(current).toBe(previous + 1)
      previous = current
    }
  })

  it('round-trips with dateForDay', () => {
    for (const d of [1, 2, 120, 366]) expect(dayNumber(dateForDay(d))).toBe(d)
  })

  it('counts down to the next local midnight', () => {
    expect(msUntilNextDay(new Date(2026, 10, 11, 23, 0, 0))).toBe(3_600_000)
  })
})

describe('setsForDay', () => {
  it('gives an easy, a medium and a twist round, the same for everyone', () => {
    const sets = setsForDay(1, POOL)
    expect(sets.map((s) => s.difficulty)).toEqual(['easy', 'medium', 'twist'])
    expect(setsForDay(1, POOL)).toEqual(sets)
  })

  it('changes day to day and loops when content runs out', () => {
    expect(setsForDay(2, POOL)[0].teaser).toBe('e2')
    expect(setsForDay(3, POOL)).toEqual(setsForDay(1, POOL))
  })
})

describe('shuffledOrder', () => {
  it('is deterministic, a permutation, and never a giveaway', () => {
    for (let seed = 0; seed < 500; seed++) {
      const order = shuffledOrder(5, seed)
      expect(order).toEqual(shuffledOrder(5, seed))
      expect([...order].sort()).toEqual(SOLVED)
      expect(order.filter((v, i) => v === i).length).toBeLessThanOrEqual(1)
      expect(order).not.toEqual([4, 3, 2, 1, 0])
    }
  })
})

describe('exampleFor', () => {
  it('picks a different set with the same rule', () => {
    const puzzle = { ...POOL[0], items: [['p', 1], ['q', 2], ['r', 3], ['s', 4], ['t', 5]] } as PuzzleSet
    const example = exampleFor(puzzle, [puzzle, ...POOL])
    expect(example).toBeDefined()
    expect(example).not.toBe(puzzle)
    expect(example!.key).toBe('weight')
  })

  it('never shares an item with the puzzle', () => {
    const twin = { ...POOL[0], items: [['a', 9], ['x', 10], ['y', 11], ['z', 12], ['w', 13]] } as PuzzleSet
    expect(exampleFor(twin, [twin, POOL[0]])).toBeUndefined()
  })

  it('skips excluded sets and returns undefined when nothing matches', () => {
    expect(exampleFor(POOL[5], POOL)).toBeUndefined()
    const others = POOL.filter((s) => s !== POOL[0] && s.key === 'weight')
    expect(exampleFor(POOL[0], POOL, others)).toBeUndefined()
  })
})

describe('scoring', () => {
  it('marks right spot, one off, and further away', () => {
    expect(markOrder([0, 2, 1, 3, 4])).toEqual(['hit', 'near', 'near', 'hit', 'hit'])
    expect(markOrder([4, 1, 2, 3, 0])).toEqual(['miss', 'hit', 'hit', 'hit', 'miss'])
  })

  it('awards the round maximum only for a perfect order', () => {
    expect(scoreRound(SOLVED).score).toBe(ROUND_MAX)
    expect(scoreRound([1, 0, 2, 3, 4]).score).toBe(24)
    expect(scoreRound([4, 3, 2, 1, 0]).score).toBe(6)
  })

  it('totals exactly 100 for a perfect day', () => {
    expect(scoreDay([SOLVED, SOLVED, SOLVED].map((r) => scoreRound(r)))).toBe(DAY_MAX)
    expect(scoreDay([SOLVED, SOLVED].map((r) => scoreRound(r)))).toBe(66)
  })

  it('counts the fewest swaps needed', () => {
    expect(swapsAway(SOLVED)).toBe(0)
    expect(swapsAway([1, 0, 2, 3, 4])).toBe(1)
    expect(swapsAway([1, 2, 0, 3, 4])).toBe(2)
    expect(swapsAway([4, 3, 2, 1, 0])).toBe(2)
  })

  it('names near misses', () => {
    expect(verdict(SOLVED)).toBe('Perfect!')
    expect(verdict([0, 1, 2, 4, 3])).toMatch(/one swap away/)
    expect(verdict([1, 2, 0, 3, 4])).toBe('2 of 5 in the right spot')
    expect(verdict([1, 2, 3, 4, 0])).toMatch(/Scrambled/)
  })
})

describe('second peck', () => {
  const first = [1, 0, 2, 4, 3]

  it('scores a kept answer exactly like a single try', () => {
    expect(scoreRound(first, first)).toEqual(scoreRound(first))
  })

  it('pays 4 for a fixed tile, 6 for one that was already right, and no perfect bonus', () => {
    const fixed = scoreRound(SOLVED, first)
    expect(fixed.score).toBe(6 + 4 * 4)
    expect(fixed.first).toEqual(first)
    expect(isPerfectRound(fixed)).toBe(false)
    expect(verdict(fixed.order, true)).toMatch(/second peck/)
  })

  it('never beats getting it right the first time', () => {
    expect(scoreRound(SOLVED, [4, 3, 2, 1, 0]).score).toBeLessThan(ROUND_MAX)
  })

  it('marks a pecked round in the share grid', () => {
    const record: DayRecord = { rounds: [scoreRound(SOLVED, first), scoreRound(SOLVED), scoreRound(SOLVED)], live: true, hard: false }
    expect(shareText(1, record, 't', 'u').split('\n')[1]).toBe('🟩🟩🟩🟩🟩 ↻')
    expect(scoreDay(record.rounds)).toBe(22 + 33 + 33)
  })
})

describe('hint (older saves)', () => {
  const hinted = { ...scoreRound(SOLVED), score: ROUND_MAX - 3, hint: { kind: 'check', item: 2, slot: 2 } as const }

  it('is never a perfect round', () => {
    expect(isPerfectRound(hinted)).toBe(false)
  })

  it('marks a hinted round with a bulb in the share grid', () => {
    const record: DayRecord = { rounds: [scoreRound(SOLVED), { ...scoreRound(SOLVED, [1, 0, 2, 3, 4]), hint: hinted.hint }, scoreRound(SOLVED)], live: true, hard: false }
    expect(shareText(1, record, 't', 'u').split('\n').slice(1, 4)).toEqual(['🟩🟩🟩🟩🟩', '🟩🟩🟩🟩🟩 ↻ 💡', '🟩🟩🟩🟩🟩'])
  })
})

describe('daysUntil', () => {
  it('estimates whole days at the usual score, and nothing without one', () => {
    expect(daysUntil(40, 100, 30)).toBe(2)
    expect(daysUntil(99, 100, 65)).toBe(1)
    expect(daysUntil(0, 100, 0)).toBeUndefined()
  })
})

describe('rankFor', () => {
  it('starts as an egg and climbs with points', () => {
    expect(rankFor(0)).toMatchObject({ level: 0, progress: 0 })
    expect(rankFor(100).level).toBe(1)
    expect(rankFor(200)).toMatchObject({ level: 1, progress: 0.5 })
  })

  it('tops out with no next rank', () => {
    const top = rankFor(1e6)
    expect(top.next).toBeUndefined()
    expect(top.progress).toBe(1)
  })
})

describe('shareText', () => {
  it('shows the score and one emoji row per round without item names', () => {
    const text = shareText(7, day([SOLVED, [1, 0, 2, 3, 4], [4, 1, 2, 3, 0]]), 'A teaser', 'https://x.test')
    expect(text.split('\n')).toEqual([
      'Peckish #7 — 75/100',
      '🟩🟩🟩🟩🟩',
      '🟨🟨🟩🟩🟩',
      '🟥🟩🟩🟩🟥',
      'A teaser',
      'https://x.test',
    ])
  })

  it('flags hard mode', () => {
    expect(shareText(1, day([SOLVED, SOLVED, SOLVED], true, true), 't', 'u')).toMatch(/100\/100 🔥 hard/)
  })
})

describe('computeStats', () => {
  const bad = [[4, 3, 2, 1, 0], [4, 3, 2, 1, 0], [4, 3, 2, 1, 0]]
  const perfect = [SOLVED, SOLVED, SOLVED]

  it('is all zeros for a new player', () => {
    expect(computeStats({}, 5)).toEqual({
      played: 0, points: 0, average: 0, perfectRounds: 0, perfectDays: 0, streak: 0, bestStreak: 0,
    })
  })

  it('keeps the streak through low scores', () => {
    const stats = computeStats({ 1: day(bad), 2: day(bad), 3: day(perfect) }, 3)
    expect(stats.streak).toBe(3)
    expect(stats.perfectDays).toBe(1)
    expect(stats.perfectRounds).toBe(3)
    expect(stats.average).toBe(Math.round((18 + 18 + 100) / 3))
  })

  it('keeps yesterday’s streak alive until today is over', () => {
    expect(computeStats({ 1: day(bad), 2: day(bad) }, 3).streak).toBe(2)
  })

  it('resets the current streak after a missed day but keeps the best and totals', () => {
    const stats = computeStats({ 1: day(bad), 2: day(bad), 3: day(bad), 5: day(bad) }, 5)
    expect(stats.streak).toBe(1)
    expect(stats.bestStreak).toBe(3)
    expect(stats.played).toBe(4)
    expect(computeStats({ 1: day(bad) }, 4).streak).toBe(0)
  })

  it('ignores archive plays and unfinished days', () => {
    const stats = computeStats({ 1: day(perfect, false), 2: day([SOLVED]), 3: day(bad) }, 3)
    expect(stats.played).toBe(1)
    expect(stats.streak).toBe(1)
    expect(stats.perfectRounds).toBe(0)
  })
})
