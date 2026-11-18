import { useCallback, useEffect, useRef, useState } from 'react'
import { type Day, type Habit, type Log, HISTORY_DAYS, addDays, dayOf, weekStart } from './days'
import { supabase } from './supabase'

export type Person = { id: string; name: string }

export type Garden = { day: Day; people: Person[]; habits: Habit[]; log: Log }

const OFFLINE = "Couldn't reach the garden. Check your connection."

function bump(log: Log, habitId: string, day: Day, by: number): Log {
  const days = log.totals[habitId] ?? {}
  return { ...log, totals: { ...log.totals, [habitId]: { ...days, [day]: (days[day] ?? 0) + by } } }
}

export function useGarden(me: string) {
  const [garden, setGarden] = useState<Garden>()
  const [error, setError] = useState<string>()
  const seq = useRef(0)
  const pending = useRef(0)
  // Writes run one after another, so two quick minus taps cannot pick the same entry to delete.
  const queue = useRef<Promise<unknown>>(Promise.resolve())

  const load = useCallback(async () => {
    const n = ++seq.current
    const day = dayOf(new Date())
    const oldest = addDays(day, -(HISTORY_DAYS - 1))
    const [people, habits, totals, busy] = await Promise.all([
      supabase.from('profiles').select('id, name').order('name', { ascending: false }),
      supabase
        .from('habits')
        .select('id, owner_id, name, emoji, target, busy_target, period, step, unit')
        .is('archived_at', null)
        .order('position'),
      supabase.from('daily_totals').select('habit_id, day, total').gte('day', weekStart(oldest)),
      supabase.from('busy_days').select('owner_id, day').gte('day', oldest),
    ])
    // A newer load or an unsaved tap would be overwritten by this result.
    if (n !== seq.current || pending.current > 0) return
    if (people.error || habits.error || totals.error || busy.error) return setError(OFFLINE)
    const log: Log = { totals: {}, busy: new Set(busy.data.map((b) => `${b.owner_id} ${b.day}`)) }
    for (const t of totals.data) (log.totals[t.habit_id] ??= {})[t.day] = t.total
    setError(undefined)
    setGarden({ day, people: people.data, habits: habits.data as Habit[], log })
  }, [])

  useEffect(() => {
    load()
    const channel = supabase
      .channel('garden')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entries' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'busy_days' }, () => load())
      .subscribe()
    // Also picks up the new day after 04:00 when the app comes back to the foreground.
    const onShow = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', onShow)
    return () => {
      supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', onShow)
    }
  }, [load])

  function write(optimistic: (log: Log) => Log, op: () => PromiseLike<{ error: unknown }>) {
    pending.current++
    setGarden((g) => g && { ...g, log: optimistic(g.log) })
    queue.current = queue.current
      .then(op)
      .then(
        ({ error }) => error && setError("That tap didn't save. Check your connection."),
        () => setError("That tap didn't save. Check your connection."),
      )
      .finally(() => {
        if (--pending.current === 0) load()
      })
  }

  // Entries are always one step each, so going down deletes the newest whole steps.
  function setTotal(h: Habit, from: number, to: number) {
    if (!garden || to === from || to < 0) return
    const day = garden.day
    const steps = Math.abs(to - from) / h.step
    write(
      (log) => bump(log, h.id, day, to - from),
      async () => {
        if (to > from) {
          return supabase.from('entries').insert(Array.from({ length: steps }, () => ({ habit_id: h.id, day, value: h.step })))
        }
        const newest = await supabase
          .from('entries')
          .select('id')
          .eq('habit_id', h.id)
          .gte('day', h.period === 'week' ? weekStart(day) : day)
          .order('created_at', { ascending: false })
          .limit(steps)
        if (newest.error) return newest
        return supabase.from('entries').delete().in('id', newest.data.map((e) => e.id))
      },
    )
  }

  function setBusy(on: boolean) {
    if (!garden) return
    const key = `${me} ${garden.day}`
    write(
      (log) => {
        const busy = new Set(log.busy)
        if (on) busy.add(key)
        else busy.delete(key)
        return { ...log, busy }
      },
      () =>
        on
          ? supabase.from('busy_days').upsert({ owner_id: me, day: garden.day }, { ignoreDuplicates: true })
          : supabase.from('busy_days').delete().eq('owner_id', me).eq('day', garden.day),
    )
  }

  return { garden, error, setTotal, setBusy }
}
