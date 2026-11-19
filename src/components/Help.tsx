import { useEffect, useRef } from 'react'

/**
 * "How to play", as a native modal dialog: the browser traps focus, closes it
 * on Escape and hands focus back to the button that opened it.
 */
export function Help({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
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
          <li>🟩 right spot · 🟨 one place off · 🟥 two or more off.</li>
          <li>Two pecks per round. Lock in, read the colours, then fix it once — or keep it.</li>
          <li>Right first time scores 6 a tile. A tile you fix on the second peck scores 4.</li>
          <li><strong>Mixed bag</strong> rounds count every tile in a different unit. Rank the bare numbers.</li>
          <li>💡 One <strong>hint</strong> per round: pick a slot and ask “Is it right?” or see its value. A hinted round keeps its points but can’t be perfect, and your share shows the 💡.</li>
          <li>Every point counts towards your rank, from Egg to Top Bird.</li>
          <li>Your streak counts days played. A low score never breaks it.</li>
          <li><strong>Hard mode</strong> hides the rule. You only get a solved example to work out what the order means.</li>
        </ul>
        <button type="button" className="primary" autoFocus onClick={close}>Got it</button>
      </div>
    </dialog>
  )
}
