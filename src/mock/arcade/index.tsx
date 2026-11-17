import '@fontsource/press-start-2p/400.css'
import '@fontsource/vt323/400.css'
import { type CSSProperties, type MouseEvent, useRef, useState } from 'react'
import { type Habit, isDone, nele, today, tony } from '../data'
import './arcade.css'

type Totals = Record<string, number>
type Floater = { id: number; x: number; y: number; text: string; tone: 'gain' | 'loss' | 'info' }

const all = [...tony.habits, ...nele.habits]
const seed: Totals = Object.fromEntries(all.map((h) => [h.id, h.total]))
const doneCount = (hs: Habit[], t: Totals) => hs.filter((h) => isDone(h, t[h.id])).length
const allDone = (t: Totals) => doneCount(all, t) === all.length

// Seed streaks already include today when the seed total is done.
const streakOf = (h: Habit, total: number) => h.streak - (isDone(h, h.total) ? 1 : 0) + (isDone(h, total) ? 1 : 0)

const TEAM_BONUS = 1000
const points = (h: Habit, total: number) =>
  (h.direction === 'at_least' ? Math.min(total, h.target) * 100 : 0) + (isDone(h, total) ? 500 : 0)
const score = (hs: Habit[], t: Totals) => hs.reduce((s, h) => s + points(h, t[h.id]), 0)

const stage = Math.round((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 864e5)
const dateLine = [
  today.toLocaleDateString('en-GB', { weekday: 'short' }),
  today.getDate(),
  today.toLocaleDateString('en-GB', { month: 'short' }),
  today.getFullYear(),
]
  .join(' ')
  .toUpperCase()

export default function Arcade() {
  const [totals, setTotals] = useState(seed)
  const [sheet, setSheet] = useState(false)
  const [party, setParty] = useState(false)
  const [floaters, setFloaters] = useState<Floater[]>([])
  const nextId = useRef(0)

  function float(e: MouseEvent, text: string, tone: Floater['tone']) {
    const id = nextId.current++
    setFloaters((f) => [...f, { id, x: e.clientX, y: e.clientY, text, tone }])
    setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 900)
  }

  function set(h: Habit, value: number, e: MouseEvent) {
    const prev = totals[h.id]
    const v = Math.max(0, value)
    if (v === prev) return
    const next = { ...totals, [h.id]: v }
    setTotals(next)
    const gain = points(h, v) - points(h, prev)
    if (gain) float(e, gain > 0 ? `+${gain}` : `${gain}`, gain > 0 ? 'gain' : 'loss')
    else if (h.unit) float(e, `${v > prev ? '+' : '-'}${h.step} ${h.unit}`, 'info')
    if (!allDone(totals) && allDone(next)) setTimeout(() => setParty(true), 600)
  }

  const cleared = allDone(totals)
  const tonyScore = score(tony.habits, totals)
  const neleScore = score(nele.habits, totals)
  const team = tonyScore + neleScore + (cleared ? TEAM_BONUS : 0)

  return (
    <div className="arc">
      <div className="arc-crt" aria-hidden />

      <header className="arc-marquee">
        <p className="arc-kicker">★ 2 PLAYER CO-OP ★</p>
        <h1>
          <span className="mag">HABIT</span> <span className="cyan">ARCADE</span>
        </h1>
        <p className="arc-date">
          {dateLine} · STAGE {stage}
        </p>
      </header>

      <section className="arc-board">
        <Player tag="1UP" name="TONY" tone="cyan" score={tonyScore} done={doneCount(tony.habits, totals)} of={tony.habits.length} />
        <div className="arc-hi">
          <span>TEAM HI</span>
          <Roll value={team} />
          <small>
            {doneCount(all, totals)}/{all.length} CLEAR
          </small>
        </div>
        <Player tag="2UP" name="NELE" tone="mag" score={neleScore} done={doneCount(nele.habits, totals)} of={nele.habits.length} />
      </section>

      {cleared ? (
        <button className="arc-attract on" onClick={() => setParty(true)}>
          ★ STAGE CLEAR · REPLAY ★
        </button>
      ) : (
        <p className="arc-attract">CLEAR ALL {all.length} QUESTS TOGETHER</p>
      )}

      <main>
        <div className="arc-head">
          <h2 className="cyan">1UP · MY QUESTS</h2>
          <button className="arc-btn small" onClick={() => setSheet(true)}>
            + NEW
          </button>
        </div>
        {tony.habits.map((h) => (
          <HabitCard key={h.id} habit={h} total={totals[h.id]} set={(v, e) => set(h, v, e)} />
        ))}

        <div className="arc-head">
          <h2 className="mag">2UP · NELE</h2>
          <span className="arc-demo">DEMO: TAP TO PLAY P2</span>
        </div>
        <div className="arc-nele">
          {nele.habits.map((h) => (
            <NeleRow key={h.id} habit={h} total={totals[h.id]} tap={(e) => set(h, nextNele(h, totals[h.id]), e)} />
          ))}
        </div>
      </main>

      {floaters.map((f) => (
        <span key={f.id} className={`arc-float ${f.tone}`} style={{ left: f.x, top: f.y }}>
          {f.text}
        </span>
      ))}

      {sheet && <AddSheet close={() => setSheet(false)} />}
      {party && <Celebration tony={tonyScore} nele={neleScore} close={() => setParty(false)} />}
    </div>
  )
}

function nextNele(h: Habit, total: number) {
  if (h.direction === 'at_least') return total >= h.target ? 0 : total + h.step
  return total + h.step > h.target ? 0 : total + h.step
}

function Roll({ value, width = 6 }: { value: number; width?: number }) {
  return (
    <span className="arc-roll" aria-label={String(value)}>
      {[...String(value).padStart(width, '0')].map((d, i) => (
        <span key={i} className="arc-digit">
          <span style={{ transform: `translateY(-${d}em)` }}>
            {'0123456789'.split('').map((n) => (
              <i key={n}>{n}</i>
            ))}
          </span>
        </span>
      ))}
    </span>
  )
}

function Player(p: { tag: string; name: string; tone: string; score: number; done: number; of: number }) {
  const finished = p.done === p.of
  return (
    <div className={`arc-player ${p.tone}`}>
      <span className={`arc-up ${finished ? '' : 'blink'}`}>{p.tag}</span>
      <b>{p.name}</b>
      <Roll value={p.score} />
      <span className="arc-pips">
        {Array.from({ length: p.of }, (_, i) => (
          <i key={i} className={i < p.done ? 'on' : ''} />
        ))}
      </span>
      <small>{finished ? 'READY!' : `${p.of - p.done} TO GO`}</small>
    </div>
  )
}

function HabitCard({ habit: h, total, set }: { habit: Habit; total: number; set: (v: number, e: MouseEvent) => void }) {
  const done = isDone(h, total)
  const ticks = h.direction === 'at_least'
  return (
    <section className={`arc-card ${done ? 'done' : ''}`}>
      <div className="arc-card-top">
        <span className="arc-emoji">{h.emoji}</span>
        <div className="arc-title">
          <h3>{h.name}</h3>
          <p>
            {ticks ? `${total}/${h.target} TODAY` : `MAX ${h.target} ${h.unit?.toUpperCase()}`}
            {done && <b className="arc-clear">CLEAR!</b>}
          </p>
        </div>
        <div className={`arc-combo ${done ? 'lit' : ''}`}>
          <small>COMBO</small>
          <b>x{streakOf(h, total)}</b>
        </div>
      </div>

      {ticks ? (
        <div className="arc-ticks" style={{ gridTemplateColumns: `repeat(${h.target}, 1fr)` }}>
          {Array.from({ length: h.target }, (_, i) => (
            <button
              key={i}
              className={`arc-tick ${i < total ? 'on' : ''}`}
              aria-label={`tick ${i + 1}`}
              onClick={(e) => set(i < total ? i : i + 1, e)}
            >
              {i < total ? '★' : h.target === 1 ? 'TAP TO CLEAR' : i + 1}
            </button>
          ))}
        </div>
      ) : (
        <Counter habit={h} total={total} set={set} />
      )}
    </section>
  )
}

function Counter({ habit: h, total, set }: { habit: Habit; total: number; set: (v: number, e: MouseEvent) => void }) {
  const segs = 22
  const filled = Math.min(segs, Math.ceil((total / h.target) * segs))
  const over = total > h.target
  return (
    <>
      <div className="arc-counter">
        <button className="arc-round minus" disabled={total === 0} onClick={(e) => set(total - h.step, e)}>
          -{h.step}
        </button>
        <div className={`arc-readout ${over ? 'over' : ''}`}>
          <Roll value={total} width={4} />
          <span>{over ? 'OVER LIMIT!' : `${h.target - total} ${h.unit?.toUpperCase()} LEFT`}</span>
        </div>
        <button className="arc-round plus" onClick={(e) => set(total + h.step, e)}>
          +{h.step}
        </button>
      </div>
      <div className={`arc-gauge ${over ? 'over' : ''}`}>
        {Array.from({ length: segs }, (_, i) => (
          <i key={i} className={i < filled ? 'on' : ''} />
        ))}
      </div>
    </>
  )
}

function NeleRow({ habit: h, total, tap }: { habit: Habit; total: number; tap: (e: MouseEvent) => void }) {
  const done = isDone(h, total)
  const segs = h.direction === 'at_least' ? h.target : 6
  const filled = h.direction === 'at_least' ? total : Math.ceil((total / h.target) * segs)
  return (
    <button className={`arc-nrow ${done ? 'done' : ''}`} onClick={tap}>
      <span className="arc-nemoji">{h.emoji}</span>
      <span className="arc-nname">
        {h.name}
        <small>COMBO x{streakOf(h, total)}</small>
      </span>
      <span className="arc-mini">
        {Array.from({ length: segs }, (_, i) => (
          <i key={i} className={i < filled ? 'on' : ''} />
        ))}
      </span>
      <span className="arc-nstat">
        {done ? 'CLEAR' : `${total}/${h.target}`}
      </span>
    </button>
  )
}

const EMOJI = ['🏃', '📚', '🥦', '💧', '🧘', '🎸', '😴', '🚭']
const STEPS = [1, 5, 10, 15, 25, 50, 100]

function AddSheet({ close }: { close: () => void }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(EMOJI[0])
  const [dir, setDir] = useState<'at_least' | 'at_most'>('at_least')
  const [period, setPeriod] = useState<'day' | 'week'>('day')
  const [step, setStep] = useState(1)
  const [target, setTarget] = useState(1)
  const stepIdx = STEPS.indexOf(step)

  return (
    <div className="arc-scrim" onClick={close}>
      <div className="arc-sheet" role="dialog" aria-label="New habit" onClick={(e) => e.stopPropagation()}>
        <div className="arc-sheet-head">
          <h2>NEW QUEST</h2>
          <button className="arc-btn small" onClick={close} aria-label="Close">
            ✕
          </button>
        </div>

        <label className="arc-label">ENTER NAME</label>
        <input className="arc-input" value={name} placeholder="READ 10 PAGES_" onChange={(e) => setName(e.target.value)} />

        <label className="arc-label">SELECT ICON</label>
        <div className="arc-emojis">
          {EMOJI.map((e) => (
            <button key={e} className={e === emoji ? 'on' : ''} onClick={() => setEmoji(e)}>
              {e}
            </button>
          ))}
        </div>

        <label className="arc-label">GOAL</label>
        <Seg value={dir} set={setDir} options={{ at_least: 'AT LEAST', at_most: 'AT MOST' }} />

        <div className="arc-pair">
          <div>
            <label className="arc-label">TARGET</label>
            <Stepper value={target} dec={() => setTarget(Math.max(step, target - step))} inc={() => setTarget(target + step)} />
          </div>
          <div>
            <label className="arc-label">STEP</label>
            <Stepper
              value={step}
              dec={() => setStep(STEPS[Math.max(0, stepIdx - 1)])}
              inc={() => setStep(STEPS[Math.min(STEPS.length - 1, stepIdx + 1)])}
            />
          </div>
        </div>

        <label className="arc-label">EVERY</label>
        <Seg value={period} set={setPeriod} options={{ day: 'DAY', week: 'WEEK' }} />

        <p className="arc-preview">
          {emoji} {name || 'New habit'}: {dir === 'at_least' ? 'at least' : 'at most'} {target} per {period}, +{step} a tap
        </p>

        <button className="arc-btn go" onClick={close}>
          PRESS START ▶
        </button>
      </div>
    </div>
  )
}

function Seg<T extends string>({ value, set, options }: { value: T; set: (v: T) => void; options: Record<T, string> }) {
  return (
    <div className="arc-seg">
      {(Object.keys(options) as T[]).map((k) => (
        <button key={k} className={k === value ? 'on' : ''} onClick={() => set(k)}>
          {options[k]}
        </button>
      ))}
    </div>
  )
}

function Stepper({ value, dec, inc }: { value: number; dec: () => void; inc: () => void }) {
  return (
    <div className="arc-stepper">
      <button onClick={dec} aria-label="decrease">
        −
      </button>
      <b>{value}</b>
      <button onClick={inc} aria-label="increase">
        +
      </button>
    </div>
  )
}

const BURSTS = [
  { x: 18, y: 14, c: 'var(--mag)', d: 0 },
  { x: 82, y: 22, c: 'var(--cyan)', d: -0.7 },
  { x: 50, y: 6, c: 'var(--yel)', d: -1.3 },
  { x: 14, y: 86, c: 'var(--cyan)', d: -0.4 },
  { x: 86, y: 82, c: 'var(--mag)', d: -1 },
]

function Celebration({ tony: t, nele: n, close }: { tony: number; nele: number; close: () => void }) {
  return (
    <div className="arc-party" onClick={close}>
      {BURSTS.map((b, i) => (
        <span
          key={i}
          className="arc-burst"
          style={{ left: `${b.x}%`, top: `${b.y}%`, color: b.c }}
          aria-hidden
        >
          {Array.from({ length: 12 }, (_, k) => (
            <i key={k} style={{ '--a': `${k * 30}deg`, animationDelay: `${b.d}s` } as CSSProperties} />
          ))}
        </span>
      ))}
      <p className="arc-kicker">STAGE {stage} · BOTH PLAYERS</p>
      <h2 className="arc-big">
        STAGE
        <br />
        CLEAR!
      </h2>
      <p className="arc-newhi">★ NEW TEAM HIGH SCORE ★</p>
      <table className="arc-table">
        <tbody>
          <tr className="cyan">
            <td>1UP</td>
            <td>TONY</td>
            <td>{String(t).padStart(6, '0')}</td>
          </tr>
          <tr className="mag">
            <td>2UP</td>
            <td>NELE</td>
            <td>{String(n).padStart(6, '0')}</td>
          </tr>
          <tr className="yel">
            <td>CO-OP</td>
            <td>BONUS</td>
            <td>{String(TEAM_BONUS).padStart(6, '0')}</td>
          </tr>
          <tr className="total">
            <td colSpan={2}>TEAM</td>
            <td>{String(t + n + TEAM_BONUS).padStart(6, '0')}</td>
          </tr>
        </tbody>
      </table>
      <p className="arc-bonus">ALL {all.length} QUESTS CLEAR · COMBOS +1</p>
      <button className="arc-btn go" onClick={close}>
        CONTINUE ▶
      </button>
      <p className="arc-blink">INSERT COIN TOMORROW</p>
    </div>
  )
}
