import { useEffect, useMemo, useState } from 'react'
import { Bird } from './components/Bird'
import { Home } from './components/Home'
import { Round } from './components/Round'
import { Summary } from './components/Summary'
import { SETS } from './data/sets'
import { dateForDay, dayNumber, exampleFor, setsForDay } from './game/daily'
import { DAY_MAX, roundTone, scoreDay } from './game/scoring'
import { computeStats } from './game/stats'
import { loadSave, storeSave } from './game/storage'
import type { PuzzleSet, RoundResult, Save } from './game/types'

type View =
  | { kind: 'home' }
  | { kind: 'day'; day: number }
  | { kind: 'archive' }
  | { kind: 'practice'; set: PuzzleSet; seed: number }

const ROUND_NAMES = ['Round 1 · warm-up', 'Round 2 · trickier', 'Round 3 · the twist']

function Logo() {
  return (
    <svg className="logo" viewBox="0 0 32 32" aria-hidden="true">
      <rect x="3" y="21" width="26" height="6" rx="3" fill="var(--hit)" />
      <rect x="3" y="13" width="19" height="6" rx="3" fill="var(--near)" />
      <rect x="3" y="5" width="12" height="6" rx="3" fill="var(--miss)" />
      <path d="M15 6.5l5 1.5-5 1.5z" fill="var(--ink)" />
      <circle cx="11" cy="7.5" r="1" fill="var(--bg)" />
    </svg>
  )
}

function useToday() {
  const [today, setToday] = useState(() => dayNumber(new Date()))
  useEffect(() => {
    const check = () => setToday(dayNumber(new Date()))
    const timer = window.setInterval(check, 30_000)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])
  return today
}

export default function App() {
  const today = useToday()
  const [save, setSave] = useState<Save>(loadSave)
  const [view, setView] = useState<View>({ kind: 'home' })
  // Which round of the viewed day is on screen; 3 means the summary.
  const [roundIndex, setRoundIndex] = useState(() => save.days[today]?.rounds.length ?? 0)
  const [justFinished, setJustFinished] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  useEffect(() => storeSave(save), [save])

  const openDay = (day: number) => {
    setView({ kind: 'day', day })
    setRoundIndex(save.days[day]?.rounds.length ?? 0)
    setJustFinished(false)
  }

  // Midnight rollover: if the player was on yesterday's live puzzle, move them to today's.
  useEffect(() => {
    setView((v) => {
      if (v.kind !== 'day' || v.day !== today - 1) return v
      setRoundIndex(save.days[today]?.rounds.length ?? 0)
      setJustFinished(false)
      return { kind: 'day', day: today }
    })
    // Only the date changing should trigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today])

  const stats = useMemo(() => computeStats(save.days, today), [save.days, today])
  const isNewPlayer = Object.keys(save.days).length === 0

  const startPractice = () => {
    const todays = setsForDay(today, SETS)
    const pool = SETS.filter((s) => !todays.includes(s))
    const seed = Math.floor(Math.random() * 1e9)
    setView({ kind: 'practice', set: pool[seed % pool.length], seed })
  }

  const lockRound = (day: number, result: RoundResult) => {
    setSave((s) => {
      const existing = s.days[day]
      const record = existing ?? { rounds: [], hard: s.hard, live: day === today }
      return { ...s, days: { ...s.days, [day]: { ...record, rounds: [...record.rounds, result] } } }
    })
  }

  const goHome = () => setView({ kind: 'home' })

  let content
  if (view.kind === 'home') {
    const record = save.days[today]
    content = (
      <Home
        day={today}
        sets={setsForDay(today, SETS)}
        record={record}
        hard={record?.hard ?? save.hard}
        stats={stats}
        onPlay={() => openDay(today)}
        onArchive={() => setView({ kind: 'archive' })}
        onPractice={startPractice}
      />
    )
  } else if (view.kind === 'archive') {
    const past = Array.from({ length: today - 1 }, (_, i) => today - 1 - i)
    content = (
      <section className="archive" aria-label="Past days">
        <h2 className="rule">Past days</h2>
        <p className="hint">Catch up on any day you missed. Past days don’t change your streak.</p>
        {past.length === 0 && <p>Nothing here yet — come back tomorrow.</p>}
        <ul>
          {past.map((day) => {
            const record = save.days[day]
            const done = record?.rounds.length === 3
            return (
              <li key={day}>
                <button type="button" className="archive-row" onClick={() => openDay(day)}>
                  <span>
                    #{day} · {dateForDay(day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                  <span>{done ? `${scoreDay(record.rounds)}/${DAY_MAX}` : record ? 'Continue' : 'Play'}</span>
                </button>
              </li>
            )
          })}
        </ul>
        <button type="button" className="secondary" onClick={goHome}>Back to today</button>
      </section>
    )
  } else if (view.kind === 'practice') {
    content = (
      <Round
        key={`practice-${view.seed}`}
        set={view.set}
        example={save.hard ? exampleFor(view.set, SETS) : undefined}
        hard={save.hard}
        seed={view.seed}
        label="Practice · doesn’t count"
        showHint={false}
        muted={save.muted}
        nextLabel="Another one"
        onLock={() => {}}
        onNext={startPractice}
      />
    )
  } else {
    const { day } = view
    const sets = setsForDay(day, SETS)
    const record = save.days[day]
    const hard = record?.hard ?? save.hard
    if (record && roundIndex >= 3) {
      content = (
        <Summary
          day={day}
          record={record}
          sets={sets}
          stats={stats}
          fresh={justFinished}
          muted={save.muted}
          onPractice={startPractice}
          onArchive={() => setView({ kind: 'archive' })}
        />
      )
    } else {
      const set = sets[roundIndex]
      const played = record?.rounds ?? []
      content = (
        <>
          <div className="perch" aria-label={`Round ${roundIndex + 1} of 3`}>
            {sets.map((_, i) => {
              const result = played[i]
              const tone = result && roundTone(result.score)
              return (
                <span key={i} className={`perch-slot ${result ? 'done' : i === roundIndex ? 'current' : ''}`}>
                  {tone ? <Bird size={30} tone={tone} /> : <i />}
                  <b>{result ? result.score : `Round ${i + 1}`}</b>
                </span>
              )
            })}
            <span className="pips-total">
              <b>{scoreDay(played)}</b> pts
            </span>
          </div>
        <Round
          key={`${day}-${roundIndex}`}
          set={set}
          example={hard ? exampleFor(set, SETS, sets) : undefined}
          hard={hard}
          seed={day * 10 + roundIndex}
          label={`#${day} · ${ROUND_NAMES[roundIndex]}`}
          showHint={isNewPlayer && roundIndex === 0}
          muted={save.muted}
          nextLabel={roundIndex === 2 ? 'See my score' : 'Next round'}
          onLock={(result) => lockRound(day, result)}
          onNext={() => {
            setJustFinished(roundIndex === 2)
            setRoundIndex(roundIndex + 1)
          }}
        />
        </>
      )
    }
  }

  const dayInProgress = view.kind === 'day' && (save.days[view.day]?.rounds.length ?? 0) % 3 !== 0

  return (
    <div className="app">
      <header>
        <button type="button" className="brand" onClick={goHome} aria-label="Pecking Order — today’s puzzle">
          <Logo />
          <span>Pecking Order</span>
        </button>
        <nav aria-label="Options">
          {stats.streak > 0 && <span className="streak" title="Day streak">🔥 {stats.streak}</span>}
          <button
            type="button"
            className={`chip ${save.hard ? 'on' : ''}`}
            aria-pressed={save.hard}
            disabled={dayInProgress}
            title={dayInProgress ? 'Finish this day first' : 'Hard mode hides the rule'}
            onClick={() => setSave((s) => ({ ...s, hard: !s.hard }))}
          >
            Hard
          </button>
          <button
            type="button"
            className="chip"
            aria-pressed={!save.muted}
            aria-label={save.muted ? 'Turn sound on' : 'Turn sound off'}
            onClick={() => setSave((s) => ({ ...s, muted: !s.muted }))}
          >
            {save.muted ? '🔇' : '🔊'}
          </button>
          <button type="button" className="chip" aria-label="How to play" onClick={() => setHelpOpen(true)}>?</button>
        </nav>
      </header>

      <main>{content}</main>

      {view.kind === 'practice' && (
        <footer>
          <button type="button" className="secondary" onClick={goHome}>Back to today</button>
        </footer>
      )}

      {helpOpen && (
        <div className="backdrop" onClick={() => setHelpOpen(false)}>
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={(e) => e.stopPropagation()}>
            <h2 id="help-title">How to play</h2>
            <ul>
              <li>Three rounds a day. Put five things in order, then lock it in.</li>
              <li>🟩 right spot · 🟨 one place off · 🟥 further away.</li>
              <li>One try per round — the reveal is the fun part.</li>
              <li>Your streak counts days played. A low score never breaks it.</li>
              <li><strong>Hard mode</strong> hides the rule. You only get a solved example to work out what the order means.</li>
            </ul>
            <button type="button" className="primary" autoFocus onClick={() => setHelpOpen(false)}>Got it</button>
          </div>
        </div>
      )}
    </div>
  )
}
