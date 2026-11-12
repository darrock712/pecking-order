import type { Save } from './types'

const KEY = 'pecking-order:v1'
const EMPTY: Save = { days: {}, hard: false, muted: false }

/** localStorage can throw (private mode, blocked storage); the game must still run. */
export function loadSave(): Save {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...EMPTY }
    const parsed = JSON.parse(raw) as Partial<Save>
    return { ...EMPTY, ...parsed, days: parsed.days ?? {} }
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
