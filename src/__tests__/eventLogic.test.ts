import { describe, it, expect } from 'vitest'
import {
  countdownLabel,
  isUpcoming,
  sortEventsByDate,
  inviteeSummary,
  equipmentSummary,
  scaleQty,
} from '@/lib/eventHelpers'
import type { Event, EventInvitee, EventEquipment } from '@/types'

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

// ─── inviteeSummary ───────────────────────────────────────────────────────────

function makeInvitee(overrides: Partial<EventInvitee> & { name: string }): EventInvitee {
  return {
    id: crypto.randomUUID(),
    event_id: 'event-1',
    contact_id: null,
    phone: null,
    party_size: 1,
    confirmed: false,
    brings: null,
    needs_transport: false,
    transport_by: null,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('inviteeSummary', () => {
  it('returns zeros for empty list', () => {
    expect(inviteeSummary([])).toEqual({
      confirmed: 0,
      total: 0,
      totalPeople: 0,
      needsTransport: 0,
    })
  })

  it('counts confirmed invitees', () => {
    const invitees = [
      makeInvitee({ name: 'A', confirmed: true }),
      makeInvitee({ name: 'B', confirmed: false }),
      makeInvitee({ name: 'C', confirmed: true }),
    ]
    const { confirmed, total } = inviteeSummary(invitees)
    expect(confirmed).toBe(2)
    expect(total).toBe(3)
  })

  it('sums party sizes for totalPeople', () => {
    const invitees = [
      makeInvitee({ name: 'Cohen family', party_size: 4 }),
      makeInvitee({ name: 'Levi', party_size: 1 }),
      makeInvitee({ name: 'Shapiro family', party_size: 3 }),
    ]
    expect(inviteeSummary(invitees).totalPeople).toBe(8)
  })

  it('counts invitees needing transport', () => {
    const invitees = [
      makeInvitee({ name: 'A', needs_transport: true }),
      makeInvitee({ name: 'B', needs_transport: false }),
      makeInvitee({ name: 'C', needs_transport: true }),
    ]
    expect(inviteeSummary(invitees).needsTransport).toBe(2)
  })
})

// ─── equipmentSummary ─────────────────────────────────────────────────────────

function makeEquipment(overrides: Partial<EventEquipment> & { item_type: string }): EventEquipment {
  return {
    id: crypto.randomUUID(),
    event_id: 'event-1',
    quantity_needed: 1,
    is_default: false,
    is_arranged: false,
    label: null,
    notes: null,
    ...overrides,
  }
}

describe('equipmentSummary', () => {
  it('returns zeros for empty list', () => {
    expect(equipmentSummary([])).toEqual({ arranged: 0, total: 0, byType: {} })
  })

  it('counts arranged items', () => {
    const items = [
      makeEquipment({ item_type: 'chair', is_arranged: true }),
      makeEquipment({ item_type: 'table', is_arranged: false }),
      makeEquipment({ item_type: 'chair', is_arranged: true }),
    ]
    const { arranged, total } = equipmentSummary(items)
    expect(arranged).toBe(2)
    expect(total).toBe(3)
  })

  it('sums quantity_needed by item_type in byType', () => {
    const items = [
      makeEquipment({ item_type: 'chair', quantity_needed: 8 }),
      makeEquipment({ item_type: 'chair', quantity_needed: 4 }),
      makeEquipment({ item_type: 'table', quantity_needed: 2 }),
    ]
    const { byType } = equipmentSummary(items)
    expect(byType['chair']).toBe(12)
    expect(byType['table']).toBe(2)
  })
})

// ─── scaleQty ────────────────────────────────────────────────────────────────

describe('scaleQty', () => {
  it('scales up when override > base', () => {
    expect(scaleQty(4, 4, 8)).toBe(8)
  })

  it('scales down when override < base', () => {
    expect(scaleQty(8, 4, 2)).toBe(4)
  })

  it('returns identity when override === base', () => {
    expect(scaleQty(3, 4, 4)).toBe(3)
  })

  it('rounds to 2 decimal places', () => {
    expect(scaleQty(1, 3, 1)).toBe(0.33)
  })

  it('returns original quantity when baseServings is 0', () => {
    expect(scaleQty(5, 0, 4)).toBe(5)
  })
})
