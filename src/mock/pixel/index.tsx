import '@fontsource/press-start-2p/400.css'
import '@fontsource/pixelify-sans/400.css'
import '@fontsource/pixelify-sans/600.css'
import { useState } from 'react'
import { type Habit, isDone, nele, today, tony } from '../data'
import './pixel.css'

const C = {
  ink: '#26203a',
  cream: '#fbf1d3',
  sky: '#7ec4e8',
  grass: '#6abe56',
  sun: '#f9c846',
  tomato: '#e8584a',
  plum: '#9a5bc8',
  peach: '#f2b98a',
}

const TONY_FACE = ['..hhhh..', '.hhhhhh.', '.hsssss.', '.sesses.', '.ssssss.', '.ssmmss.', '..ssss..', '.tttttt.']
const NELE_FACE = ['..hhhh..', '.hhhhhh.', 'hhsssshh', 'hsesse.h', 'hssssssh', 'hssmmssh', 'h.ssss.h', '.pppppp.']
const FLAME = ['...a...', '..aa...', '..aaa.a', '.aabaaa', '.abbbaa', 'aabbbba', 'abbccba', '.abccb.', '..aaa..']
const CHECK = ['......k', '.....kk', 'k...kk.', 'kk.kk..', '.kkk...', '..k....']
const CLOUD = ['....cc......', '...cccc.cc..', '.cccccccccc.', 'cccccccccccc']
const TROPHY = ['yyyyyyyyy', 'y.yywyy.y', 'y.yywyy.y', '.yyyyyyy.', '..yyyyy..', '...yyy...', '....y....', '...yyy...', '..kkkkk..']

const tonyColors = { h: C.ink, s: C.peach, e: C.ink, m: C.tomato, t: C.tomato }
const neleColors = { h: C.sun, s: C.peach, e: C.ink, m: C.tomato, p: C.plum }

function Sprite({ rows, colors, px = 4 }: { rows: string[]; colors: Record<string, string>; px?: number }) {
  const w = rows[0].length
  const h = rows.length
  return (
    <svg width={w * px} height={h * px} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" aria-hidden>
      {rows.flatMap((r, y) =>
        [...r].map((c, x) => (colors[c] ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={colors[c]} /> : null)),
      )}
    </svg>
  )
}

const all = [...tony.habits, ...nele.habits]
const seed = Object.fromEntries(all.map((h) => [h.id, h.total]))
const doneCount = (habits: Habit[], t: Record<string, number>) => habits.filter((h) => isDone(h, t[h.id])).length
const allDone = (t: Record<string, number>) => doneCount(all, t) === all.length

// Seed streaks already include today when the seed total is done.
const streakOf = (h: Habit, total: number) => h.streak - (isDone(h, h.total) ? 1 : 0) + (isDone(h, total) ? 1 : 0)

export default function Pixel() {
  const [totals, setTotals] = useState(seed)
  const [sheet, setSheet] = useState(false)
  const [party, setParty] = useState(false)

  function set(id: string, value: number) {
    const next = { ...totals, [id]: Math.max(0, value) }
    setTotals(next)
    if (!allDone(totals) && allDone(next)) setParty(true)
  }

  const tonyDone = doneCount(tony.habits, totals)
  const neleDone = doneCount(nele.habits, totals)
  const cleared = allDone(totals)

  return (
    <div className="pixel">
      <header className="px-sky">
        <div className="px-cloud c1">
          <Sprite rows={CLOUD} colors={{ c: C.cream }} px={6} />
        </div>
        <div className="px-cloud c2">
          <Sprite rows={CLOUD} colors={{ c: C.cream }} px={4} />
        </div>
        <p className="px-kicker">★ HABIT QUEST ★</p>
        <h1>{today.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase()}</h1>
        <p className="px-date">{today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}</p>
        <div className="px-versus px-box">
          <Player face={TONY_FACE} colors={tonyColors} name="TONY" tag="P1" done={tonyDone} of={tony.habits.length} />
          <span className="px-vs">{cleared ? '★' : '&'}</span>
          <Player face={NELE_FACE} colors={neleColors} name="NELE" tag="P2" done={neleDone} of={nele.habits.length} />
        </div>
        {cleared && (
          <button className="px-btn px-replay" onClick={() => setParty(true)}>
            ★ STAGE CLEAR ★
          </button>
        )}
      </header>

      <main>
        <div className="px-section">
          <h2>MY QUESTS</h2>
          <button className="px-btn small" onClick={() => setSheet(true)}>
            + NEW
          </button>
        </div>

        {tony.habits.map((h) => (
          <HabitCard key={h.id} habit={h} total={totals[h.id]} set={(v) => set(h.id, v)} />
        ))}

        <div className="px-section">
          <h2>NELE TODAY</h2>
          <span className="px-hint">demo: tap to log for her</span>
        </div>
        <div className="px-box px-nele">
          {nele.habits.map((h) => (
            <NeleRow key={h.id} habit={h} total={totals[h.id]} tap={() => set(h.id, nextNele(h, totals[h.id]))} />
          ))}
        </div>
      </main>

      {sheet && <AddSheet close={() => setSheet(false)} />}
      {party && <Celebration close={() => setParty(false)} />}
    </div>
  )
}

function nextNele(h: Habit, total: number) {
  if (h.direction === 'at_least') return total >= h.target ? 0 : total + h.step
  return total + h.step > h.target ? 0 : total + h.step
}

function Player(p: { face: string[]; colors: Record<string, string>; name: string; tag: string; done: number; of: number }) {
  return (
    <div className="px-player">
      <div className="px-avatar">
        <Sprite rows={p.face} colors={p.colors} px={5} />
      </div>
      <div>
        <div className="px-pname">
          <span className="px-tag">{p.tag}</span> {p.name}
        </div>
        <div className="px-hearts">
          {Array.from({ length: p.of }, (_, i) => (
            <span key={i} className={i < p.done ? 'on' : ''}>
              ♥
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function Streak({ n, lit }: { n: number; lit: boolean }) {
  return (
    <div className={`px-streak ${lit ? 'lit' : ''}`} title={`${n} day streak`}>
      <Sprite rows={FLAME} colors={{ a: C.tomato, b: C.sun, c: C.cream }} px={3} />
      <span>{n}</span>
    </div>
  )
}

function HabitCard({ habit: h, total, set }: { habit: Habit; total: number; set: (v: number) => void }) {
  const done = isDone(h, total)
  const ticks = h.direction === 'at_least'
  const tickRow = (
    <div className="px-ticks">
      {Array.from({ length: h.target }, (_, i) => (
        <button
          key={`${i}-${i < total}`}
          className={`px-tick ${i < total ? 'on' : ''}`}
          aria-label={`tick ${i + 1}`}
          onClick={() => set(i < total ? i : i + 1)}
        >
          {i < total && <Sprite rows={CHECK} colors={{ k: C.ink }} px={4} />}
        </button>
      ))}
    </div>
  )
  return (
    <section className={`px-box px-card ${done ? 'done' : ''}`}>
      <div className="px-card-top">
        <div className="px-emoji">{h.emoji}</div>
        <div className="px-title">
          <h3>{h.name}</h3>
          <p>
            {ticks ? `${total}/${h.target} today` : `max ${h.target} ${h.unit}`}
            {done && <b className="px-clear">CLEAR!</b>}
          </p>
        </div>
        <Streak n={streakOf(h, total)} lit={done} />
        {ticks && h.target === 1 && tickRow}
      </div>

      {ticks ? h.target > 1 && tickRow : <Counter habit={h} total={total} set={set} />}
    </section>
  )
}

function Counter({ habit: h, total, set }: { habit: Habit; total: number; set: (v: number) => void }) {
  const segs = 11
  const filled = Math.min(segs, Math.ceil((total / h.target) * segs))
  const over = total > h.target
  return (
    <>
      <div className="px-counter">
        <button className="px-btn" disabled={total === 0} onClick={() => set(total - h.step)}>
          -{h.step}
        </button>
        <div className="px-readout">
          <b>{total}</b>
          <span>{over ? 'OVER!' : `${h.target - total} left`}</span>
        </div>
        <button className="px-btn" onClick={() => set(total + h.step)}>
          +{h.step}
        </button>
      </div>
      <div className={`px-bar ${over ? 'over' : ''}`}>
        {Array.from({ length: segs }, (_, i) => (
          <i key={i} className={i < filled ? 'on' : ''} />
        ))}
      </div>
    </>
  )
}

function NeleRow({ habit: h, total, tap }: { habit: Habit; total: number; tap: () => void }) {
  const done = isDone(h, total)
  const segs = h.direction === 'at_least' ? h.target : 6
  const filled = h.direction === 'at_least' ? total : Math.ceil((total / h.target) * segs)
  return (
    <button className={`px-nrow ${done ? 'done' : ''}`} onClick={tap}>
      <span className="px-nemoji">{h.emoji}</span>
      <span className="px-nname">{h.name}</span>
      <span className="px-mini">
        {Array.from({ length: segs }, (_, i) => (
          <i key={i} className={i < filled ? 'on' : ''} />
        ))}
      </span>
      <span className="px-nstat">{done ? '✓' : h.direction === 'at_least' ? `${total}/${h.target}` : total ? total : '–'}</span>
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
    <div className="px-scrim" onClick={close}>
      <div className="px-sheet" role="dialog" aria-label="New habit" onClick={(e) => e.stopPropagation()}>
        <div className="px-sheet-head">
          <h2>NEW QUEST</h2>
          <button className="px-btn small" onClick={close} aria-label="Close">
            ✕
          </button>
        </div>

        <label className="px-label">NAME</label>
        <input className="px-input" value={name} placeholder="e.g. Read 10 pages" onChange={(e) => setName(e.target.value)} />

        <label className="px-label">ICON</label>
        <div className="px-emojis">
          {EMOJI.map((e) => (
            <button key={e} className={e === emoji ? 'on' : ''} onClick={() => setEmoji(e)}>
              {e}
            </button>
          ))}
        </div>

        <label className="px-label">GOAL</label>
        <div className="px-seg">
          <button className={dir === 'at_least' ? 'on' : ''} onClick={() => setDir('at_least')}>
            AT LEAST
          </button>
          <button className={dir === 'at_most' ? 'on' : ''} onClick={() => setDir('at_most')}>
            AT MOST
          </button>
        </div>

        <div className="px-pair">
          <div>
            <label className="px-label">TARGET</label>
            <Stepper value={target} dec={() => setTarget(Math.max(step, target - step))} inc={() => setTarget(target + step)} />
          </div>
          <div>
            <label className="px-label">STEP</label>
            <Stepper
              value={step}
              dec={() => setStep(STEPS[Math.max(0, stepIdx - 1)])}
              inc={() => setStep(STEPS[Math.min(STEPS.length - 1, stepIdx + 1)])}
            />
          </div>
        </div>

        <label className="px-label">EVERY</label>
        <div className="px-seg">
          <button className={period === 'day' ? 'on' : ''} onClick={() => setPeriod('day')}>
            DAY
          </button>
          <button className={period === 'week' ? 'on' : ''} onClick={() => setPeriod('week')}>
            WEEK
          </button>
        </div>

        <p className="px-preview">
          {emoji} {name || 'New habit'}: {dir === 'at_least' ? 'at least' : 'at most'} {target} per {period}, +{step} a tap
        </p>

        <button className="px-btn go" onClick={close}>
          START QUEST ▶
        </button>
      </div>
    </div>
  )
}

function Stepper({ value, dec, inc }: { value: number; dec: () => void; inc: () => void }) {
  return (
    <div className="px-stepper">
      <button className="px-btn small" onClick={dec}>
        -
      </button>
      <b>{value}</b>
      <button className="px-btn small" onClick={inc}>
        +
      </button>
    </div>
  )
}

const CONFETTI = Array.from({ length: 36 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: -((i * 0.37) % 2.5),
  dur: 1.6 + ((i * 13) % 10) / 10,
  color: [C.sun, C.tomato, C.grass, C.plum, C.sky, C.cream][i % 6],
}))

function Celebration({ close }: { close: () => void }) {
  return (
    <div className="px-party" onClick={close}>
      {CONFETTI.map((c, i) => (
        <i
          key={i}
          className="px-confetti"
          style={{ left: `${c.left}%`, background: c.color, animationDelay: `${c.delay}s`, animationDuration: `${c.dur}s` }}
        />
      ))}
      <p className="px-kicker">TUESDAY · DAY COMPLETE</p>
      <h2 className="px-clear-title">
        STAGE
        <br />
        CLEAR!
      </h2>
      <div className="px-trophy">
        <Sprite rows={TROPHY} colors={{ y: C.sun, w: C.cream, k: C.cream }} px={8} />
      </div>
      <div className="px-duo">
        <div className="px-jump">
          <Sprite rows={TONY_FACE} colors={tonyColors} px={8} />
          <span>TONY</span>
        </div>
        <span className="px-heart">♥</span>
        <div className="px-jump late">
          <Sprite rows={NELE_FACE} colors={neleColors} px={8} />
          <span>NELE</span>
        </div>
      </div>
      <p className="px-bonus">ALL 6 HABITS DONE · +1 TEAM DAY</p>
      <button className="px-btn go" onClick={close}>
        CONTINUE ▶
      </button>
      <p className="px-blink">PRESS START TO PLAY AGAIN TOMORROW</p>
    </div>
  )
}
