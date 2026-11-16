import '@fontsource/caveat/700.css'
import '@fontsource/patrick-hand/400.css'
import { useState } from 'react'
import { isDone, nele, today, tony, type Direction, type Habit, type Period, type Person } from '../data'
import './sticker.css'

type Totals = Record<string, number>

const seed = (p: Person): Totals => Object.fromEntries(p.habits.map((h) => [h.id, h.total]))
const doneCount = (p: Person, t: Totals) => p.habits.filter((h) => isDone(h, t[h.id])).length
const fmt = (n: number) => n.toLocaleString('en-GB')
const tints = ['#ffe58a', '#ffc9de', '#bfe9d2', '#c6e0ff']

export default function Sticker() {
  const [mine, setMine] = useState(() => seed(tony))
  const [hers, setHers] = useState(() => seed(nele))
  const [sheet, setSheet] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const myDone = doneCount(tony, mine)
  const herDone = doneCount(nele, hers)
  const allDone = myDone === tony.habits.length && herDone === nele.habits.length
  if (!allDone && dismissed) setDismissed(false)

  const setMy = (id: string, v: number) => setMine((t) => ({ ...t, [id]: Math.max(0, v) }))
  // Mock-only shortcut so the celebration is reachable: tapping Nele's sticker logs one step, wrapping to 0.
  const nudgeHer = (h: Habit) =>
    setHers((t) => {
      const next = t[h.id] + h.step
      return { ...t, [h.id]: (h.direction === 'at_least' ? t[h.id] >= h.target : next > h.target) ? 0 : next }
    })

  return (
    <div className="sticker">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <filter id="sticker-wobble">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" />
          <feDisplacementMap in="SourceGraphic" scale="3.5" />
        </filter>
      </svg>

      <header className="st-head">
        <p className="st-kicker">today is</p>
        <h1>{today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</h1>
        <svg className="st-underline" viewBox="0 0 300 14" preserveAspectRatio="none" aria-hidden>
          <path d="M4 9 C 60 3, 120 12, 180 6 S 270 4, 296 8" />
        </svg>
      </header>

      <section className="st-nele st-card" style={{ background: tints[1] }}>
        <div className="st-nele-top">
          <span className="st-avatar">N</span>
          <div>
            <h2>Nele's day</h2>
            <p className="st-sub">
              {herDone} of {nele.habits.length} done {herDone === nele.habits.length ? '🎉' : ''}
            </p>
          </div>
        </div>
        <div className="st-nele-row">
          {nele.habits.map((h) => {
            const t = hers[h.id]
            return (
              <button key={h.id} className="st-mini" onClick={() => nudgeHer(h)} aria-label={`Log ${h.name} for Nele`}>
                <span className="st-mini-emoji">{h.emoji}</span>
                {isDone(h, t) && <span className="st-stamp">✓</span>}
                <span className="st-mini-name">{h.name}</span>
                <span className="st-mini-prog">
                  {t}/{h.target}
                  {h.unit ? ` ${h.unit}` : ''}
                </span>
              </button>
            )
          })}
        </div>
        <p className="st-hint">psst — tap her stickers to log for her (mock only)</p>
      </section>

      <div className="st-mine-head">
        <h2>My list</h2>
        <span className="st-sub">
          {myDone}/{tony.habits.length} done
        </span>
      </div>

      {tony.habits.map((h, i) => (
        <HabitCard key={h.id} habit={h} total={mine[h.id]} tint={tints[(i + 2) % 4]} set={(v) => setMy(h.id, v)} />
      ))}

      <button className="st-add" onClick={() => setSheet(true)}>
        <span>＋</span> stick on a new habit
      </button>

      {sheet && <AddSheet onClose={() => setSheet(false)} />}
      {allDone && !dismissed && <Celebration onClose={() => setDismissed(true)} />}
    </div>
  )
}

function HabitCard({ habit: h, total, tint, set }: { habit: Habit; total: number; tint: string; set: (v: number) => void }) {
  const done = isDone(h, total)
  const over = h.direction === 'at_most' && total > h.target
  return (
    <article className={`st-habit st-card${done ? ' is-done' : ''}`} style={{ background: tint }}>
      <span className="st-emoji">{h.emoji}</span>
      <div className="st-body">
        <h3>{h.name}</h3>
        <p className="st-streak">🔥 {h.streak} day streak</p>

        {h.direction === 'at_least' ? (
          <div className="st-ticks">
            {Array.from({ length: h.target }, (_, i) => (
              <Tick key={i} on={i < total} onClick={() => set(i < total ? total - 1 : total + 1)} />
            ))}
            <span className="st-count">
              {total}/{h.target}
            </span>
          </div>
        ) : (
          <>
            <div className="st-meter">
              <div className={`st-fill${over ? ' is-over' : ''}`} style={{ width: `${Math.min(total / h.target, 1) * 100}%` }} />
            </div>
            <div className="st-step-row">
              <button className="st-round" onClick={() => set(total - h.step)} disabled={total === 0} aria-label={`minus ${h.step}`}>
                −{h.step}
              </button>
              <span className="st-count">
                {fmt(total)} / {fmt(h.target)} {h.unit}
                <small>{total === 0 ? 'nothing logged yet' : over ? `${fmt(total - h.target)} over!` : `${fmt(h.target - total)} left`}</small>
              </span>
              <button className="st-round" onClick={() => set(total + h.step)} aria-label={`plus ${h.step}`}>
                +{h.step}
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  )
}

function Tick({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button className={`st-tick${on ? ' is-on' : ''}`} onClick={onClick} aria-pressed={on}>
      <svg viewBox="0 0 34 34" aria-hidden>
        <path className="box" d="M4 5 C 12 3, 22 4, 30 4 C 31 12, 30 22, 31 30 C 22 31, 12 30, 4 31 C 3 22, 4 12, 4 5 Z" />
        <path className="check" d="M8 18 C 11 20, 13 23, 15 27 C 18 18, 24 10, 32 3" />
      </svg>
    </button>
  )
}

const emojis = ['🏃', '📚', '🥦', '💤', '🎸', '🧹', '🚭', '🍷']

function AddSheet({ onClose }: { onClose: () => void }) {
  const [emoji, setEmoji] = useState(emojis[0])
  const [direction, setDirection] = useState<Direction>('at_least')
  const [period, setPeriod] = useState<Period>('day')

  return (
    <div className="st-backdrop" onClick={onClose}>
      <div className="st-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="New habit">
        <button className="st-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2>A new habit!</h2>

        <label className="st-field">
          <span>what is it?</span>
          <input placeholder="e.g. Go for a run" />
        </label>

        <div className="st-field">
          <span>pick a sticker</span>
          <div className="st-emoji-grid">
            {emojis.map((e) => (
              <button key={e} className={e === emoji ? 'is-on' : ''} onClick={() => setEmoji(e)}>
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="st-field">
          <span>I want to do it…</span>
          <div className="st-chips">
            <Chip on={direction === 'at_least'} onClick={() => setDirection('at_least')}>at least</Chip>
            <Chip on={direction === 'at_most'} onClick={() => setDirection('at_most')}>at most</Chip>
          </div>
        </div>

        <div className="st-pair">
          <label className="st-field">
            <span>target</span>
            <input inputMode="numeric" defaultValue="1" />
          </label>
          <label className="st-field">
            <span>step per tap</span>
            <input inputMode="numeric" defaultValue="1" />
          </label>
        </div>

        <div className="st-field">
          <span>every…</span>
          <div className="st-chips">
            <Chip on={period === 'day'} onClick={() => setPeriod('day')}>day</Chip>
            <Chip on={period === 'week'} onClick={() => setPeriod('week')}>week</Chip>
          </div>
        </div>

        <button className="st-primary" onClick={onClose}>
          Stick it on {emoji}
        </button>
      </div>
    </div>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: string }) {
  return (
    <button className={`st-chip${on ? ' is-on' : ''}`} onClick={onClick} aria-pressed={on}>
      {children}
    </button>
  )
}

const confetti = ['⭐', '🎉', '💛', '✨', '🌈', '🥳', '🍀', '🌟', '💖', '🎈', '⭐', '✨', '🎊', '💫']

function Celebration({ onClose }: { onClose: () => void }) {
  return (
    <div className="st-party" onClick={onClose}>
      {confetti.map((c, i) => (
        <span
          key={i}
          className="st-confetti"
          style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 7) * 0.35}s`, animationDuration: `${3 + (i % 4) * 0.6}s` }}
        >
          {c}
        </span>
      ))}
      <div className="st-party-card st-card" onClick={(e) => e.stopPropagation()}>
        <div className="st-party-avatars">
          <span className="st-avatar">T</span>
          <span className="st-heart">💛</span>
          <span className="st-avatar" style={{ background: tints[1] }}>
            N
          </span>
        </div>
        <h2>We did it!</h2>
        <p>Tony &amp; Nele both finished {today.toLocaleDateString('en-GB', { weekday: 'long' })}.</p>
        <p className="st-sub">gold star for the fridge ⭐</p>
        <button className="st-primary" onClick={onClose}>
          yay!
        </button>
      </div>
    </div>
  )
}
