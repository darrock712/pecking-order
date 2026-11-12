import { describe, expect, it } from 'vitest'
import { formatCountdown, formatValue, scaleValues } from './format'

describe('formatValue', () => {
  it('adds the unit, keeps years bare and honours custom wording', () => {
    expect(formatValue(['Hippo', 1500], 'kg')).toBe('1,500 kg')
    expect(formatValue(['Snail', 0.05], 'km/h')).toBe('0.05 km/h')
    expect(formatValue(['Taj Mahal', 1653], 'year')).toBe('1653')
    expect(formatValue(['Pyramid', -2560, 'c. 2560 BC'], 'year')).toBe('c. 2560 BC')
  })
})

describe('formatCountdown', () => {
  it('pads to hh:mm:ss and never goes negative', () => {
    expect(formatCountdown(3_723_000)).toBe('01:02:03')
    expect(formatCountdown(-5)).toBe('00:00:00')
  })
})

describe('scaleValues', () => {
  it('draws amounts in true proportion from zero', () => {
    const { fractions, log } = scaleValues([10, 20, 40], false)
    expect(log).toBe(false)
    expect(fractions).toEqual([0.25, 0.5, 1])
  })

  it('switches to a log scale when the range is too wide to see', () => {
    const { fractions, log } = scaleValues([1, 1000, 1_000_000], false)
    expect(log).toBe(true)
    expect(fractions[2]).toBe(1)
    expect(fractions[1]).toBeCloseTo(0.525)
    expect(fractions[0]).toBeGreaterThan(0)
  })

  it('spreads years and temperatures between lowest and highest', () => {
    const { fractions, log } = scaleValues([-2560, 80, 1889], true)
    expect(log).toBe(false)
    expect(fractions[0]).toBeCloseTo(0.05)
    expect(fractions[2]).toBe(1)
  })

  it('gives a true zero no bar', () => {
    expect(scaleValues([0, 22, 27, 206, 400], false).fractions[0]).toBe(0)
  })
})
