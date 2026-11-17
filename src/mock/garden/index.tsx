import '@fontsource/jersey-10/400.css'
import { useEffect, useRef, useState } from 'react'
import { type Habit, type Person, dayPercent, isDone, nele, today, tony } from '../data'
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
const flowerOf: Record<string, Record<string, string>> = Object.fromEntries(
  [tony, nele].flatMap((p) => p.habits.map((h, i) => [h.id, bloom(i)])),
)

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

const TEAM_STREAK = 5

const everything = [...tony.habits, ...nele.habits]
const seed = Object.fromEntries(everything.map((h) => [h.id, h.total]))
const daily = (habits: Habit[]) => habits.filter((h) => h.period === 'day')
const weekly = (habits: Habit[]) => habits.filter((h) => h.period === 'week')
// Weekly habits have their own bed and never hold up the day.
const all = daily(everything)
const allDone = (t: Record<string, number>) => all.every((h) => isDone(h, t[h.id]))
// More taps than this and the habit gets +/- buttons instead of one hole per tap.
const usesCounter = (h: Habit) => h.target / h.step > 5

// Seed streaks already include today when the seed total is done.
const streakOf = (h: Habit, total: number) => h.streak - (isDone(h, h.total) ? 1 : 0) + (isDone(h, total) ? 1 : 0)

function stageOf(h: Habit, total: number) {
  return isDone(h, total) ? BLOOM : total === 0 ? SEED : total / h.target < 0.5 ? SPROUT : LEAFY
}

export default function Garden({ me, signOut }: { me: 'tony' | 'nele'; signOut: () => void }) {
  const [mine, theirs] = me === 'tony' ? [tony, nele] : [nele, tony]
  const [totals, setTotals] = useState(seed)
  const [party, setParty] = useState(false)

  function set(id: string, value: number) {
    const next = { ...totals, [id]: Math.max(0, value) }
    setTotals(next)
    if (!allDone(totals) && allDone(next)) setParty(true)
  }

  const cleared = allDone(totals)

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
            <h1>{today.toLocaleDateString('en-GB', { weekday: 'long' })}</h1>
            <p>{today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
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
            <Farmer person={mine} totals={totals} />
            <div className={`gd-post ${cleared ? 'lit' : ''}`} title="days in a row you both finished everything">
              <span>TEAM</span>
              <b>{TEAM_STREAK + (cleared ? 1 : 0)}</b>
              <span>days</span>
            </div>
            <Farmer person={theirs} totals={totals} />
          </div>

          {cleared && (
            <button className="gd-btn gd-replay" onClick={() => setParty(true)}>
              <Sprite rows={BASKET} colors={PLANT} px={2} /> HARVEST DAY
            </button>
          )}
        </div>
      </header>

      <main>
        <div className="gd-section">
          <h2 className="gd-plank">{mine.name}'s plots</h2>
        </div>
        {daily(mine.habits).map((h) => (
          <PlotCard key={h.id} habit={h} total={totals[h.id]} set={(v) => set(h.id, v)} />
        ))}

        {weekly(mine.habits).length > 0 && (
          <div className="gd-section">
            <h2 className="gd-plank">This week</h2>
            <span className="gd-hint">fresh soil on Monday</span>
          </div>
        )}
        {weekly(mine.habits).map((h) => (
          <PlotCard key={h.id} habit={h} total={totals[h.id]} set={(v) => set(h.id, v)} />
        ))}

        <div className="gd-section">
          <h2 className="gd-plank">{theirs.name}'s patch</h2>
          <span className="gd-hint">demo: tap to log for {theirs.name}</span>
        </div>
        <div className="gd-frame gd-patch">
          {[...daily(theirs.habits), ...weekly(theirs.habits)].map((h) => (
            <MiniPlot key={h.id} habit={h} total={totals[h.id]} tap={() => set(h.id, nextTap(h, totals[h.id]))} />
          ))}
        </div>

        <button className="gd-out" onClick={signOut}>
          sign out
        </button>
      </main>

      {party && <Harvest close={() => setParty(false)} />}
    </div>
  )
}

function nextTap(h: Habit, total: number) {
  return total >= h.target ? 0 : total + h.step
}

function Farmer({ person, totals }: { person: Person; totals: Record<string, number> }) {
  const { face, colors } = FACES[person.id]
  return (
    <div className="gd-farmer">
      <div className="gd-face">
        <Sprite rows={face} colors={colors} px={4} />
      </div>
      <div>
        <b>{person.name}</b>
        <span className="gd-pct">{dayPercent(person.habits, totals)}%</span>
        <div className="gd-sprouts">
          {daily(person.habits).map((h) => (
            <Sprite key={h.id} rows={isDone(h, totals[h.id]) ? FLOWER_ICON : SEED_ICON} colors={flowerOf[h.id]} px={3} />
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

function PlotCard({ habit: h, total, set }: { habit: Habit; total: number; set: (v: number) => void }) {
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
          </p>
        </div>
        <Stake n={streakOf(h, total)} lit={done} unit={h.period} />
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
              <Sprite rows={done ? BLOOM : i < total ? LEAFY : SEED} colors={flowerOf[h.id]} px={h.target > 4 ? 3 : 4} />
            </button>
          ))
        ) : (
          <Counter habit={h} total={total} set={set} />
        )}
        {ticks && <span className="gd-water">{done ? `watered for ${when}` : 'tap a plot to water it'}</span>}
      </div>
    </section>
  )
}

function Counter({ habit: h, total, set }: { habit: Habit; total: number; set: (v: number) => void }) {
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
          <Sprite rows={stageOf(h, total)} colors={flowerOf[h.id]} px={4} />
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

function MiniPlot({ habit: h, total, tap }: { habit: Habit; total: number; tap: () => void }) {
  const done = isDone(h, total)
  const stat = done ? 'in bloom' : `${total}/${h.target}`
  const week = h.period === 'week'
  return (
    <button className={`gd-mini ${done ? 'done' : ''} ${week ? 'week' : ''}`} onClick={tap}>
      <span className="gd-mini-bed">
        <Sprite rows={stageOf(h, total)} colors={flowerOf[h.id]} px={3} />
      </span>
      <span className="gd-mini-name">
        <PixelEmoji char={h.emoji} grid={10} />
        {h.name}
      </span>
      <span className="gd-mini-stat">{week ? (done ? 'week done' : `${stat} wk`) : stat}</span>
    </button>
  )
}

const FALLING = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 41) % 96,
  delay: -((i * 0.53) % 4),
  dur: 3 + ((i * 7) % 10) / 5,
  tomato: i % 3 === 0,
}))

function Harvest({ close }: { close: () => void }) {
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
          <h2>Harvest day!</h2>
          <p>Everything is in bloom</p>
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
        <p>All {all.length} habits done · team streak {TEAM_STREAK + 1} days</p>
        <button className="gd-btn gd-go" onClick={close}>
          Back to the garden
        </button>
      </div>
    </div>
  )
}
