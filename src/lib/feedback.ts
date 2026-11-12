import type { Mark } from '../game/types'

/** Tiny synthesised sounds and haptics, so there are no audio files to load. */
let context: AudioContext | undefined

function tone(frequency: number, start: number, duration: number, volume = 0.12) {
  try {
    context ??= new AudioContext()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const at = context.currentTime + start
    oscillator.type = 'triangle'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(volume, at)
    gain.gain.exponentialRampToValueAtTime(0.001, at + duration)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(at)
    oscillator.stop(at + duration)
  } catch {
    // Audio is a nicety; never let it break the game.
  }
}

const vibrate = (pattern: number | number[]) => {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // Not supported.
  }
}

const MARK_TONE: Record<Mark, number> = { hit: 660, near: 440, miss: 196 }

export function playMark(mark: Mark, muted: boolean) {
  if (!muted) tone(MARK_TONE[mark], 0, mark === 'miss' ? 0.25 : 0.18)
  vibrate(mark === 'hit' ? 15 : mark === 'near' ? [10, 40, 10] : 40)
}

export function playFanfare(muted: boolean, big = false) {
  if (!muted) {
    const notes = big ? [523, 659, 784, 1047, 1319] : [523, 659, 784, 1047]
    notes.forEach((f, i) => tone(f, i * 0.09, 0.3, 0.14))
  }
  vibrate(big ? [20, 40, 20, 40, 60] : [20, 40, 40])
}

export function playTick(muted: boolean) {
  if (!muted) tone(330, 0, 0.05, 0.05)
}

export const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
