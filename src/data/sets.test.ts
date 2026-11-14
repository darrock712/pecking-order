import { describe, expect, it } from 'vitest'
import { MIXED_FROM, exampleFor, setsForDay } from '../game/daily'
import { MIXED } from './mixed'
import { SETS, dealDay } from './sets'

/** Values this close are too easy to get "wrong" for reasons of measurement, not knowledge. */
const MIN_RATIO = 1.08
const MIN_GAP: Record<string, number> = { year: 3, temp: 5 }

const label = (i: number) => `set ${i + 1} (${SETS[i].items[0][0]} …)`

describe('puzzle content', () => {
  it('has the same number of easy, medium and twist sets', () => {
    const count = (d: string) => SETS.filter((s) => s.difficulty === d).length
    expect(count('medium')).toBe(count('easy'))
    expect(count('twist')).toBe(count('easy'))
    expect(count('easy')).toBeGreaterThanOrEqual(30)
  })

  it.each(SETS.map((set, i) => [label(i), set] as const))('%s is well formed', (_, set) => {
    expect(set.items).toHaveLength(5)
    expect(new Set(set.items.map(([name]) => name)).size).toBe(5)
    expect(set.teaser.trim()).not.toBe('')
    expect(set.teaser.length).toBeLessThanOrEqual(70)

    for (let i = 1; i < set.items.length; i++) {
      const [previous, current] = [set.items[i - 1][1], set.items[i][1]]
      expect(current, 'items must be listed in rising order').toBeGreaterThan(previous)
      const gap = MIN_GAP[set.key]
      if (gap !== undefined) {
        expect(current - previous, 'values too close').toBeGreaterThanOrEqual(gap)
      } else if (previous > 0) {
        expect(current / previous, 'values too close').toBeGreaterThanOrEqual(MIN_RATIO)
      }
    }
  })

  it('has no duplicate sets', () => {
    const signatures = SETS.map((s) => s.items.map(([name]) => name).join('|'))
    expect(new Set(signatures).size).toBe(SETS.length)
  })

  it('gives every set a hard-mode example with the same rule', () => {
    for (const set of SETS) expect(exampleFor(set, SETS), set.items[0][0]).toBeDefined()
  })
})

describe('deck order', () => {
  it('keeps day 1 as it launched and brings in fun stats on day 2', () => {
    expect(setsForDay(1, SETS).map((s) => s.items[0][0])).toEqual(['House cat', 'Neptune', 'Oxford University starts teaching'])
    expect(setsForDay(2, SETS).map((s) => s.key)).toEqual(['serving', 'pieces', 'subs'])
  })
})

describe('mixed-bag rounds', () => {
  it('has twelve sets', () => {
    expect(MIXED).toHaveLength(12)
  })

  it.each(MIXED.map((set) => [set.items[0][0], set] as const))('%s … is well formed', (_, set) => {
    expect(set.items).toHaveLength(5)
    expect(set.units).toHaveLength(5)
    expect(new Set(set.units).size, 'every item needs its own unit').toBe(5)
    expect(new Set(set.items.map(([name]) => name)).size).toBe(5)
    expect(set.teaser.length).toBeLessThanOrEqual(70)
    for (let i = 1; i < set.items.length; i++) {
      expect(set.items[i][1] / set.items[i - 1][1], 'neighbours need a 20% gap').toBeGreaterThanOrEqual(1.2)
    }
    // A worded value has to carry its own unit, because it replaces the plain one.
    set.items.forEach(([, , display], i) => {
      if (display !== undefined) expect(display).toContain(set.units?.[i])
    })
  })

  it('deals at most one a day, never before day 5, and uses every set', () => {
    const dealt = new Set<string>()
    for (let day = 1; day <= 60; day++) {
      const mixed = dealDay(day).filter((set) => set.units)
      expect(mixed.length).toBeLessThanOrEqual(1)
      if (day < MIXED_FROM) expect(mixed).toHaveLength(0)
      mixed.forEach((set) => dealt.add(set.items[0][0]))
    }
    expect(dealt.size).toBe(MIXED.length)
  })

  it('leaves the days already played untouched', () => {
    for (let day = 1; day < MIXED_FROM; day++) expect(dealDay(day)).toEqual(setsForDay(day, SETS))
  })

  it('never repeats a category within a day', () => {
    for (let day = MIXED_FROM; day <= 400; day++) {
      const keys = dealDay(day).map((set) => set.key)
      expect(new Set(keys).size, `day ${day}: ${keys.join(', ')}`).toBe(3)
    }
  })

  it('shows every medium set once before any repeats', () => {
    const mediums = SETS.filter((set) => set.difficulty === 'medium')
    const seen: string[] = []
    for (let day = 1; seen.length < mediums.length; day++) {
      const middle = dealDay(day)[1]
      if (!middle.units) seen.push(middle.items[0][0])
    }
    expect(new Set(seen).size).toBe(mediums.length)
  })
})
