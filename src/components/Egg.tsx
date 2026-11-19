interface Props {
  /** 0..1 of the way to hatching: cracks appear at a quarter, half and three quarters. */
  progress: number
}

const CRACKS = ['M14 22l4 3 3-4 4 3', 'M17 30l3-2 3 3 3-3', 'M20 13l2 3-2 3 3 2']

/** The rank before Hatchling. It cracks as points come in, and wobbles harder near the end. */
export function Egg({ progress }: Props) {
  const cracks = Math.min(CRACKS.length, Math.floor(progress * 4))
  return (
    <svg className={progress >= 0.75 ? 'egg egg-ready' : 'egg'} width={34} height={40} viewBox="0 0 40 46" aria-hidden="true">
      <path className="egg-shell" d="M20 2C10 2 3 18 3 28c0 9.5 7.5 16 17 16s17-6.5 17-16C37 18 30 2 20 2z" />
      <ellipse className="egg-shine" cx="13" cy="16" rx="3" ry="5" transform="rotate(20 13 16)" />
      {CRACKS.slice(0, cracks).map((d) => (
        <path key={d} className="egg-crack" d={d} />
      ))}
    </svg>
  )
}
