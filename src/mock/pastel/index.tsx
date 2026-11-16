import { useState } from 'react'
import type { CSSProperties } from 'react'
import '@fontsource-variable/nunito'
import './pastel.css'
import { isDone, nele, today, tony } from '../data'
import type { Habit, Person } from '../data'

type Totals = Record<string, number>

const tints = ['lilac', 'mint', 'peach']
const all = [...tony.habits, ...nele.habits]
const seed: Totals = Object.fromEntries(all.map((h) => [h.id, h.total]))

const fmt = (n: number) => n.toLocaleString('en-US')

function doneCount(p: Person, totals: Totals) {
  return p.habits.filter((h) => isDone(h, totals[h.id])).length
}

export default function Pastel() {
  const [totals, setTotals] = useState(seed)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const allDone = all.every((h) => isDone(h, totals[h.id]))

  function set(id: string, value: number) {
    const next = { ...totals, [id]: Math.max(0, value) }
    setTotals(next)
    if (!all.every((h) => isDone(h, next[h.id]))) setDismissed(false)
  }

  // Demo-only: Nele's side cycles forward so the celebration is reachable from Tony's phone.
  function nudge(h: Habit) {
    const t = totals[h.id]
    const cap = h.direction === 'at_least' ? h.target : Math.min(h.target, h.step * 4)
    set(h.id, t >= cap ? 0 : t + h.step)
  }

  return (
    <div className="pastel">
      <header className="p-head">
        <div>
          <p className="p-weekday">{today.toLocaleDateString('en-GB', { weekday: 'long' })}</p>
          <h1>{today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</h1>
        </div>
        <div className="p-duo">
          <Avatar person={tony} totals={totals} tint="mint" />
          <Avatar person={nele} totals={totals} tint="pink" />
        </div>
      </header>

      <section>
        <h2>
          Your day <span>{doneCount(tony, totals)} of {tony.habits.length} done</span>
        </h2>
        {tony.habits.map((h, i) => (
          <HabitCard key={h.id} habit={h} total={totals[h.id]} tint={tints[i % 3]} onSet={(v) => set(h.id, v)} />
        ))}
      </section>

      <section>
        <h2>
          Nele today <span>tap to nudge (demo)</span>
        </h2>
        <div className="p-card p-nele">
          {nele.habits.map((h) => {
            const t = totals[h.id]
            const done = isDone(h, t)
            return (
              <button key={h.id} className={`p-chip${done ? ' is-done' : ''}`} onClick={() => nudge(h)}>
                <span className="p-chip-emoji">{h.emoji}</span>
                <span className="p-chip-name">{h.name}</span>
                <span className="p-chip-val" key={t}>
                  {done ? '✓' : h.direction === 'at_most' ? `${t} ${h.unit ?? ''}` : `${t}/${h.target}`}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <button className="p-fab" onClick={() => setSheetOpen(true)} aria-label="Add habit">
        +
      </button>

      {sheetOpen && <AddSheet onClose={() => setSheetOpen(false)} />}
      {allDone && !dismissed && <Celebration onClose={() => setDismissed(true)} />}
    </div>
  )
}

function Avatar({ person, totals, tint }: { person: Person; totals: Totals; tint: string }) {
  const pct = (doneCount(person, totals) / person.habits.length) * 100
  return (
    <div className={`p-avatar ${tint}`} style={{ '--p-pct': `${pct}%` } as CSSProperties}>
      <span>{person.name[0]}</span>
    </div>
  )
}

function HabitCard({ habit: h, total, tint, onSet }: { habit: Habit; total: number; tint: string; onSet: (v: number) => void }) {
  const done = isDone(h, total)
  const over = h.direction === 'at_most' && total > h.target
  const pct = Math.min(100, (total / h.target) * 100)
  const kind = h.direction === 'at_most' || h.target > 5 ? 'stepper' : h.target === 1 ? 'check' : 'dots'

  return (
    <div className={`p-card p-habit ${tint}${done ? ' is-done' : ''}${over ? ' is-over' : ''}`}>
      <div className="p-blob">{h.emoji}</div>
      <div className="p-body">
        <div className="p-name">{h.name}</div>
        <div className="p-meta">
          <span className="p-streak">{h.streak > 0 ? `🔥 ${h.streak} days` : '🌱 new streak'}</span>
          <span className="p-count" key={total}>
            {h.direction === 'at_most' ? `${fmt(total)} / ${fmt(h.target)} ${h.unit ?? ''}` : `${total} / ${h.target}`}
          </span>
        </div>
        <div className="p-track">
          <div className="p-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {kind === 'check' && (
        <button className={`p-check${total > 0 ? ' on' : ''}`} onClick={() => onSet(total > 0 ? 0 : h.step)} aria-label="Tick">
          ✓
        </button>
      )}
      {kind === 'dots' && (
        <div className="p-dots">
          {Array.from({ length: h.target }, (_, i) => (
            <button key={i} className={`p-dot${total > i ? ' on' : ''}`} onClick={() => onSet(total > i ? i : i + 1)} aria-label={`Tick ${i + 1}`}>
              ✓
            </button>
          ))}
        </div>
      )}
      {kind === 'stepper' && (
        <div className="p-stepper">
          <button onClick={() => onSet(total - h.step)} disabled={total === 0} aria-label={`Minus ${h.step}`}>
            −
          </button>
          <button onClick={() => onSet(total + h.step)} aria-label={`Plus ${h.step}`}>
            +{h.step}
          </button>
        </div>
      )}
    </div>
  )
}

const emojis = ['🧘', '🏃', '📚', '💧', '🥦', '😴', '🎸', '🌿']

function AddSheet({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(emojis[0])
  const [target, setTarget] = useState(1)
  const [direction, setDirection] = useState<Habit['direction']>('at_least')
  const [period, setPeriod] = useState<Habit['period']>('day')
  const [step, setStep] = useState(1)

  return (
    <div className="p-overlay" onClick={onClose}>
      <div className="p-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="p-grabber" />
        <h3>New habit</h3>

        <label className="p-field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Morning stretch" />
        </label>

        <div className="p-field">
          <span>Emoji</span>
          <div className="p-emojis">
            {emojis.map((e) => (
              <button key={e} className={e === emoji ? 'on' : ''} onClick={() => setEmoji(e)}>
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="p-field">
          <span>Goal</span>
          <Segmented value={direction} onChange={setDirection} options={[['at_least', 'At least'], ['at_most', 'At most']]} />
        </div>

        <div className="p-row">
          <Stepper label="Target" value={target} onChange={setTarget} min={1} />
          <Stepper label="Step" value={step} onChange={setStep} min={1} />
        </div>

        <div className="p-field">
          <span>Every</span>
          <Segmented value={period} onChange={setPeriod} options={[['day', 'Day'], ['week', 'Week']]} />
        </div>

        <div className="p-actions">
          <button className="p-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="p-primary" onClick={onClose}>
            {emoji} Add habit
          </button>
        </div>
      </div>
    </div>
  )
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="p-seg">
      {options.map(([v, label]) => (
        <button key={v} className={v === value ? 'on' : ''} onClick={() => onChange(v)}>
          {label}
        </button>
      ))}
    </div>
  )
}

function Stepper({ label, value, onChange, min }: { label: string; value: number; onChange: (v: number) => void; min: number }) {
  return (
    <div className="p-field">
      <span>{label}</span>
      <div className="p-mini">
        <button onClick={() => onChange(Math.max(min, value - 1))}>−</button>
        <b key={value}>{value}</b>
        <button onClick={() => onChange(value + 1)}>+</button>
      </div>
    </div>
  )
}

const confettiColors = ['#ffc8dd', '#cdb4ff', '#b8f0d8', '#ffd6c2', '#fff1b8', '#bde0fe']

function Celebration({ onClose }: { onClose: () => void }) {
  return (
    <div className="p-celebrate" onClick={onClose}>
      {Array.from({ length: 36 }, (_, i) => (
        <i
          key={i}
          style={
            {
              '--x': `${(i * 37) % 100}%`,
              '--d': `${(i * 0.13) % 1.6}s`,
              '--t': `${2.6 + ((i * 7) % 10) / 6}s`,
              '--r': `${(i * 53) % 360}deg`,
              background: confettiColors[i % confettiColors.length],
              borderRadius: i % 3 === 0 ? '50%' : '4px',
            } as CSSProperties
          }
        />
      ))}
      <div className="p-cel-card" onClick={(e) => e.stopPropagation()}>
        <div className="p-cel-duo">
          <div className="p-avatar mint big">
            <span>T</span>
          </div>
          <div className="p-cel-five">🙌</div>
          <div className="p-avatar pink big">
            <span>N</span>
          </div>
        </div>
        <h3>You both did it!</h3>
        <p>Tony and Nele finished every habit today. Streaks are safe for another day 🌸</p>
        <button className="p-primary" onClick={onClose}>
          Yay, close
        </button>
      </div>
    </div>
  )
}
