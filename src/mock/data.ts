export type Period = 'day' | 'week'

export type Habit = {
  id: string
  name: string
  emoji: string
  target: number
  period: Period
  step: number
  unit: string | null
  streak: number
  // Sum of this period's entries; seed for the mock's local state.
  total: number
}

export type Person = {
  id: string
  name: string
  habits: Habit[]
}

export const today = new Date(2026, 10, 17)

export const tony: Person = {
  id: 'tony',
  name: 'Tony',
  habits: [
    { id: 't1', name: 'Meditation', emoji: '🧘', target: 1, period: 'day', step: 1, unit: null, streak: 12, total: 1 },
    { id: 't2', name: 'Handstand practice', emoji: '🤸', target: 3, period: 'day', step: 1, unit: null, streak: 4, total: 1 },
    { id: 't3', name: 'Calories', emoji: '🍽️', target: 2500, period: 'day', step: 100, unit: 'kcal', streak: 2, total: 1800 },
    { id: 't4', name: 'Run', emoji: '🏃', target: 3, period: 'week', step: 1, unit: null, streak: 4, total: 1 },
  ],
}

export const nele: Person = {
  id: 'nele',
  name: 'Nele',
  habits: [
    { id: 'n1', name: 'Water', emoji: '💧', target: 5, period: 'day', step: 1, unit: 'glasses', streak: 6, total: 2 },
    { id: 'n2', name: 'Eat breakfast', emoji: '🥣', target: 1, period: 'day', step: 1, unit: null, streak: 21, total: 1 },
    { id: 'n3', name: 'Meditate', emoji: '🧘', target: 1, period: 'day', step: 1, unit: null, streak: 3, total: 0 },
  ],
}

export function isDone(h: Pick<Habit, 'target'>, total: number): boolean {
  return total >= h.target
}

// Share of today's daily habits done, partial progress counted; weekly habits excluded.
export function dayPercent(habits: Habit[], totals: Record<string, number>): number {
  const daily = habits.filter((h) => h.period === 'day')
  if (daily.length === 0) return 100
  const share = daily.reduce((sum, h) => sum + Math.min((totals[h.id] ?? 0) / h.target, 1), 0) / daily.length
  // Rounding alone would show 100% for e.g. 2490 of 2500 kcal, before the last flower blooms.
  return Math.min(Math.round(share * 100), share < 1 ? 99 : 100)
}
