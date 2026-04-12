import { describe, it, expect } from 'vitest'
import { countdownLabel, isUpcoming, sortEventsByDate } from '@/lib/eventHelpers'
import type { Event } from '@/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Create a date string N days from "today" */
function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

function makeEvent(overrides: Partial<Event> & { date: string }): Event {
  return {
    id: crypto.randomUUID(),
    title: 'Test Event',
    location: null,
    owner_id: 'user-1',
    notes: null,
    photo_album_url: null,
    retro_enough_food: null,
    retro_what_went_wrong: null,
    retro_what_went_well: null,
    retro_remember_next_time: null,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

// ─── countdownLabel ──────────────────────────────────────────────────────────

describe('countdownLabel', () => {
  it('returns "today" for a date today', () => {
    const result = countdownLabel(daysFromNow(0))
    expect(result.key).toBe('countdown.today')
    expect(result.params).toBeUndefined()
  })

  it('returns "tomorrow" for a date 1 day from now', () => {
    const result = countdownLabel(daysFromNow(1))
    expect(result.key).toBe('countdown.tomorrow')
    expect(result.params).toBeUndefined()
  })

  it('returns "daysLeft" with count for 2+ days in the future', () => {
    const result = countdownLabel(daysFromNow(5))
    expect(result.key).toBe('countdown.daysLeft')
    expect(result.params).toEqual({ count: 5 })
  })

  it('returns "daysAgo" with positive count for past dates', () => {
    const result = countdownLabel(daysFromNow(-3))
    expect(result.key).toBe('countdown.daysAgo')
    expect(result.params).toEqual({ count: 3 })
  })

  it('returns "daysLeft" for a far-future date', () => {
    const result = countdownLabel(daysFromNow(100))
    expect(result.key).toBe('countdown.daysLeft')
    expect(result.params).toEqual({ count: 100 })
  })
})

// ─── isUpcoming ──────────────────────────────────────────────────────────────

describe('isUpcoming', () => {
  it('returns true for a date today', () => {
    expect(isUpcoming({ date: daysFromNow(0) })).toBe(true)
  })

  it('returns true for a future date', () => {
    expect(isUpcoming({ date: daysFromNow(10) })).toBe(true)
  })

  it('returns false for a past date', () => {
    expect(isUpcoming({ date: daysFromNow(-1) })).toBe(false)
  })
})

// ─── sortEventsByDate ────────────────────────────────────────────────────────

describe('sortEventsByDate', () => {
  it('returns empty array for empty input', () => {
    expect(sortEventsByDate([])).toEqual([])
  })

  it('sorts upcoming events nearest-first (ascending)', () => {
    const e1 = makeEvent({ title: 'Near', date: daysFromNow(2) })
    const e2 = makeEvent({ title: 'Far', date: daysFromNow(10) })
    const e3 = makeEvent({ title: 'Mid', date: daysFromNow(5) })

    const sorted = sortEventsByDate([e2, e3, e1])
    expect(sorted.map(e => e.title)).toEqual(['Near', 'Mid', 'Far'])
  })

  it('sorts past events most-recent-first (descending)', () => {
    const e1 = makeEvent({ title: 'Recent', date: daysFromNow(-1) })
    const e2 = makeEvent({ title: 'Old', date: daysFromNow(-10) })
    const e3 = makeEvent({ title: 'Mid', date: daysFromNow(-5) })

    const sorted = sortEventsByDate([e2, e3, e1])
    expect(sorted.map(e => e.title)).toEqual(['Recent', 'Mid', 'Old'])
  })

  it('places upcoming events before past events', () => {
    const past = makeEvent({ title: 'Past', date: daysFromNow(-3) })
    const future = makeEvent({ title: 'Future', date: daysFromNow(3) })
    const today = makeEvent({ title: 'Today', date: daysFromNow(0) })

    const sorted = sortEventsByDate([past, future, today])
    expect(sorted.map(e => e.title)).toEqual(['Today', 'Future', 'Past'])
  })

  it('does not mutate the original array', () => {
    const events = [
      makeEvent({ title: 'B', date: daysFromNow(5) }),
      makeEvent({ title: 'A', date: daysFromNow(1) }),
    ]
    const original = [...events]
    sortEventsByDate(events)
    expect(events.map(e => e.title)).toEqual(original.map(e => e.title))
  })
})
