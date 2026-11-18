import '@fontsource/jersey-10/400.css'
import { useEffect, useRef, useState } from 'react'
import {
  type Day,
  type Habit,
  type Log,
  type Pace,
  dayCleared,
  dayPercent,
  dayPlan,
  daysLeftInWeek,
  habitStreak,
  isBusy,
  teamStreak,
  totalOn,
  weekPace,
  weekTotal,
} from '../lib/days'
import { type Person, useGarden } from '../lib/useGarden'
import './garden.css'

const C = {
  ink: '#3a2a22',
  soil: '#7b4b2a',
  wood: '#c88a48',
  cream: '#f7eccb',
  leaf: '#6cb24a',
  moss: '#2f6b3a',
  sky: '#9fd4e6',
  sun: '#f4c542',
  berry: '#d9534a',
  skin: '#f0b48a',
  blond: '#c9a655',
  curl: '#9c7a38',
}

const PLANT = { G: C.moss, g: C.leaf, k: C.ink, y: C.sun, d: C.soil, r: C.berry, c: C.cream, w: C.wood }

// Petal (y) and centre (d) per habit, by position in its owner's list.
const PETALS = [
  [C.sun, C.soil],
  [C.berry, C.sun],
  ['#9a6ad6', C.sun],
  ['#f497b6', C.berry],
  ['#4f9edb', C.cream],
  ['#f08a3a', C.ink],
]
const bloom = (i: number) => ({ ...PLANT, y: PETALS[i % PETALS.length][0], d: PETALS[i % PETALS.length][1] })

const MOUND = ['...kkkkkkkk...', '..kkkkkkkkkk..']
const E = '..............'
const SEED = [E, E, E, E, E, E, E, E, E, E, E, E, E, E, '.....kkkk.....', '....kwwwck....', ...MOUND]
const SPROUT = [
  E, E, E, E, E, E, E, E,
  '.GG........GG.',
  'GggGG....GGggG',
  'GggggGGGGggggG',
  '.GGgggGGgggGG.',
  '...GGGGgGGG...',
  '......Gg......',
  '......Gg......',
  '......Gg......',
  ...MOUND,
]
const LEAVES = [
  '.GG...Gg...GG.',
  'GggGG.Gg.GGggG',
  'GggggGGgGggggG',
  '.GGgggGgGggGG.',
  '...GGGGgGGG...',
  '.GG...Gg...GG.',
  'GggGG.Gg.GGggG',
  '.GGggGGgGggGG.',
  '....GGGgGGG...',
]
const LEAFY = [E, E, E, E, '......GG......', '.....GggG.....', '......Gg......', ...LEAVES, ...MOUND]
const BLOOM = [
  '.....yyyy.....',
  '...yyyyyyyy...',
  '...yyddddyy...',
  '...yyddddyy...',
  '...yyyyyyyy...',
  '.....yyyy.....',
  '......Gg......',
  ...LEAVES,
  ...MOUND,
]
const FRUIT = [
  E, E, E, E,
  '......GG......',
  '.....GggG.....',
  '......Gg......',
  '.GG...Gg...GG.',
  'GggGG.Gg.GGggG',
  'GggggGGgGggggG',
  '.GGrrGGgGrrGG.',
  '..rcrrGgrcrr..',
  '..rrrrGgrrrr..',
  '...rr.Gg.rr...',
  '.GG...Gg...GG.',
  'GggGG.Gg.GGggG',
  ...MOUND,
]
const TONY_FACE = ['..hhhhhh..', '.hhhhhhhh.', '.hhhhhhhh.', '.hppppphh.', '.pppppppp.', '.ppkppkpp.', '.pppppppp.', '.pppmmppp.', '..pppppp..', '.gggggggg.', 'gggggggggg']
const NELE_FACE = [
  '.yy.yyy.y.',
  'yyyydyyyyy',
  'ydyyyyydyy',
  'yyyppppyyd',
  'dyppppppyy',
  'yypkppkpyy',
  'ydppppppdy',
  'yyppmmppyy',
  '.dyppppyy.',
  'yy.rrrr.yd',
  '.yrrrrrry.',
]
const FACES: Record<string, { face: string[]; colors: Record<string, string> }> = {
  tony: { face: TONY_FACE, colors: { h: C.soil, k: C.ink, p: C.skin, m: C.berry, g: C.leaf } },
  nele: { face: NELE_FACE, colors: { y: C.blond, d: C.curl, p: C.skin, k: C.ink, m: C.berry, r: C.berry } },
}

const SUN = ['....y....', '.y.....y.', '...yyy...', '..yyyyy..', 'y.yyyyy.y', '..yyyyy..', '...yyy...', '.y.....y.', '....y....']
const CLOUD = ['....cc......', '...cccc.cc..', '.cccccccccc.', 'cccccccccccc']
const FENCE = ['..cc....', '.cccc...', '.cccc...', 'cccccccc', '.cccc...', '.cccc...', 'cccccccc', '.cccc...', '.cccc...']
const BASKET = [
  '.....kkkkkk.....',
  '....k......k....',
  '...k.rr.yy..k...',
  '..krrrryyygGgk..',
  '.krrcrryyyygggk.',
  'kkkkkkkkkkkkkkkk',
  'kwwwwwwwwwwwwwwk',
  'kwdwdwdwdwdwdwdk',
  '.kwwwwwwwwwwwwk.',
  '.kdwdwdwdwdwdwk.',
  '..kwwwwwwwwwwk..',
  '..kkkkkkkkkkkk..',
]
const FLOWER_ICON = ['..y.y..', '.yyyyy.', 'yyydyyy', '.yyyyy.', '..y.y..', '...G...', '.GgG...', '...GgG.', '...G...']
const SEED_ICON = ['.......', '.......', '.......', '.......', '.......', '.......', '.......', '..kwk..', '.kkkkk.']
const LEAF = ['..gG', '.ggG', 'ggG.', 'G...']
const TOMATO = ['.G.', 'rrr', 'rrr']
// Rolling hill line, 2-4 rows tall, so the strip reads as a landscape rather than a flat band.
const HILLS = Array.from({ length: 5 }, (_, y) =>
  Array.from({ length: 49 }, (_, x) => (y >= 4 - Math.round(1.5 + 1.5 * Math.sin(x / 6) + Math.sin(x / 2.5) * 0.4) ? 'g' : '.')).join(''),
)

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

// System emoji drawn on a small canvas and scaled 2x, so they sit on a pixel grid like the sprites.
function PixelEmoji({ char, grid }: { char: string; grid: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const ctx = ref.current?.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    ctx.clearRect(0, 0, grid, grid)
    ctx.font = `${Math.round(grid * 0.82)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(char, grid / 2, grid * 0.56)
    // Anti-aliased edges would scale up as blur; snap alpha to on/off.
    const img = ctx.getImageData(0, 0, grid, grid)
    for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 110 ? 255 : 0
    ctx.putImageData(img, 0, 0)
  }, [char, grid])
  return <canvas ref={ref} className="gd-pe" width={grid} height={grid} style={{ width: grid * 2, height: grid * 2 }} aria-hidden />
}

// Weekly habits open with their first full week. Dead after that Monday: delete it and its uses.
const WEEKLY_OPENS: Day = '2026-11-23'

type Plot = Habit & { flower: Record<string, string> }

// More taps than this and the habit gets +/- buttons instead of one hole per tap.
const usesCounter = (h: Habit) => h.target / h.step > 5
const isDone = (h: Habit, total: number) => total >= h.target

const PACE_LABEL: Record<Pace, string> = { 'on-track': 'ON TRACK', tight: 'EVERY DAY NOW', behind: 'BEHIND' }

function stageOf(h: Habit, total: number) {
  return isDone(h, total) ? BLOOM : total === 0 ? SEED : total / h.target < 0.5 ? SPROUT : LEAFY
}

export default function Garden({ me, signOut }: { me: string; signOut: () => void }) {
  const { garden, error, setTotal, setBusy } = useGarden(me)
  const [party, setParty] = useState(false)
  const cleared = !!garden && garden.people.every((p) => dayCleared(garden.log, garden.habits.filter((h) => h.owner_id === p.id), p.id, garden.day))

  // The celebration shows once per day per phone, the first time it sees both days cleared.
  useEffect(() => {
    if (!garden || !cleared || localStorage.getItem('harvest-seen') === garden.day) return
    localStorage.setItem('harvest-seen', garden.day)
    setParty(true)
  }, [cleared, garden])

  if (!garden) {
    return (
      <div className="garden">
        <main>{error && <p className="gd-error">{error}</p>}</main>
      </div>
    )
  }

  const { day, log, people } = garden
  const mine = people.find((p) => p.id === me)
  const theirs = people.find((p) => p.id !== me)
  if (!mine || !theirs) return <div className="garden" />

  const plotsOf = (p: Person): Plot[] => garden.habits.filter((h) => h.owner_id === p.id).map((h, i) => ({ ...h, flower: bloom(i) }))
  const myPlots = plotsOf(mine)
  const theirPlots = plotsOf(theirs)
  const busy = isBusy(log, me, day)
  const myDay = dayPlan(myPlots, busy)
  const theirDay = dayPlan(theirPlots, isBusy(log, theirs.id, day))
  const resting = myPlots.filter((h) => h.period === 'day').length - myDay.length
  const weeklyOpen = day >= WEEKLY_OPENS
  const weekly = (plots: Plot[]) => (weeklyOpen ? plots.filter((h) => h.period === 'week') : [])
  const team = teamStreak(log, garden.habits, people.map((p) => p.id), day)

  const totalOf = (h: Habit) => (h.period === 'week' ? weekTotal(log, h.id, day) : totalOn(log, h.id, day))
  const paceOf = (h: Habit) => (h.period === 'week' && !isDone(h, totalOf(h)) ? weekPace(h.target, totalOf(h), day) : null)
  const card = (h: Plot) => (
    <PlotCard
      key={h.id}
      habit={h}
      total={totalOf(h)}
      streak={habitStreak(log, h, day)}
      pace={paceOf(h)}
      daysLeft={daysLeftInWeek(day)}
      set={(v) => setTotal(h, totalOf(h), v)}
    />
  )
  const date = new Date(`${day}T12:00:00`)

  return (
    <div className="garden">
      <header className="gd-land">
        <div className="gd-sun">
          <Sprite rows={SUN} colors={{ y: C.sun }} px={4} />
        </div>
        <div className="gd-cloud c1">
          <Sprite rows={CLOUD} colors={{ c: C.cream }} px={4} />
        </div>
        <div className="gd-cloud c2">
          <Sprite rows={CLOUD} colors={{ c: C.cream }} px={3} />
        </div>

        <div className="gd-hang">
          <div className="gd-sign">
            <h1>{date.toLocaleDateString('en-GB', { weekday: 'long' })}</h1>
            <p>{date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <div className="gd-hills">
          <Sprite rows={HILLS} colors={{ g: C.leaf }} px={8} />
        </div>
        <div className="gd-fence">
          {Array.from({ length: 17 }, (_, i) => (
            <Sprite key={i} rows={FENCE} colors={{ c: C.cream }} px={3} />
          ))}
        </div>

        <div className="gd-meadow">
          <div className="gd-farmers">
            <Farmer person={mine} plan={myDay} log={log} day={day} />
            <div className={`gd-post ${cleared ? 'lit' : ''}`} title="days in a row you both finished everything">
              <span>TEAM</span>
              <span>STREAK</span>
              <b>{team}</b>
              <span>{team === 1 ? 'day' : 'days'}</span>
            </div>
            <Farmer person={theirs} plan={theirDay} log={log} day={day} />
          </div>

          {cleared && (
            <button className="gd-btn gd-replay" onClick={() => setParty(true)}>
              <Sprite rows={BASKET} colors={PLANT} px={2} /> HARVEST DAY
            </button>
          )}
        </div>
      </header>

      <main>
        {error && <p className="gd-error">{error}</p>}
        <div className="gd-section">
          <h2 className="gd-plank">{mine.name}'s plots</h2>
          <button className={`gd-busy ${busy ? 'on' : ''}`} aria-pressed={busy} onClick={() => setBusy(!busy)}>
            busy day
          </button>
        </div>
        {myDay.map(card)}
        {resting > 0 && (
          <p className="gd-rest">
            busy day · {resting} {resting === 1 ? 'plot rests' : 'plots rest'} today
          </p>
        )}

        {myPlots.some((h) => h.period === 'week') && (
          <div className="gd-section">
            <h2 className="gd-plank">This week</h2>
            <span className="gd-hint">{weeklyOpen ? 'fresh soil on Monday' : 'opens on Monday'}</span>
          </div>
        )}
        {weekly(myPlots).map(card)}

        <div className="gd-section">
          <h2 className="gd-plank">{theirs.name}'s patch</h2>
        </div>
        <div className="gd-frame gd-patch">
          {[...theirDay, ...weekly(theirPlots)].map((h) => (
            <MiniPlot key={h.id} habit={h} total={totalOf(h)} pace={paceOf(h)} />
          ))}
        </div>

        <button className="gd-out" onClick={signOut}>
          sign out
        </button>
      </main>

      {party && <Harvest count={myDay.length + theirDay.length} streak={team} close={() => setParty(false)} />}
    </div>
  )
}

function Farmer({ person, plan, log, day }: { person: Person; plan: Plot[]; log: Log; day: Day }) {
  const { face, colors } = FACES[person.name.toLowerCase()] ?? FACES.tony
  return (
    <div className="gd-farmer">
      <div className="gd-face">
        <Sprite rows={face} colors={colors} px={4} />
      </div>
      <div>
        <b>{person.name}</b>
        <span className="gd-pct">{dayPercent(plan, log, day)}%</span>
        <div className="gd-sprouts">
          {plan.map((h) => (
            <Sprite key={h.id} rows={isDone(h, totalOn(log, h.id, day)) ? FLOWER_ICON : SEED_ICON} colors={h.flower} px={3} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Stake({ n, lit, unit }: { n: number; lit: boolean; unit: string }) {
  return (
    <div className={`gd-stake ${lit ? 'lit' : ''}`} title={`${n} ${unit} streak`}>
      <b>{n}</b>
      <span>{n === 1 ? unit : `${unit}s`}</span>
    </div>
  )
}

type CardProps = { habit: Plot; total: number; streak: number; pace: Pace | null; daysLeft: number; set: (v: number) => void }

function PlotCard({ habit: h, total, streak, pace, daysLeft, set }: CardProps) {
  const done = isDone(h, total)
  const ticks = !usesCounter(h)
  const when = h.period === 'week' ? 'this week' : 'today'
  return (
    <section className={`gd-frame gd-card ${done ? 'done' : ''}`}>
      <div className="gd-card-top">
        <div className="gd-tile">
          <PixelEmoji char={h.emoji} grid={18} />
        </div>
        <div className="gd-title">
          <h3>{h.name}</h3>
          <p>
            {ticks ? `${total} of ${h.target} ${when}` : `at least ${h.target} ${h.unit}`}
            {done && <b className="gd-badge">IN BLOOM</b>}
            {pace && <b className={`gd-badge ${pace}`}>{PACE_LABEL[pace]}</b>}
          </p>
        </div>
        <Stake n={streak} lit={done} unit={h.period} />
      </div>

      <div className={`gd-bed ${h.target > 4 ? 'tight' : ''}`}>
        {ticks ? (
          Array.from({ length: h.target }, (_, i) => (
            <button
              key={`${i}-${i < total}`}
              className={`gd-hole ${i < total ? 'on' : ''}`}
              aria-label={`log ${i + 1}`}
              onClick={() => set(i < total ? i : i + 1)}
            >
              <Sprite rows={done ? BLOOM : i < total ? LEAFY : SEED} colors={h.flower} px={h.target > 4 ? 3 : 4} />
            </button>
          ))
        ) : (
          <Counter habit={h} total={total} set={set} />
        )}
        {ticks && (
          <span className="gd-water">
            {done
              ? `watered for ${when}`
              : pace
                ? `${h.target - total} to go · ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`
                : 'tap a plot to water it'}
          </span>
        )}
      </div>
    </section>
  )
}

function Counter({ habit: h, total, set }: { habit: Plot; total: number; set: (v: number) => void }) {
  const segs = 11
  const filled = Math.min(segs, Math.ceil((total / h.target) * segs))
  const extra = total - h.target
  return (
    <div className="gd-counter">
      <div className="gd-counter-row">
        <button className="gd-btn" disabled={total === 0} onClick={() => set(total - h.step)}>
          -{h.step}
        </button>
        <div className="gd-hole big">
          <Sprite rows={stageOf(h, total)} colors={h.flower} px={4} />
        </div>
        <div className="gd-readout">
          <b>{total}</b>
          <span>{extra > 0 ? `${extra} extra` : extra === 0 ? 'goal reached' : `${-extra} to go`}</span>
        </div>
        <button className="gd-btn" onClick={() => set(total + h.step)}>
          +{h.step}
        </button>
      </div>
      <div className="gd-rows">
        {Array.from({ length: segs }, (_, i) => (
          <i key={i} className={i < filled ? 'on' : ''} />
        ))}
      </div>
    </div>
  )
}

function MiniPlot({ habit: h, total, pace }: { habit: Plot; total: number; pace: Pace | null }) {
  const done = isDone(h, total)
  const stat = done ? 'in bloom' : `${total}/${h.target}`
  const week = h.period === 'week'
  return (
    <div className={`gd-mini ${done ? 'done' : ''} ${pace ?? ''}`}>
      <span className="gd-mini-bed">
        <Sprite rows={stageOf(h, total)} colors={h.flower} px={3} />
      </span>
      <span className="gd-mini-name">
        <PixelEmoji char={h.emoji} grid={10} />
        {h.name}
      </span>
      <span className="gd-mini-stat">{week ? (done ? 'week done' : `${stat} wk`) : stat}</span>
    </div>
  )
}

const FALLING = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 41) % 96,
  delay: -((i * 0.53) % 4),
  dur: 3 + ((i * 7) % 10) / 5,
  tomato: i % 3 === 0,
}))

function Harvest({ count, streak, close }: { count: number; streak: number; close: () => void }) {
  return (
    <div className="gd-party" onClick={close}>
      {FALLING.map((f, i) => (
        <i key={i} className="gd-fall" style={{ left: `${f.left}%`, animationDelay: `${f.delay}s`, animationDuration: `${f.dur}s` }}>
          <Sprite rows={f.tomato ? TOMATO : LEAF} colors={PLANT} px={4} />
        </i>
      ))}
      <div className="gd-sun big">
        <Sprite rows={SUN} colors={{ y: C.sun }} px={6} />
      </div>
      <div className="gd-party-sky">
        <div className="gd-sign gd-party-sign">
          <h2>We did it!</h2>
          <p>The flowers are growing, let's celebrate the day.</p>
        </div>
        <div className="gd-duo">
          <div className="gd-hop">
            <span>Tony</span>
            <div className="gd-face">
              <Sprite rows={FACES.tony.face} colors={FACES.tony.colors} px={7} />
            </div>
          </div>
          <div className="gd-basket">
            <Sprite rows={BASKET} colors={PLANT} px={7} />
          </div>
          <div className="gd-hop late">
            <span>Nele</span>
            <div className="gd-face">
              <Sprite rows={FACES.nele.face} colors={FACES.nele.colors} px={7} />
            </div>
          </div>
        </div>
      </div>
      <div className="gd-fence">
        {Array.from({ length: 17 }, (_, i) => (
          <Sprite key={i} rows={FENCE} colors={{ c: C.cream }} px={3} />
        ))}
      </div>
      <div className="gd-crop">
        {[BLOOM, FRUIT, BLOOM, FRUIT, BLOOM, FRUIT].map((r, i) => (
          <Sprite key={i} rows={r} colors={r === BLOOM ? bloom(i) : PLANT} px={4} />
        ))}
      </div>
      <div className="gd-party-ground">
        <p>All {count} habits done · team streak {streak} {streak === 1 ? 'day' : 'days'}</p>
        <button className="gd-btn gd-go" onClick={close}>
          Back to the garden
        </button>
      </div>
    </div>
  )
}
