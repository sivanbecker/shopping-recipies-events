import { daysUntil } from './utils'
import type { Event, EventInvitee, EventEquipment } from '@/types'

/**
 * Returns an i18n key + interpolation params for the countdown display.
 * Uses the existing `daysUntil` helper for date math.
 */
export function countdownLabel(date: string | Date): {
  key: string
  params?: { count: number }
} {
  const days = daysUntil(date)
  if (days === 0) return { key: 'countdown.today' }
  if (days === 1) return { key: 'countdown.tomorrow' }
  if (days > 1) return { key: 'countdown.daysLeft', params: { count: days } }
  return { key: 'countdown.daysAgo', params: { count: Math.abs(days) } }
}

/** Returns true if the event date is today or in the future */
export function isUpcoming(event: Pick<Event, 'date'>): boolean {
  return daysUntil(event.date) >= 0
}

/** Calculates summary stats for the invitees list of an event. */
export function inviteeSummary(invitees: EventInvitee[]): {
  confirmed: number
  total: number
  totalPeople: number
  needsTransport: number
} {
  return {
    confirmed: invitees.filter(i => i.confirmed).length,
    total: invitees.length,
    totalPeople: invitees.reduce((sum, i) => sum + i.party_size, 0),
    needsTransport: invitees.filter(i => i.needs_transport).length,
  }
}

/** Calculates summary stats for the equipment list of an event. */
export function equipmentSummary(items: EventEquipment[]): {
  arranged: number
  total: number
  byType: Record<string, number>
} {
  return {
    arranged: items.filter(i => i.is_arranged).length,
    total: items.length,
    byType: items.reduce<Record<string, number>>((acc, item) => {
      acc[item.item_type] = (acc[item.item_type] ?? 0) + item.quantity_needed
      return acc
    }, {}),
  }
}

/**
 * Scales an ingredient quantity from a recipe's base servings to an override.
 * Returns result rounded to 2 decimal places.
 */
export function scaleQty(quantity: number, baseServings: number, overrideServings: number): number {
  if (baseServings <= 0) return quantity
  return Math.round(((quantity * overrideServings) / baseServings) * 100) / 100
}

/**
 * Sorts events: upcoming first (nearest date first), then past (most recent first).
 * Returns a new array.
 */
export function sortEventsByDate(events: Event[]): Event[] {
  return [...events].sort((a, b) => {
    const dA = daysUntil(a.date)
    const dB = daysUntil(b.date)
    const aUpcoming = dA >= 0
    const bUpcoming = dB >= 0

    // Upcoming before past
    if (aUpcoming && !bUpcoming) return -1
    if (!aUpcoming && bUpcoming) return 1

    // Both upcoming: nearest first (ascending)
    if (aUpcoming && bUpcoming) return dA - dB

    // Both past: most recent first (descending by date)
    return dB - dA
  })
}
