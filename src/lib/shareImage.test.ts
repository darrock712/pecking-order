import { describe, expect, it } from 'vitest'
import type { DayRecord, PuzzleSet } from '../game/types'
import { drawShareCard } from './shareImage'

// Node has no canvas: a context that accepts any call and records the text drawn.
function recordingContext() {
  const texts: string[] = []
  const ctx = new Proxy({} as Record<string | symbol, unknown>, {
    get(target, prop) {
      if (prop === 'texts') return texts
      if (prop === 'fillText') return (t: string) => texts.push(t)
      if (prop === 'measureText') return (t: string) => ({ width: t.length * 10 })
      if (prop === 'createRadialGradient') return () => ({ addColorStop() {} })
      if (prop in target) return target[prop]
      return () => {}
    },
    set(target, prop, value) {
      target[prop] = value
      return true
    },
  })
  return { ctx: ctx as unknown as CanvasRenderingContext2D, texts }
}

const set = (key: string): PuzzleSet => ({
  key,
  rule: 'Lightest → heaviest',
  unit: 'kg',
  difficulty: 'easy',
  items: [['Secret apple', 1], ['Secret brick', 2], ['Secret cat', 3], ['Secret dog', 4], ['Secret elk', 5]],
  teaser: 'teaser',
})

describe('share card', () => {
  it('shows the day, score and categories but never the items', () => {
    globalThis.Path2D ??= class {} as unknown as typeof Path2D
    const record: DayRecord = {
      hard: false,
      live: true,
      rounds: [
        { order: [0, 1, 2, 3, 4], marks: ['hit', 'hit', 'hit', 'hit', 'hit'], score: 33 },
        { order: [1, 0, 2, 3, 4], marks: ['near', 'near', 'hit', 'hit', 'hit'], score: 24 },
        { order: [4, 1, 2, 3, 0], marks: ['miss', 'hit', 'hit', 'hit', 'miss'], score: 18, first: [4, 2, 1, 3, 0], hint: { kind: 'value', item: 0, slot: 4 } },
      ],
    }
    const { ctx, texts } = recordingContext()
    drawShareCard(ctx, 12, record, [set('weight'), set('speed'), set('year')], 'https://example.com/peckish/')
    expect(texts).toContain('No. 12')
    expect(texts).toContain('75')
    expect(texts).toContain('example.com/peckish')
    expect(texts.join(' ')).toMatch(/2nd try/)
    expect(texts.join(' ')).toMatch(/💡 hint/)
    expect(texts.join(' ')).not.toMatch(/Secret/)
  })
})
