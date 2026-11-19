import { daysUntil, rankFor, type Rank } from '../game/ranks'
import { Bird } from './Bird'
import { Egg } from './Egg'

interface Props {
  /** Lifetime points, today's included. */
  points: number
  /** Points earned today, shown on the result screen. */
  gained?: number
  /** Announce a rank reached with today's points. */
  celebrate?: boolean
  /** The player's usual daily score, for a "about N days" estimate. */
  perDay?: number
}

/** The egg cracks as it fills, then every rank after it is a bigger bird. */
const Icon = ({ rank }: { rank: Rank }) =>
  rank.level === 0 ? <Egg progress={rank.progress} /> : <Bird size={22 + rank.level * 2} crown={!rank.next} />

/** The long game: every point, from good days and bad, moves the bird up a rank. */
export function RankCard({ points, gained, celebrate, perDay = 0 }: Props) {
  const rank = rankFor(points)
  const before = rankFor(points - (gained ?? 0))
  const promoted = !!celebrate && !!gained && before.level < rank.level
  const days = rank.next && daysUntil(points, rank.next.at, perDay)
  const left = rank.next ? rank.next.at - points : 0
  const soon = days ? ` · about ${days} day${days === 1 ? '' : 's'}` : ''
  return (
    <div className={promoted ? 'rank promoted' : 'rank'} aria-live={promoted ? 'polite' : undefined}>
      <span className={promoted ? 'rank-bird unlock' : 'rank-bird'} aria-hidden="true">
        {promoted ? (
          <>
            <span className="unlock-old"><Icon rank={{ ...before, progress: 1 }} /></span>
            <span className="unlock-new"><Icon rank={rank} /></span>
          </>
        ) : (
          <Icon rank={rank} />
        )}
      </span>
      <div className="rank-body">
        <p className="rank-name">
          <b>{promoted ? `${rank.level === 1 ? 'Hatched' : 'New rank'}: ${rank.name}!` : rank.name}</b>
          <span>
            {points} pts{gained ? ` · +${gained} today` : ''}
          </span>
        </p>
        {promoted && <p className="rank-line">{rank.line}</p>}
        <div
          className="rank-bar"
          role="img"
          aria-label={rank.next ? `${Math.round(rank.progress * 100)}% of the way to ${rank.next.name}` : 'Top rank reached'}
        >
          <i style={{ width: `${Math.max(rank.progress * 100, 3)}%` }} />
        </div>
        <p className="rank-next">
          {!rank.next
            ? 'Nobody outranks you.'
            : rank.level === 0
              ? `${left} pts until it hatches${soon}`
              : `${left} pts to ${rank.next.name}${soon}`}
        </p>
      </div>
    </div>
  )
}
