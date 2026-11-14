import { rankFor } from '../game/ranks'
import { Bird } from './Bird'

interface Props {
  /** Lifetime points, today's included. */
  points: number
  /** Points earned today, shown on the result screen. */
  gained?: number
  /** Announce a rank reached with today's points. */
  celebrate?: boolean
}

/** The long game: every point, from good days and bad, moves the bird up a rank. */
export function RankCard({ points, gained, celebrate }: Props) {
  const rank = rankFor(points)
  const promoted = !!celebrate && !!gained && rankFor(points - gained).level < rank.level
  return (
    <div className={promoted ? 'rank promoted' : 'rank'}>
      <span className="rank-bird" aria-hidden="true">
        <Bird size={22 + rank.level * 2} crown={!rank.next} />
      </span>
      <div className="rank-body">
        <p className="rank-name">
          <b>{promoted ? `New rank: ${rank.name}!` : rank.name}</b>
          <span>
            {points} pts{gained ? ` · +${gained} today` : ''}
          </span>
        </p>
        <div
          className="rank-bar"
          role="img"
          aria-label={rank.next ? `${Math.round(rank.progress * 100)}% of the way to ${rank.next.name}` : 'Top rank reached'}
        >
          <i style={{ width: `${Math.max(rank.progress * 100, 3)}%` }} />
        </div>
        <p className="rank-next">
          {rank.next ? `${rank.next.at - points} pts to ${rank.next.name}` : 'Nobody outranks you.'}
        </p>
      </div>
    </div>
  )
}
