export type BirdTone = 'cream' | 'hit' | 'near' | 'miss'

interface BirdProps {
  size: number
  tone?: BirdTone
  /** The bird at the top of the pecking order wears the crown. */
  crown?: boolean
}

/** The game's mascot: a round little bird, drawn so its feet sit on the bottom edge. */
export function Bird({ size, tone = 'cream', crown = false }: BirdProps) {
  return (
    <svg className={`bird bird-${tone}`} width={size} height={size} viewBox="0 -8 46 46" aria-hidden="true">
      {crown && <path className="bird-crown" d="M24.5 4.5 23 -5l4.5 4 3.5-5.5 3.5 5.5 4.5-4-1.5 9.5z" />}
      <path d="M9 22 1 14.5h11z" />
      <ellipse cx="21" cy="22" rx="13" ry="11" />
      <circle cx="31" cy="13" r="8" />
      <ellipse className="bird-belly" cx="23" cy="25.5" rx="8" ry="5.5" />
      <path className="bird-beak" d="m38 10.5 7 3-7 3z" />
      <circle className="bird-eye" cx="33" cy="11.5" r="1.7" />
      <path className="bird-legs" d="M18 32v6M24.5 32v6" />
    </svg>
  )
}
