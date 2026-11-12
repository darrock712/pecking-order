import { useEffect, useState } from 'react'
import { msUntilNextDay } from '../game/daily'
import { DAY_MAX, isPerfectRound, roundTone, scoreDay, shareText } from '../game/scoring'
import type { Stats } from '../game/stats'
import type { DayRecord, Mark, PuzzleSet } from '../game/types'
import { playFanfare } from '../lib/feedback'
import { formatCountdown } from '../lib/format'
import { Bird } from './Bird'
import { Confetti, CountUp } from './Effects'

interface Props {
  day: number
  record: DayRecord
  sets: PuzzleSet[]
  stats: Stats
  /** Celebrate only when the day was just finished, not on every revisit. */
  fresh: boolean
  muted: boolean
  onPractice: () => void
  onArchive: () => void
}

const EMOJI: Record<Mark, string> = { hit: '🟩', near: '🟨', miss: '🟥' }

function headline(total: number, perfectDay: boolean) {
  if (perfectDay) return 'Perfect day!'
  if (total >= 80) return 'Top of the pecking order'
  if (total >= 55) return 'Nicely ranked'
  return 'Three new facts in your pocket'
}

export function Summary({ day, record, sets, stats, fresh, muted, onPractice, onArchive }: Props) {
  const total = scoreDay(record.rounds)
  const perfectDay = record.rounds.every(isPerfectRound)
  // The best round wears the crown, shared on a tie, unless nothing scored.
  const best = Math.max(1, ...record.rounds.map((r) => r.score))
  const [copied, setCopied] = useState(false)
  const [remaining, setRemaining] = useState(() => msUntilNextDay(new Date()))

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(msUntilNextDay(new Date())), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (fresh && perfectDay) playFanfare(muted, true)
    // Runs once when the summary first appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const share = async () => {
    const url = location.origin + location.pathname
    const text = shareText(day, record, sets[2].teaser, url)
    try {
      // Phones get the native share sheet; desktops copy to the clipboard.
      if (navigator.share && matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ text })
        return
      }
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Share sheet dismissed or clipboard blocked; nothing to do.
    }
  }

  return (
    <section className="summary" aria-label="Today’s result">
      {fresh && perfectDay && <Confetti pieces={70} />}
      <div className="hero scoreboard">
        <p className="hero-top">
          <span>No. {day}</span>
          <span>{record.hard ? '🔥 Hard mode' : 'Final score'}</span>
        </p>

        <ol className="flock" aria-label="Points per round">
          {record.rounds.map((round, i) => (
            <li key={i} style={{ animationDelay: `${i * 0.18}s` }}>
              <Bird size={46} tone={roundTone(round.score)} crown={round.score === best} />
              <b>{round.score}</b>
            </li>
          ))}
        </ol>

        <h2 className="headline">{headline(total, perfectDay)}</h2>
        <p className="total">
          {fresh ? <CountUp value={total} places={0} ms={1100} /> : total}
          <span>/{DAY_MAX}</span>
        </p>

        <div className="meter" role="img" aria-label={`Today ${total} out of ${DAY_MAX}${stats.played > 1 ? `, your average ${stats.average}` : ''}`}>
          <div className="meter-fill" style={{ width: `${total}%` }} />
          {stats.played > 1 && (
            <div className="meter-avg" style={{ left: `${stats.average}%` }}>
              <span>your average</span>
            </div>
          )}
        </div>
      </div>

      <ul className="recap">
        {record.rounds.map((round, i) => (
          <li key={i}>
            <span className="grid-row" aria-label={`Round ${i + 1}: ${round.marks.filter((m) => m === 'hit').length} of 5 in place`}>
              {round.marks.map((m) => EMOJI[m]).join('')}
            </span>
            <span className="recap-fact">{sets[i].surprise}</span>
          </li>
        ))}
      </ul>

      <button type="button" className="primary" onClick={share}>
        {copied ? 'Copied!' : 'Share result'}
      </button>

      <dl className="stats">
        <div><dt>Streak</dt><dd>{stats.streak}</dd></div>
        <div><dt>Best</dt><dd>{stats.bestStreak}</dd></div>
        <div><dt>Played</dt><dd>{stats.played}</dd></div>
        <div><dt>Average</dt><dd>{stats.average}</dd></div>
        <div><dt>Perfect rounds</dt><dd>{stats.perfectRounds}</dd></div>
        <div><dt>Perfect days</dt><dd>{stats.perfectDays}</dd></div>
      </dl>

      <p className="countdown">
        Next puzzle in <strong>{formatCountdown(remaining)}</strong>
      </p>

      <div className="secondary-row">
        <button type="button" className="secondary" onClick={onPractice}>Play a practice round</button>
        <button type="button" className="secondary" onClick={onArchive}>Past days</button>
      </div>
    </section>
  )
}
