import { describe, expect, it } from 'vitest'
import { exampleFor } from '../game/daily'
import { SETS } from './sets'

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
    expect(set.surprise.trim()).not.toBe('')
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
