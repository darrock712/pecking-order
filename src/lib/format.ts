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
