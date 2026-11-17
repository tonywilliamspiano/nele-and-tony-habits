import '@fontsource/dotgothic16/400.css'
import '@fontsource/press-start-2p/400.css'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { type Habit, isDone, nele, today, tony } from '../data'
import './jrpg.css'

const TONY = [
  '...kkkkkk...',
  '..kHHhhhhk..',
  '.khHhhhhhhk.',
  '.krrrrrrrrk.',
  '.khsssssshk.',
  '.ksessssesk.',
  '.kssssssssk.',
  '..kssmmssk..',
  '...kSSSSk...',
  '..kccCCcck..',
  '.kcccCCccck.',
  '.kcccccccck.',
]
const NELE = [
  '...kkkkkk...',
  '..kyyYYyyk..',
  '.kyYyyyyyyk.',
  '.kyyyyyyyyk.',
  '.kyssssssyk.',
  '.kysessesyk.',
  '.kyssssssyk.',
  '.kyssmmssyk.',
  '.kyySSSSyyk.',
  '.kyppPPppyk.',
  '..kppPPppk..',
  '.kppppppppk.',
]
const skin = { k: '#1a1033', s: '#f6c08f', S: '#d9946a', e: '#1a1033', m: '#c2453f' }
const tonyColors = { ...skin, h: '#4a2c1a', H: '#8a5a32', r: '#e03c3c', c: '#3b6fd8', C: '#7fa6ff' }
const neleColors = { ...skin, y: '#f2c84b', Y: '#fff1a0', p: '#9a4fd0', P: '#d29af5' }

function Sprite({ rows, colors, px }: { rows: string[]; colors: Record<string, string>; px: number }) {
  return (
    <svg width={rows[0].length * px} height={rows.length * px} viewBox={`0 0 ${rows[0].length} ${rows.length}`} shapeRendering="crispEdges" aria-hidden>
      {rows.flatMap((r, y) => [...r].map((c, x) => colors[c] && <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={colors[c]} />))}
    </svg>
  )
}

const all = [...tony.habits, ...nele.habits]
const seed = Object.fromEntries(all.map((h) => [h.id, h.total]))
const doneCount = (habits: Habit[], t: Record<string, number>) => habits.filter((h) => isDone(h, t[h.id])).length
const allDone = (t: Record<string, number>) => doneCount(all, t) === all.length

// Seed streaks already include today when the seed total is done.
const streakOf = (h: Habit, total: number) => h.streak - (isDone(h, h.total) ? 1 : 0) + (isDone(h, total) ? 1 : 0)

function say(who: string, h: Habit, prev: number, v: number) {
  if (h.direction === 'at_most' && v > h.target) return `${who} is ${v - h.target} ${h.unit} over the ${h.name} limit!`
  if (isDone(h, v) && !isDone(h, prev)) return `${who} cleared ${h.name}! Chain grows to ${streakOf(h, v)}.`
  if (h.unit) return v > prev ? `${who} logged ${v - prev} ${h.unit}. ${h.target - v} left today.` : `${who} took back ${prev - v} ${h.unit}.`
  return v > prev ? `${who} used ${h.name}! ${v}/${h.target} today.` : `${who} cancelled ${h.name}. ${v}/${h.target} today.`
}

type Pop = { id: number; habit: string; text: string; kind: string }

export default function Jrpg() {
  const [totals, setTotals] = useState(seed)
  const [cursor, setCursor] = useState('t2')
  const [msg, setMsg] = useState({ id: 0, text: 'Good morning, Tony! The party has 3 quests left today.' })
  const [pops, setPops] = useState<Pop[]>([])
  const [sheet, setSheet] = useState(false)
  const [victory, setVictory] = useState(false)
  const nextId = useRef(1)

  function log(who: string, h: Habit, value: number) {
    const prev = totals[h.id]
    const v = Math.max(0, value)
    const next = { ...totals, [h.id]: v }
    const id = nextId.current++
    const d = v - prev
    setTotals(next)
    if (who === 'Tony') setCursor(h.id)
    setMsg({ id, text: say(who, h, prev, v) })
    setPops((p) => [...p.filter((x) => x.habit !== h.id), { id, habit: h.id, text: `${d > 0 ? '+' : ''}${d}${h.unit ? ` ${h.unit}` : ''}`, kind: h.unit ? (d > 0 ? 'dmg' : 'heal') : d > 0 ? 'gain' : 'miss' }])
    setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 1000)
    if (!allDone(totals) && allDone(next)) setTimeout(() => setVictory(true), 700)
  }

  const left = all.length - doneCount(all, totals)
  const popsFor = (id: string) => pops.filter((p) => p.habit === id).map((p) => <b key={p.id} className={`rpg-pop ${p.kind}`}>{p.text}</b>)

  return (
    <div className="rpg">
      <header className="rpg-top">
        <div>
          <p className="rpg-kicker">HABIT QUEST · DAY {today.getDate()}</p>
          <h1 className="rpg-day">{today.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase()}</h1>
          <p className="rpg-date">{today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        {left ? (
          <div className="rpg-win rpg-left">
            <b>{left}</b>
            <span>QUESTS
              <br />
              LEFT
            </span>
          </div>
        ) : (
          <button className="rpg-cmd gold" onClick={() => setVictory(true)}>★ VICTORY</button>
        )}
      </header>

      <section className="rpg-win rpg-party">
        <span className="rpg-tab">PARTY</span>
        <Member sprite={TONY} colors={tonyColors} name="Tony" cls="Monk · you" done={doneCount(tony.habits, totals)} of={tony.habits.length} />
        <Member sprite={NELE} colors={neleColors} name="Nele" cls="Scribe" done={doneCount(nele.habits, totals)} of={nele.habits.length} />
        <div className="rpg-allies">
          {nele.habits.map((h) => (
            <AllyChip key={h.id} habit={h} total={totals[h.id]} tap={() => log('Nele', h, nextNele(h, totals[h.id]))}>
              {popsFor(h.id)}
            </AllyChip>
          ))}
        </div>
        <p className="rpg-hint">demo: tap Nele's quests to act for her</p>
      </section>

      <section className="rpg-win rpg-log">
        <span className="rpg-tab">QUEST LOG</span>
        <button className="rpg-cmd rpg-new" onClick={() => setSheet(true)}>+ NEW</button>
        {tony.habits.map((h) => (
          <Quest key={h.id} habit={h} total={totals[h.id]} cursor={cursor === h.id} set={(v) => log('Tony', h, v)}>
            {popsFor(h.id)}
          </Quest>
        ))}
      </section>

      <div className="rpg-win rpg-textbox">
        <Typewriter key={msg.id} text={msg.text} />
      </div>

      {sheet && <AddSheet close={() => setSheet(false)} />}
      {victory && <Victory totals={totals} close={() => setVictory(false)} />}
    </div>
  )
}

function nextNele(h: Habit, total: number) {
  if (h.direction === 'at_least') return total >= h.target ? 0 : total + h.step
  return total + h.step > h.target ? 0 : total + h.step
}

function Typewriter({ text }: { text: string }) {
  const [n, setN] = useState(0)
  const done = n >= text.length
  useEffect(() => {
    if (done) return
    const t = setInterval(() => setN((x) => x + 1), 24)
    return () => clearInterval(t)
  }, [done])
  return (
    <p className="rpg-type">
      {text.slice(0, n)}
      {done && <span className="rpg-more">▼</span>}
    </p>
  )
}

function Member(p: { sprite: string[]; colors: Record<string, string>; name: string; cls: string; done: number; of: number }) {
  const full = p.done === p.of
  return (
    <div className="rpg-member">
      <div className={`rpg-portrait ${full ? 'full' : ''}`}>
        <Sprite rows={p.sprite} colors={p.colors} px={3} />
      </div>
      <div>
        <div className="rpg-mname">
          <b>{p.name}</b>
          <small>{p.cls}</small>
          {full && <em className="rpg-clear">CLEAR!</em>}
        </div>
        <div className="rpg-hp">
          <span>HP</span>
          <div className="rpg-bar">
            <i style={{ width: `${(p.done / p.of) * 100}%` }} />
          </div>
          <b>
            {p.done}/{p.of}
          </b>
        </div>
      </div>
    </div>
  )
}

function Quest({ habit: h, total, cursor, set, children }: { habit: Habit; total: number; cursor: boolean; set: (v: number) => void; children: ReactNode }) {
  const done = isDone(h, total)
  const streak = streakOf(h, total)
  const gems = (
    <div className="rpg-gems">
      {Array.from({ length: h.target }, (_, i) => (
        <button key={`${i}-${i < total}`} className={`rpg-gem ${i < total ? 'on' : ''}`} aria-label={`tick ${i + 1}`} onClick={() => set(i < total ? i : i + 1)} />
      ))}
    </div>
  )
  return (
    <div className={`rpg-quest ${done ? 'done' : ''} ${h.target === 1 ? 'single' : ''}`}>
      {cursor && <span className="rpg-cursor">▶</span>}
      <div className="rpg-qhead">
        <span className="rpg-qemoji">{h.emoji}</span>
        <div className="rpg-qname">
          <b>{h.name}</b>
          <small>
            {h.direction === 'at_least' ? `${total}/${h.target} today` : `max ${h.target} ${h.unit}`}
            {done && <em className="rpg-clear">CLEAR!</em>}
          </small>
        </div>
        <span className={`rpg-chain ${done ? '' : 'cold'}`} title={`${streak} day chain`}>
          🔥{streak}
        </span>
        {h.direction === 'at_least' && h.target === 1 && gems}
      </div>
      {h.direction === 'at_least' ? (
        h.target > 1 && <div className="rpg-qctl">{gems}</div>
      ) : (
        <div className="rpg-qctl">
          <button className="rpg-cmd" disabled={total === 0} onClick={() => set(total - h.step)}>
            -{h.step}
          </button>
          <div className={`rpg-meter ${total > h.target ? 'over' : ''}`}>
            <i style={{ width: `${Math.min(100, (total / h.target) * 100)}%` }} />
            <span>
              {total} / {h.target}
            </span>
          </div>
          <button className="rpg-cmd" onClick={() => set(total + h.step)}>
            +{h.step}
          </button>
        </div>
      )}
      {children}
    </div>
  )
}

function AllyChip({ habit: h, total, tap, children }: { habit: Habit; total: number; tap: () => void; children: ReactNode }) {
  const done = isDone(h, total)
  return (
    <button className={`rpg-chip ${done ? 'done' : ''}`} onClick={tap} title={h.name}>
      <span className="rpg-chip-emoji">{h.emoji}</span>
      <span className="rpg-chip-stat">{done ? '✓' : h.direction === 'at_least' ? `${total}/${h.target}` : total ? total : '–'}</span>
      {children}
    </button>
  )
}

const EMOJI = ['🏃', '📚', '🥦', '💧', '🧘', '🎸', '😴', '🚭']
const STEPS = [1, 5, 10, 15, 25, 50, 100]

function Options<T extends string>({ value, set, opts }: { value: T; set: (v: T) => void; opts: [T, string][] }) {
  return (
    <div className="rpg-opts">
      {opts.map(([v, label]) => (
        <button key={v} className={v === value ? 'on' : ''} onClick={() => set(v)}>
          <span className="rpg-hand">{v === value ? '▶' : ''}</span>
          {label}
        </button>
      ))}
    </div>
  )
}

function Stepper({ value, dec, inc }: { value: number; dec: () => void; inc: () => void }) {
  return (
    <div className="rpg-stepper">
      <button className="rpg-cmd" onClick={dec} aria-label="less">-</button>
      <b>{value}</b>
      <button className="rpg-cmd" onClick={inc} aria-label="more">+</button>
    </div>
  )
}

function AddSheet({ close }: { close: () => void }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(EMOJI[0])
  const [dir, setDir] = useState<'at_least' | 'at_most'>('at_least')
  const [period, setPeriod] = useState<'day' | 'week'>('day')
  const [step, setStep] = useState(1)
  const [target, setTarget] = useState(1)
  const si = STEPS.indexOf(step)

  return (
    <div className="rpg-scrim" onClick={close}>
      <div className="rpg-win rpg-sheet" role="dialog" aria-label="New habit" onClick={(e) => e.stopPropagation()}>
        <span className="rpg-tab">NEW QUEST</span>
        <label className="rpg-field">
          <span>NAME</span>
          <input className="rpg-input" value={name} placeholder="e.g. Read 10 pages" onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="rpg-field">
          <span>ICON</span>
          <div className="rpg-emojis">
            {EMOJI.map((e) => (
              <button key={e} className={e === emoji ? 'on' : ''} onClick={() => setEmoji(e)}>
                {e}
              </button>
            ))}
          </div>
        </div>
        <div className="rpg-field">
          <span>GOAL</span>
          <Options value={dir} set={setDir} opts={[['at_least', 'At least'], ['at_most', 'At most']]} />
        </div>
        <div className="rpg-field">
          <span>TARGET</span>
          <Stepper value={target} dec={() => setTarget(Math.max(step, target - step))} inc={() => setTarget(target + step)} />
        </div>
        <div className="rpg-field">
          <span>EVERY</span>
          <Options value={period} set={setPeriod} opts={[['day', 'Day'], ['week', 'Week']]} />
        </div>
        <div className="rpg-field">
          <span>STEP</span>
          <Stepper value={step} dec={() => setStep(STEPS[Math.max(0, si - 1)])} inc={() => setStep(STEPS[Math.min(STEPS.length - 1, si + 1)])} />
        </div>
        <p className="rpg-preview">
          {emoji} {name || 'New quest'}: {dir === 'at_least' ? 'at least' : 'at most'} {target} per {period}, +{step} a tap
        </p>
        <div className="rpg-actions">
          <button className="rpg-cmd" onClick={close}>CANCEL</button>
          <button className="rpg-cmd gold" onClick={close}>▶ ACCEPT</button>
        </div>
      </div>
    </div>
  )
}

const SPARKS = Array.from({ length: 14 }, (_, i) => ({ left: (i * 41) % 96, top: (i * 29) % 70, delay: (i % 5) * 0.3 }))

function Victory({ totals, close }: { totals: Record<string, number>; close: () => void }) {
  const best = all.reduce((a, h) => (streakOf(h, totals[h.id]) > streakOf(a, totals[a.id]) ? h : a))
  return (
    <div className="rpg-victory" onClick={close}>
      <div className="rpg-rays" />
      {SPARKS.map((s, i) => (
        <span key={i} className="rpg-spark" style={{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s` }}>
          ✦
        </span>
      ))}
      <h2 className="rpg-vtitle">VICTORY!</h2>
      <div className="rpg-vparty">
        <div className="rpg-hop">
          <Sprite rows={TONY} colors={tonyColors} px={6} />
          <span>Tony</span>
        </div>
        <div className="rpg-hop late">
          <Sprite rows={NELE} colors={neleColors} px={6} />
          <span>Nele</span>
        </div>
      </div>
      <div className="rpg-win rpg-spoils">
        <span className="rpg-tab">RESULTS</span>
        <p>Party cleared the day!</p>
        <dl>
          <dt>Quests cleared</dt>
          <dd>{all.length}/{all.length}</dd>
          <dt>EXP gained</dt>
          <dd>+{all.length * 100}</dd>
          <dt>Longest chain · {best.name}</dt>
          <dd>🔥{streakOf(best, totals[best.id])}</dd>
        </dl>
      </div>
      <div className="rpg-win rpg-vtext">
        <Typewriter text="Tony and Nele grew stronger! New quests appear at dawn." />
      </div>
      <button className="rpg-cmd gold" onClick={close}>
        ▶ CONTINUE
      </button>
    </div>
  )
}
