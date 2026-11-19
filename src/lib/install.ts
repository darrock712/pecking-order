import { useEffect, useState } from 'react'

/** Chrome/Edge/Android only; Safari never fires it (iPhone players use Share → Add to Home Screen). */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Caught once at start-up: the browser fires it early, often before the summary is on screen.
let pending: InstallPromptEvent | undefined
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    pending = event as InstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    pending = undefined
    notify()
  })
}

/** `install` is set only while the browser is offering to install the game. */
export function useInstall(): { install?: () => void } {
  const [, rerender] = useState(0)
  useEffect(() => {
    const listener = () => rerender((n) => n + 1)
    listeners.add(listener)
    return () => void listeners.delete(listener)
  }, [])
  if (!pending) return {}
  const event = pending
  return {
    install: () => {
      pending = undefined
      notify()
      event.prompt().catch(() => {})
    },
  }
}
