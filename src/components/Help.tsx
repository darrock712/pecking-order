import { useEffect, useRef } from 'react'

/**
 * "How to play", as a native modal dialog: the browser traps focus and closes it
 * on Escape; focus goes back to the button that opened it.
 */
export function Help({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  // Taken on first render, before the dialog grabs focus.
  const opener = useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
    // The dialog unmounts on Escape before the browser can restore focus, so do it here.
    const back = opener.current
    return () => back?.focus({ preventScroll: true })
  }, [])

  // Closing the element restores focus; calling onClose directly means the
  // dialog unmounts even if the browser is slow to send its own close event.
  const close = () => {
    ref.current?.close()
    onClose()
  }

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="help-title"
      onClose={onClose}
      onCancel={onClose}
      // The body fills the dialog, so a click that lands on the dialog itself is on the backdrop.
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="dialog-body">
        <h2 id="help-title">How to play</h2>
        <ul>
          <li>Three rounds a day. Put five things in order, then lock it in.</li>
          <li>The slots are numbered. The labels above and below the tiles say what goes in slot 1 and slot 5.</li>
          <li>Two tries per round. Wrong the first time? 🔍 Check two tiles to see if they’re in the right spot, then have one more go.</li>
          <li>The reveal: 🟩 right spot · 🟨 one place off · 🟥 two or more off.</li>
          <li>Right first time scores 6 a tile. A tile you fix on the second try scores 4.</li>
          <li><strong>Mixed bag</strong> rounds count a different thing on every tile. Just compare the numbers.</li>
          <li>Every point counts towards your rank, from Egg to Top Bird.</li>
          <li>Your streak counts days played. A low score never breaks it.</li>
          <li><strong>Hard mode</strong> hides the rule. You only get a solved example to work out what the order means.</li>
        </ul>
        <button type="button" className="primary" autoFocus onClick={close}>Got it</button>
      </div>
    </dialog>
  )
}
