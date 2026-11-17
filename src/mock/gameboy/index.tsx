import '@fontsource/press-start-2p/400.css'
import '@fontsource/silkscreen/400.css'
import '@fontsource/silkscreen/700.css'
import '@fontsource/dotgothic16/400.css'
import { type CSSProperties, useState } from 'react'
import { type Habit, isDone, nele, today, tony } from '../data'
import './gameboy.css'

// The whole device, LCD and housing alike, uses only these four shades.
const C = { g0: '#d3e09c', g1: '#9db25c', g2: '#4f6e31', g3: '#15301a' }
const TONES = {
  normal: { w: C.g0, l: C.g1, d: C.g2, k: C.g3 },
  dim: { w: C.g0, l: C.g1, d: C.g1, k: C.g2 },
  inv: { w: C.g3, l: C.g2, d: C.g1, k: C.g0 },
}

const TONY = ['..kkkk..', '.kkkkkk.', 'kkwwwwkk', 'kwkwwkwk', 'kwwwwwwk', 'kwwddwwk', '.kwwwwk.', '..kkkk..', '.dddddd.']
const NELE = ['..dddd..', '.dddddd.', 'ddwwwwdd', 'dwkwwkwd', 'dwwwwwwd', 'dwwkkwwd', 'dwwwwwwd', 'd.kkkk.d', '.kkkkkk.']
const HEART = ['.kk.kk.', 'kkkkkkk', 'kkkkkkk', '.kkkkk.', '..kkk..', '...k...']
const HEART_EMPTY = ['.kk.kk.', 'k..k..k', 'k.....k', '.k...k.', '..k.k..', '...k...']
const FLAME = ['...k...', '..kk...', '..kkk.k', '.kkdkkk', '.kdddkk', 'kkdwdkk', 'kdwwwdk', '.kkkkk.']
const CHECK = ['......k', '.....kk', 'k...kk.', 'kk.kk..', '.kkk...', '..k....']
const TROPHY = ['kkkkkkkkk', 'k.kkwkk.k', 'k.kkwkk.k', '.kkkkkkk.', '..kkkkk..', '...kkk...', '....k....', '...kkk...', '..kkkkk..']
const FLAG = ['k.......', 'kkkkk...', 'kkkkkkk.', 'kkkkkkkk', 'kkkkkkk.', 'kkkkk...', 'k.......', 'k.......', 'k.......', 'kk......']
const STAR = ['...k...', '...k...', 'kkkkkkk', '.kkkkk.', '..kkk..', '.kk.kk.', 'kk...kk']

type Tone = keyof typeof TONES

function Sprite({ rows, px = 3, tone = 'normal', className }: { rows: string[]; px?: number; tone?: Tone; className?: string }) {
  const shade: Record<string, string> = TONES[tone]
  return (
    <svg
      className={className}
      width={rows[0].length * px}
      height={rows.length * px}
      viewBox={`0 0 ${rows[0].length} ${rows.length}`}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {rows.flatMap((r, y) =>
        [...r].map((c, x) => (shade[c] ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={shade[c]} /> : null)),
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
const isNele = (h: Habit) => nele.habits.includes(h)

const weekday = today.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase()
const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()

export default function Gameboy() {
  const [totals, setTotals] = useState(seed)
  const [cursor, setCursor] = useState(0)
  const [sheet, setSheet] = useState(false)
  const [party, setParty] = useState(false)
  const [msg, setMsg] = useState('PRESS A TO LOG · B TO UNDO')

  function set(h: Habit, value: number) {
    const v = Math.max(0, value)
    const old = totals[h.id]
    if (v === old) return setMsg('BZZT! NOTHING TO UNDO')
    const next = { ...totals, [h.id]: v }
    setTotals(next)
    const who = isNele(h) ? 'NELE: ' : ''
    if (isDone(h, v) && !isDone(h, old)) setMsg(`DING! ${who}${h.name.toUpperCase()} CLEAR!`)
    else if (v > old) setMsg(`BLIP! ${who}${h.name.toUpperCase()} +${v - old}`)
    else setMsg(`BOOP. ${who}${h.name.toUpperCase()} -${old - v}`)
    if (!allDone(totals) && allDone(next)) setParty(true)
  }

  // A/B act on the habit under the cursor: one step up (capped at target for ticks) or down.
  function press(dir: 1 | -1) {
    if (party) return setParty(false)
    if (sheet) return setSheet(false)
    const h = all[cursor]
    const t = totals[h.id]
    if (dir === 1 && h.direction === 'at_least' && t >= h.target) return setMsg('MAXED OUT! B TO UNDO')
    set(h, t + dir * h.step)
  }

  function start() {
    if (allDone(totals)) return setParty(true)
    setMsg(`NOT YET! ${all.length - doneCount(all, totals)} QUESTS LEFT`)
  }

  const vars = { '--g0': C.g0, '--g1': C.g1, '--g2': C.g2, '--g3': C.g3 } as CSSProperties
  const cleared = allDone(totals)

  return (
    <div className="gb" style={vars}>
      <div className="gb-bezel">
        <div className="gb-bezel-top">
          <span className={`gb-led ${cleared ? 'party' : ''}`} />
          <span className="gb-bezel-label">POWER</span>
          <span className="gb-rule" />
          <span className="gb-bezel-label">DUO·QUEST 4-SHADE</span>
          <span className="gb-rule" />
        </div>

        <div className="gb-lcd">
          <div className="gb-screen">
            <div className="gb-dateline">
              <h1>{weekday}</h1>
              <span>{dateStr}</span>
            </div>

            <div className="gb-hud">
              <Player face={TONY} tag="1P" name="TONY" done={doneCount(tony.habits, totals)} of={tony.habits.length} />
              <span className="gb-vs">{cleared ? <Sprite rows={STAR} px={2} /> : 'VS'}</span>
              <Player face={NELE} tag="2P" name="NELE" done={doneCount(nele.habits, totals)} of={nele.habits.length} />
            </div>

            <div className="gb-section">
              <h2>QUEST LOG</h2>
              <button className="gb-chip" onClick={() => setSheet(true)}>
                + NEW
              </button>
            </div>

            {tony.habits.map((h, i) => (
              <Quest key={h.id} habit={h} total={totals[h.id]} set={(v) => set(h, v)} active={cursor === i} select={() => setCursor(i)} />
            ))}

            <div className="gb-section">
              <h2>2P NELE</h2>
              <span className="gb-hint">DEMO · TAP TO LOG FOR HER</span>
            </div>
            <div className="gb-nbox">
              {nele.habits.map((h, i) => (
                <NeleRow
                key={h.id}
                habit={h}
                total={totals[h.id]}
                active={cursor === i + 3}
                tap={() => {
                  setCursor(i + 3)
                  set(h, nextNele(h, totals[h.id]))
                }}
                />
              ))}
            </div>

            <div className="gb-section">
              <h2>TEAM RUN</h2>
              <span className="gb-hint">{doneCount(all, totals)}/6 QUESTS TO THE FLAG</span>
            </div>
            <div className="gb-road">
              <span className="gb-walker" style={{ left: `calc(${doneCount(tony.habits, totals) / 3} * (100% - 80px))` }}>
                <Sprite rows={TONY} px={2} />
              </span>
              <span className="gb-walker nele" style={{ left: `calc(${doneCount(nele.habits, totals) / 3} * (100% - 80px))` }}>
                <Sprite rows={NELE} px={2} />
              </span>
              <Sprite rows={FLAG} px={3} className="gb-flag" />
            </div>
          </div>

          <p className="gb-msg">
            <span key={msg}>{msg}</span>
          </p>

          {sheet && <AddSheet close={() => setSheet(false)} />}
          {party && <Celebration close={() => setParty(false)} />}
          <div className="gb-grid" aria-hidden />
        </div>
      </div>

      <div className="gb-pad">
        <div className="gb-dpad">
          <button className="up" aria-label="Up" onClick={() => setCursor((cursor + all.length - 1) % all.length)} />
          <button className="down" aria-label="Down" onClick={() => setCursor((cursor + 1) % all.length)} />
          <button className="left" aria-label="Left" onClick={() => press(-1)} />
          <button className="right" aria-label="Right" onClick={() => press(1)} />
          <i />
        </div>
        <div className="gb-ab">
          <button className="b" onClick={() => press(-1)}>
            B
          </button>
          <button className="a" onClick={() => press(1)}>
            A
          </button>
          <span className="lb">UNDO</span>
          <span className="la">LOG</span>
        </div>
        <div className="gb-pills">
          <button onClick={() => setSheet(!sheet)}>
            <i />
            NEW
          </button>
          <button onClick={start}>
            <i />
            START
          </button>
        </div>
      </div>
    </div>
  )
}

function nextNele(h: Habit, total: number) {
  if (h.direction === 'at_least') return total >= h.target ? 0 : total + h.step
  return total + h.step > h.target ? 0 : total + h.step
}

function Player(p: { face: string[]; tag: string; name: string; done: number; of: number }) {
  return (
    <div className="gb-player">
      <div className="gb-avatar">
        <Sprite rows={p.face} px={4} className={p.done === p.of ? 'gb-bob' : ''} />
      </div>
      <div>
        <div className="gb-pname">
          <b>{p.tag}</b> {p.name}
        </div>
        <div className="gb-hearts">
          {Array.from({ length: p.of }, (_, i) => (
            <Sprite key={i} rows={i < p.done ? HEART : HEART_EMPTY} px={2} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Quest(p: { habit: Habit; total: number; set: (v: number) => void; active: boolean; select: () => void }) {
  const { habit: h, total, set } = p
  const done = isDone(h, total)
  const ticks = h.direction === 'at_least'
  return (
    <section className={`gb-quest ${done ? 'done' : ''} ${p.active ? 'active' : ''}`} onPointerDown={p.select}>
      <span className="gb-cursor">▶</span>
      <span className="gb-emoji">
        <span>{h.emoji}</span>
      </span>
      <div className="gb-qtitle">
        <h3>{h.name}</h3>
        <p>
          {ticks ? `${total}/${h.target} TODAY` : `MAX ${h.target} ${h.unit?.toUpperCase()}`}
          {done && <b className="gb-clear">CLEAR!</b>}
        </p>
      </div>
      <span className={`gb-streak ${done ? 'lit' : ''}`}>
        <Sprite rows={FLAME} px={2} tone={done ? 'normal' : 'dim'} />
        {streakOf(h, total)}
      </span>
      {ticks ? (
        <div className="gb-ticks">
          {Array.from({ length: h.target }, (_, i) => (
            <button
              key={`${i}-${i < total}`}
              className={`gb-tick ${i < total ? 'on' : ''}`}
              aria-label={`tick ${i + 1}`}
              onClick={() => set(i < total ? i : i + 1)}
            >
              {i < total && <Sprite rows={CHECK} px={3} />}
            </button>
          ))}
        </div>
      ) : (
        <Counter habit={h} total={total} set={set} />
      )}
    </section>
  )
}

function Counter({ habit: h, total, set }: { habit: Habit; total: number; set: (v: number) => void }) {
  const segs = 22
  const filled = Math.min(segs, Math.round((total / h.target) * segs))
  const over = total > h.target
  return (
    <div className="gb-counter">
      <button className="gb-key" disabled={total === 0} onClick={() => set(total - h.step)}>
        ◀ -{h.step}
      </button>
      <div className="gb-readout">
        <b>{String(total).padStart(4, '0')}</b>
        <div className={`gb-bar ${over ? 'over' : ''}`}>
          {Array.from({ length: segs }, (_, i) => (
            <i key={i} className={i < filled ? 'on' : ''} />
          ))}
        </div>
        <span>{over ? 'OVER LIMIT!' : `${h.target - total} LEFT`}</span>
      </div>
      <button className="gb-key" onClick={() => set(total + h.step)}>
        +{h.step} ▶
      </button>
    </div>
  )
}

function NeleRow({ habit: h, total, tap, active }: { habit: Habit; total: number; tap: () => void; active: boolean }) {
  const done = isDone(h, total)
  const segs = h.direction === 'at_least' ? h.target : 8
  const filled = h.direction === 'at_least' ? total : Math.ceil((total / h.target) * segs)
  return (
    <button className={`gb-nrow ${done ? 'done' : ''} ${active ? 'active' : ''}`} onClick={tap}>
      <span className="gb-cursor">▶</span>
      <span className="gb-emoji small">
        <span>{h.emoji}</span>
      </span>
      <span className="gb-nname">{h.name}</span>
      <span className="gb-mini">
        {Array.from({ length: segs }, (_, i) => (
          <i key={i} className={i < filled ? 'on' : ''} />
        ))}
      </span>
      <span className="gb-nstat">
        {done ? <Sprite rows={CHECK} px={2} /> : h.direction === 'at_least' ? `${total}/${h.target}` : total ? total : '--'}
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
    <div className="gb-sheet" role="dialog" aria-label="New habit">
      <div className="gb-sheet-head">
        <h2>NEW QUEST</h2>
        <button className="gb-chip" onClick={close} aria-label="Close">
          ✕
        </button>
      </div>

      <label className="gb-label">NAME</label>
      <input className="gb-input" value={name} placeholder="READ 10 PAGES_" onChange={(e) => setName(e.target.value)} />

      <label className="gb-label">ICON</label>
      <div className="gb-emojis">
        {EMOJI.map((e) => (
          <button key={e} className={`gb-emoji ${e === emoji ? 'on' : ''}`} onClick={() => setEmoji(e)}>
            <span>{e}</span>
          </button>
        ))}
      </div>

      <label className="gb-label">GOAL</label>
      <div className="gb-seg">
        <button className={dir === 'at_least' ? 'on' : ''} onClick={() => setDir('at_least')}>
          AT LEAST
        </button>
        <button className={dir === 'at_most' ? 'on' : ''} onClick={() => setDir('at_most')}>
          AT MOST
        </button>
      </div>

      <div className="gb-pair">
        <div>
          <label className="gb-label">TARGET</label>
          <Stepper value={target} dec={() => setTarget(Math.max(step, target - step))} inc={() => setTarget(target + step)} />
        </div>
        <div>
          <label className="gb-label">STEP</label>
          <Stepper
            value={step}
            dec={() => setStep(STEPS[Math.max(0, stepIdx - 1)])}
            inc={() => setStep(STEPS[Math.min(STEPS.length - 1, stepIdx + 1)])}
          />
        </div>
      </div>

      <label className="gb-label">EVERY</label>
      <div className="gb-seg">
        <button className={period === 'day' ? 'on' : ''} onClick={() => setPeriod('day')}>
          DAY
        </button>
        <button className={period === 'week' ? 'on' : ''} onClick={() => setPeriod('week')}>
          WEEK
        </button>
      </div>

      <p className="gb-preview">
        <span className="gb-emoji small">
          <span>{emoji}</span>
        </span>
        {name || 'New habit'}: {dir === 'at_least' ? 'at least' : 'at most'} {target} per {period}, +{step} a tap
      </p>

      <button className="gb-go" onClick={close}>
        ▶ START QUEST
      </button>
    </div>
  )
}

function Stepper({ value, dec, inc }: { value: number; dec: () => void; inc: () => void }) {
  return (
    <div className="gb-stepper">
      <button className="gb-key" onClick={dec} aria-label="Decrease">
        ◀
      </button>
      <b>{value}</b>
      <button className="gb-key" onClick={inc} aria-label="Increase">
        ▶
      </button>
    </div>
  )
}

const SPARKS = [
  [8, 14],
  [80, 10],
  [16, 52],
  [86, 46],
  [50, 6],
  [10, 82],
  [84, 80],
]

function Celebration({ close }: { close: () => void }) {
  return (
    <div className="gb-party" onClick={close}>
      {SPARKS.map(([x, y], i) => (
        <span key={i} className="gb-spark" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i % 3) * 0.2}s` }}>
          <Sprite rows={STAR} px={3} tone="inv" />
        </span>
      ))}
      <p className="gb-kicker">{weekday} · ALL QUESTS DONE</p>
      <h2 className="gb-clear-title">
        STAGE
        <br />
        CLEAR!
      </h2>
      <Sprite rows={TROPHY} px={7} tone="inv" className="gb-trophy" />
      <div className="gb-duo">
        <div className="gb-jump">
          <Sprite rows={TONY} px={6} tone="inv" />
          <span>TONY</span>
        </div>
        <Sprite rows={HEART} px={4} tone="inv" className="gb-beat" />
        <div className="gb-jump late">
          <Sprite rows={NELE} px={6} tone="inv" />
          <span>NELE</span>
        </div>
      </div>
      <p className="gb-bonus">6/6 HABITS · +1 TEAM DAY</p>
      <p className="gb-blink">PRESS A TO CONTINUE</p>
    </div>
  )
}
