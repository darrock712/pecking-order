import type { Item } from '../game/types'

const decimals = (n: number) => (String(n).split('.')[1] ?? '').length

export function formatNumber(value: number, places = decimals(value)): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: places, maximumFractionDigits: places })
}

/** True when the value can be animated as a plain number (no custom wording, not a year). */
export const isCountable = ([, , display]: Item, unit: string) => display === undefined && unit !== 'year'

export function formatValue([, value, display]: Item, unit: string): string {
  if (display !== undefined) return display
  if (unit === 'year') return String(value)
  return `${formatNumber(value)} ${unit}`.trim()
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const part = (n: number) => String(n).padStart(2, '0')
  return `${part(Math.floor(total / 3600))}:${part(Math.floor((total % 3600) / 60))}:${part(total % 60)}`
}

export interface Scale {
  /** Bar length for each value, from 0 to 1. */
  fractions: number[]
  log: boolean
}

const MIN_BAR = 0.05

/**
 * Bar lengths for the reveal. Amounts (weights, speeds) are drawn from zero so
 * the bars are honest proportions; when the range is too wide to see that way
 * they switch to a log scale. Points on a line (years, temperatures) have no
 * meaningful zero, so those are spread between the lowest and highest value.
 */
export function scaleValues(values: readonly number[], interval: boolean): Scale {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const spread = (v: number, lo: number, hi: number) => MIN_BAR + (1 - MIN_BAR) * ((v - lo) / (hi - lo))

  if (interval || min < 0) return { fractions: values.map((v) => spread(v, min, max)), log: false }

  const smallest = Math.min(...values.filter((v) => v > 0))
  if (max / smallest > 100) {
    const lo = Math.log10(smallest)
    const hi = Math.log10(max)
    return { fractions: values.map((v) => (v > 0 ? spread(Math.log10(v), lo, hi) : 0)), log: true }
  }
  return { fractions: values.map((v) => Math.max(v / max, v > 0 ? MIN_BAR : 0)), log: false }
}
