import { useEffect, useRef, useState } from 'react'
import { categoryFor } from '../data/icons'
import { msUntilNextDay } from '../game/daily'
import { useInstall } from '../lib/install'
import { DAY_MAX, isPerfectRound, roundTone, scoreDay, shareText } from '../game/scoring'
import type { Stats } from '../game/stats'
import type { DayRecord, Mark, PuzzleSet } from '../game/types'
import { playFanfare } from '../lib/feedback'
import { formatCountdown } from '../lib/format'
import { shareCardBlob } from '../lib/shareImage'
import { Bird } from './Bird'
import { Confetti, CountUp } from './Effects'
import { RankCard } from './RankCard'

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
  /** Tomorrow's rounds, when it is fair to tease them (today's puzzle, rule not hidden). */
  tomorrow?: readonly PuzzleSet[]
}

const EMOJI: Record<Mark, string> = { hit: '🟩', near: '🟨', miss: '🟥' }

function headline(total: number, perfectDay: boolean) {
  if (perfectDay) return 'Perfect day!'
  if (total >= 80) return 'Top of the pecking order'
  if (total >= 55) return 'Nicely ranked'
  return 'Every bird starts somewhere'
}

export function Summary({ day, record, sets, stats, fresh, muted, onPractice, onArchive, tomorrow }: Props) {
  const total = scoreDay(record.rounds)
  const perfectDay = record.rounds.every(isPerfectRound)
  // The best round wears the crown, shared on a tie, unless nothing scored.
  const best = Math.max(1, ...record.rounds.map((r) => r.score))
  const [copied, setCopied] = useState(false)
  const [remaining, setRemaining] = useState(() => msUntilNextDay(new Date()))
  const { install } = useInstall()

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(msUntilNextDay(new Date())), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (fresh && perfectDay) playFanfare(muted, true)
    // Runs once when the summary first appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const url = location.origin + location.pathname
  // Drawn ahead of time: Safari only opens the share sheet straight from the tap.
  const image = useRef<File | null>(null)
  useEffect(() => {
    let live = true
    void shareCardBlob(day, record, sets, url).then((blob) => {
      if (live && blob) image.current = new File([blob], `peckish-${day}.png`, { type: 'image/png' })
    })
    return () => {
      live = false
    }
  }, [day, record, sets, url])

  const saveImage = () => {
    const file = image.current
    if (!file) return
    const href = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = href
    a.download = file.name
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(href), 1000)
  }

  const share = async () => {
    const text = shareText(day, record, sets[2].teaser, url)
    try {
      // Phones get the native share sheet, with the result card when files are supported.
      if (navigator.share && matchMedia('(pointer: coarse)').matches) {
        const file = image.current
        if (file && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], text })
        } else {
          await navigator.share({ text })
        }
        return
      }
      // Desktops copy the text; the card is a click away on "Save image".
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Share sheet dismissed: nothing to do. Anything else: fall back to text + image download.
      if (err instanceof DOMException && err.name === 'AbortError') return
      saveImage()
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      } catch {
        // Clipboard blocked too; the downloaded image is the fallback.
      }
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

      {record.live && <RankCard points={stats.points} gained={total} celebrate={fresh} perDay={stats.average} />}

      <ul className="recap">
        {record.rounds.map((round, i) => (
          <li key={i}>
            <span className="grid-row" aria-label={`Round ${i + 1}: ${round.marks.filter((m) => m === 'hit').length} of 5 in place`}>
              {round.marks.map((m) => EMOJI[m]).join('')}
              {round.first && <small> second try</small>}
              {round.hint && <small> 💡 hint</small>}
            </span>
            <span className="recap-name">{categoryFor(sets[i].key)[1]} · {round.score} pts</span>
          </li>
        ))}
      </ul>

      <div className="share-row">
        <button type="button" className="primary" onClick={share}>
          {copied ? 'Copied!' : 'Share result'}
        </button>
        <button type="button" className="secondary" onClick={saveImage}>Save image</button>
      </div>

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
      {install && (
        <button type="button" className="secondary install" onClick={install}>
          📲 Add Peckish to your home screen
        </button>
      )}
      {tomorrow && (
        <p className="tomorrow">
          <b>Tomorrow</b>
          {tomorrow.map((set, i) => {
            const [icon, name] = categoryFor(set.key)
            return (
              <span key={i}>
                <span aria-hidden="true">{icon}</span> {name}
              </span>
            )
          })}
        </p>
      )}

      <div className="secondary-row">
        <button type="button" className="secondary" onClick={onPractice}>Play a practice round</button>
        <button type="button" className="secondary" onClick={onArchive}>Past days</button>
      </div>
    </section>
  )
}
