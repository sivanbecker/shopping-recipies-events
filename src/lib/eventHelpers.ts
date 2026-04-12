import { daysUntil } from './utils'
import type { Event } from '@/types'

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
