// Pure date and streak rules. Days are 'YYYY-MM-DD' strings in the device's time zone.

export type Day = string

export type Habit = {
  id: string
  owner_id: string
  name: string
  emoji: string
  target: number
  // Target on a busy day; null means the habit rests that day.
  busy_target: number | null
  period: 'day' | 'week'
  step: number
  unit: string | null
}

export type Log = {
  // habit id -> day -> sum of that day's entries
  totals: Record<string, Record<Day, number>>
  // `${owner_id} ${day}` for every busy day
  busy: Set<string>
}

// How far back streaks can see; a longer run shows as this many days.
export const HISTORY_DAYS = 60

const pad = (n: number) => String(n).padStart(2, '0')

// A day runs 04:00 to 04:00 on the device clock, so a late dinner counts for the right day.
export function dayOf(now: Date): Day {
  const d = new Date(now)
  d.setHours(d.getHours() - 4)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function addDays(day: Day, n: number): Day {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

// 0 = Monday
const weekdayOf = (day: Day) => (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7
export const weekStart = (day: Day) => addDays(day, -weekdayOf(day))
// Today included.
export const daysLeftInWeek = (day: Day) => 7 - weekdayOf(day)

export const isBusy = (log: Log, owner: string, day: Day) => log.busy.has(`${owner} ${day}`)
export const totalOn = (log: Log, habitId: string, day: Day) => log.totals[habitId]?.[day] ?? 0

export function weekTotal(log: Log, habitId: string, day: Day): number {
  const start = weekStart(day)
  let sum = 0
  for (let i = 0; i < 7; i++) sum += totalOn(log, habitId, addDays(start, i))
  return sum
}

// One person's daily habits for a day, each carrying that day's target; resting habits are left out.
export function dayPlan<H extends Habit>(habits: H[], busy: boolean): H[] {
  return habits.flatMap((h) => {
    if (h.period !== 'day') return []
    const target = busy ? h.busy_target : h.target
    return target ? [{ ...h, target }] : []
  })
}

export function dayCleared(log: Log, habits: Habit[], owner: string, day: Day): boolean {
  return dayPlan(habits, isBusy(log, owner, day)).every((h) => totalOn(log, h.id, day) >= h.target)
}

// Streaks end yesterday and add today once it is done, so an unfinished today never breaks them.
// `step` answers for one day or week: true counts, false breaks, null skips without breaking.
function streak(today: Day, oldest: Day, back: (d: Day) => Day, step: (d: Day) => boolean | null): number {
  let n = 0
  for (let d = today; d >= oldest; d = back(d)) {
    const ok = step(d)
    if (ok) n++
    else if (ok === false && d !== today) break
  }
  return n
}

const oldestDay = (today: Day) => addDays(today, -(HISTORY_DAYS - 1))

// A busy day on which the habit rests neither grows nor breaks its streak.
export function habitStreak(log: Log, h: Habit, today: Day): number {
  if (h.period === 'week') {
    const thisWeek = weekStart(today)
    return streak(thisWeek, weekStart(oldestDay(today)), (d) => addDays(d, -7), (d) => weekTotal(log, h.id, d) >= h.target)
  }
  return streak(today, oldestDay(today), (d) => addDays(d, -1), (d) => {
    const [planned] = dayPlan([h], isBusy(log, h.owner_id, d))
    return planned ? totalOn(log, h.id, d) >= planned.target : null
  })
}

// Days in a row on which both people cleared their whole day.
export function teamStreak(log: Log, habits: Habit[], owners: string[], today: Day): number {
  return streak(today, oldestDay(today), (d) => addDays(d, -1), (d) =>
    owners.every((o) => dayCleared(log, habits.filter((h) => h.owner_id === o), o, d)),
  )
}

// Share of the day's plan done, partial progress counted.
export function dayPercent(plan: Habit[], log: Log, day: Day): number {
  if (plan.length === 0) return 100
  const share = plan.reduce((sum, h) => sum + Math.min(totalOn(log, h.id, day) / h.target, 1), 0) / plan.length
  // Rounding alone would show 100% for e.g. 2490 of 2500 kcal, before the last flower blooms.
  return Math.min(Math.round(share * 100), share < 1 ? 99 : 100)
}

export type Pace = 'on-track' | 'tight' | 'behind'

// Assumes at most one session a day, so the slack is how many of the remaining days can still be skipped.
export function weekPace(target: number, total: number, today: Day): Pace {
  const slack = daysLeftInWeek(today) - (target - total)
  return slack > 0 ? 'on-track' : slack === 0 ? 'tight' : 'behind'
}
