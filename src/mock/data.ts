export type Direction = 'at_least' | 'at_most'
export type Period = 'day' | 'week'

export type Habit = {
  id: string
  name: string
  emoji: string
  direction: Direction
  target: number
  period: Period
  step: number
  unit: string | null
  streak: number
  // Sum of today's entries; seed for the mock's local state.
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
    { id: 't1', name: 'Meditation', emoji: '🧘', direction: 'at_least', target: 1, period: 'day', step: 1, unit: null, streak: 12, total: 1 },
    { id: 't2', name: 'Handstand practice', emoji: '🤸', direction: 'at_least', target: 3, period: 'day', step: 1, unit: null, streak: 4, total: 1 },
    { id: 't3', name: 'Calories', emoji: '🍽️', direction: 'at_most', target: 2200, period: 'day', step: 100, unit: 'kcal', streak: 2, total: 0 },
  ],
}

export const nele: Person = {
  id: 'nele',
  name: 'Nele',
  habits: [
    { id: 'n1', name: 'Journal', emoji: '📓', direction: 'at_least', target: 1, period: 'day', step: 1, unit: null, streak: 21, total: 1 },
    { id: 'n2', name: 'Glasses of water', emoji: '💧', direction: 'at_least', target: 3, period: 'day', step: 1, unit: null, streak: 6, total: 2 },
    { id: 'n3', name: 'Screen time', emoji: '📱', direction: 'at_most', target: 120, period: 'day', step: 15, unit: 'min', streak: 0, total: 0 },
  ],
}

// at_most habits count as done once something is logged and it stayed within target.
export function isDone(h: Pick<Habit, 'direction' | 'target'>, total: number): boolean {
  return h.direction === 'at_least' ? total >= h.target : total > 0 && total <= h.target
}
