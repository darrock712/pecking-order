import { useEffect, useMemo, useRef, useState } from 'react'
import { Bird } from './components/Bird'
import { Help } from './components/Help'
import { Home } from './components/Home'
import { Round } from './components/Round'
import { Summary } from './components/Summary'
import { ALL_SETS, SETS, dealDay } from './data/sets'
import { dateForDay, dayNumber, exampleFor } from './game/daily'
import { DAY_MAX, roundTone, scoreDay } from './game/scoring'
import { computeStats } from './game/stats'
import { KEY, loadSave, storeSave } from './game/storage'
import type { Check, PuzzleSet, RoundResult, Save } from './game/types'

type View =
  | { kind: 'home' }
  | { kind: 'day'; day: number }
  | { kind: 'archive' }
  | { kind: 'practice'; set: PuzzleSet; seed: number }

const ROUND_NAMES = ['warm-up', 'trickier', 'the twist']

function Logo() {
  return (
    <span className="logo">
      <Bird size={22} crown />
    </span>
  )
}

/** Development only: `?day=12` opens that day as if it were today. Compiled out of the real build. */
function currentDay(): number {
  if (import.meta.env.DEV) {
    const forced = Number(new URLSearchParams(location.search).get('day'))
    if (Number.isInteger(forced) && forced > 0) return forced
  }
  return dayNumber(new Date())
}

function useToday() {
  const [today, setToday] = useState(currentDay)
  useEffect(() => {
    const check = () => setToday(currentDay())
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

  // Bumped when another tab saves, so the round on screen is rebuilt from the shared save.
  const [sync, setSync] = useState(0)
  const fromOtherTab = useRef(false)

  useEffect(() => {
    // A save that just arrived from another tab is already stored; writing it back could ping-pong.
    if (fromOtherTab.current) fromOtherTab.current = false
    else storeSave(save)
  }, [save])

  // Two open tabs must never overwrite each other or let a finished round be played again.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== KEY && event.key !== null) return
      fromOtherTab.current = true
      setSave(loadSave())
      setSync((n) => n + 1)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const openDay = (day: number) => {
    setView({ kind: 'day', day })
    setRoundIndex(save.days[day]?.rounds.length ?? 0)
    setJustFinished(false)
  }

  // Midnight rollover: if the player was on yesterday's live puzzle, move them to today's.
  useEffect(() => {
    if (view.kind === 'day' && view.day === today - 1) openDay(today)
    // Only the date changing should trigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today])

  // After a save from another tab, jump the viewed day to wherever that tab got to.
  useEffect(() => {
    if (sync === 0 || view.kind !== 'day') return
    setRoundIndex(save.days[view.day]?.rounds.length ?? 0)
    setJustFinished(false)
    // Only a new sync should trigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sync])

  const stats = useMemo(() => computeStats(save.days, today), [save.days, today])
  const isNewPlayer = Object.keys(save.days).length === 0

  const startPractice = () => {
    const todays = dealDay(today)
    const pool = ALL_SETS.filter((s) => !todays.includes(s))
    const seed = Math.floor(Math.random() * 1e9)
    setView({ kind: 'practice', set: pool[seed % pool.length], seed })
  }

  // Every write names the round it belongs to and is dropped if the save has moved past it
  // (another tab finished that round), so a result can never land on the wrong round.
  const lockRound = (day: number, index: number, result: RoundResult) => {
    setSave((s) => {
      const existing = s.days[day]
      if ((existing?.rounds.length ?? 0) !== index) return s
      const record = existing ?? { rounds: [], hard: s.hard, live: day === today }
      return { ...s, days: { ...s.days, [day]: { ...record, pending: undefined, pendingChecks: undefined, rounds: [...record.rounds, result] } } }
    })
  }

  // Remember a first peck straight away, so reloading can't buy a fresh first try.
  const peckRound = (day: number, index: number, order: number[]) => {
    setSave((s) => {
      if ((s.days[day]?.rounds.length ?? 0) !== index) return s
      const record = s.days[day] ?? { rounds: [], hard: s.hard, live: day === today }
      return { ...s, days: { ...s.days, [day]: { ...record, pending: order } } }
    })
  }

  // Same for the checks: once used, they stay used.
  const checkRound = (day: number, index: number, checks: Check[]) => {
    setSave((s) => {
      if ((s.days[day]?.rounds.length ?? 0) !== index) return s
      const record = s.days[day] ?? { rounds: [], hard: s.hard, live: day === today }
      return { ...s, days: { ...s.days, [day]: { ...record, pendingChecks: checks } } }
    })
  }

  const goHome = () => setView({ kind: 'home' })

  let content
  if (view.kind === 'home') {
    const record = save.days[today]
    content = (
      <Home
        day={today}
        sets={dealDay(today)}
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
    const sets = dealDay(day)
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
          tomorrow={day === today && !hard ? dealDay(today + 1) : undefined}
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
            key={`${day}-${roundIndex}-${sync}`}
            set={set}
            example={hard ? exampleFor(set, SETS, sets) : undefined}
            hard={hard}
            seed={day * 10 + roundIndex}
            label={`#${day} · ${set.units ? 'mixed bag' : ROUND_NAMES[roundIndex]}`}
            showHint={isNewPlayer && roundIndex === 0}
            muted={save.muted}
            nextLabel={roundIndex === 2 ? 'See my score' : 'Next round'}
            firstPeck={record?.pending}
            usedChecks={record?.pendingChecks}
            onPeck={(order) => peckRound(day, roundIndex, order)}
            onCheck={(checks) => checkRound(day, roundIndex, checks)}
            onLock={(result) => lockRound(day, roundIndex, result)}
            onNext={() => {
              setJustFinished(roundIndex === 2)
              setRoundIndex(roundIndex + 1)
            }}
          />
        </>
      )
    }
  }

  const viewed = view.kind === 'day' ? save.days[view.day] : undefined
  const dayInProgress = !!viewed && (viewed.rounds.length % 3 !== 0 || !!viewed.pending || !!viewed.pendingChecks)

  return (
    <div className="app">
      <header>
        <button type="button" className="brand" onClick={goHome} aria-label="Peckish — today’s puzzle">
          <Logo />
          <span>Peckish</span>
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

      {helpOpen && <Help onClose={() => setHelpOpen(false)} />}
    </div>
  )
}
