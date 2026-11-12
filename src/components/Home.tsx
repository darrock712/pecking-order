import { categoryFor } from '../data/icons'
import { dateForDay } from '../game/daily'
import { DAY_MAX, scoreDay } from '../game/scoring'
import type { Stats } from '../game/stats'
import type { DayRecord, PuzzleSet } from '../game/types'
import { Bird } from './Bird'

interface HomeProps {
  day: number
  sets: readonly PuzzleSet[]
  record: DayRecord | undefined
  hard: boolean
  stats: Stats
  onPlay: () => void
  onArchive: () => void
  onPractice: () => void
}

const FLOCK = [22, 28, 35, 43, 54]

export function Home({ day, sets, record, hard, stats, onPlay, onArchive, onPractice }: HomeProps) {
  const played = record?.rounds ?? []
  const finished = played.length === 3
  const date = dateForDay(day).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
  const action = finished ? 'See today’s result' : played.length > 0 ? `Continue · round ${played.length + 1}` : 'Play today’s'

  return (
    <section className="home" aria-label="Today’s puzzle">
      <div className="hero">
        <p className="hero-top">
          <span>No. {day}</span>
          <span>{date}</span>
        </p>

        <div className="flock" aria-hidden="true">
          {FLOCK.map((size, i) => (
            <span key={size} style={{ animationDelay: `${i * 0.18}s` }}>
              <Bird size={size} crown={i === FLOCK.length - 1} />
            </span>
          ))}
        </div>

        <h1>
          Who’s <em>really</em> on top?
        </h1>
        <p className="hero-sub">Five things. One right order. Three rounds a day.</p>

        <ol className="menu">
          {sets.map((set, i) => {
            const [icon, name] = hard && i >= played.length ? ['❓', 'Mystery'] : categoryFor(set.key)
            return (
              <li key={i} className={i < played.length ? 'done' : ''}>
                <span className="menu-icon" aria-hidden="true">{icon}</span>
                <span className="menu-name">{name}</span>
                <span className="menu-score">{i < played.length ? `${played[i].score} pts` : `Round ${i + 1}`}</span>
              </li>
            )
          })}
        </ol>

        <button type="button" className="play" onClick={onPlay}>
          {action} <span aria-hidden="true">→</span>
        </button>
        {finished && (
          <p className="hero-done">
            You scored {scoreDay(played)}/{DAY_MAX}. No. {day + 1} lands at midnight.
          </p>
        )}
      </div>

      {stats.played > 0 && (
        <dl className="stats">
          <div><dt>Day streak</dt><dd>{stats.streak}</dd></div>
          <div><dt>Days played</dt><dd>{stats.played}</dd></div>
          <div><dt>Average</dt><dd>{Math.round(stats.average)}</dd></div>
        </dl>
      )}

      <div className="secondary-row">
        <button type="button" className="secondary" onClick={onPractice}>Practice round</button>
        <button type="button" className="secondary" onClick={onArchive}>Past days</button>
      </div>
    </section>
  )
}
