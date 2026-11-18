// Run with `npm test` (Node's built-in runner; Node strips the types).
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { type Habit, type Log, dayOf, habitStreak, teamStreak, weekStart } from './days.ts'

const habit = (id: string, owner: string, target: number, busy_target: number | null, period: 'day' | 'week' = 'day'): Habit => ({
  id, owner_id: owner, name: id, emoji: '', target, busy_target, period, step: 1, unit: null,
})
const log = (totals: Log['totals'], busy: string[] = []): Log => ({ totals, busy: new Set(busy) })

test('a day runs 04:00 to 04:00', () => {
  assert.equal(dayOf(new Date(2026, 10, 18, 3, 59)), '2026-11-17')
  assert.equal(dayOf(new Date(2026, 10, 18, 4, 0)), '2026-11-18')
})

test('weeks start on Monday', () => {
  assert.equal(weekStart('2026-11-22'), '2026-11-16')
  assert.equal(weekStart('2026-11-23'), '2026-11-23')
})

test('team streak counts days both cleared, and an unfinished today does not break it', () => {
  const habits = [habit('t', 'tony', 1, 1), habit('n', 'nele', 2, 1)]
  const l = log({
    t: { '2026-11-16': 1, '2026-11-17': 1, '2026-11-18': 1 },
    n: { '2026-11-16': 1, '2026-11-17': 2, '2026-11-18': 1 },
  })
  // Nele did 1 of 2 on the 16th and so far on the 18th: only the 17th counts.
  assert.equal(teamStreak(l, habits, ['tony', 'nele'], '2026-11-18'), 1)
  // Once the 18th is over unfinished, the run is broken.
  assert.equal(teamStreak(l, habits, ['tony', 'nele'], '2026-11-19'), 0)
})

test("a busy day lowers that person's targets for the team streak", () => {
  const habits = [habit('t', 'tony', 1, 1), habit('n', 'nele', 2, 1)]
  const l = log({ t: { '2026-11-16': 1 }, n: { '2026-11-16': 1 } }, ['nele 2026-11-16'])
  assert.equal(teamStreak(l, habits, ['tony', 'nele'], '2026-11-17'), 1)
})

test('a habit resting on a busy day keeps its streak without growing it', () => {
  const h = habit('m', 'tony', 1, null)
  const l = log({ m: { '2026-11-15': 1, '2026-11-17': 1 } }, ['tony 2026-11-16'])
  assert.equal(habitStreak(l, h, '2026-11-18'), 2)
})

test('weekly streak counts whole weeks', () => {
  const h = habit('w', 'nele', 2, null, 'week')
  const l = log({ w: { '2026-11-10': 2, '2026-11-17': 1, '2026-11-18': 1, '2026-11-24': 1 } })
  assert.equal(habitStreak(l, h, '2026-11-25'), 2)
})
