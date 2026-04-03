import { describe, it, expect } from 'vitest'
import { cn, daysUntil, formatDate } from '@/lib/utils'

describe('cn (class merger)', () => {
  it('merges tailwind classes', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'ignored', 'added')).toBe('base added')
  })
})

describe('daysUntil', () => {
  it('returns 0 for today', () => {
    const today = new Date()
    expect(daysUntil(today)).toBe(0)
  })

  it('returns positive number for future dates', () => {
    const future = new Date()
    future.setDate(future.getDate() + 5)
    expect(daysUntil(future)).toBe(5)
  })

  it('returns negative number for past dates', () => {
    const past = new Date()
    past.setDate(past.getDate() - 3)
    expect(daysUntil(past)).toBe(-3)
  })
})

describe('formatDate', () => {
  it('returns a non-empty string', () => {
    const result = formatDate('2026-04-03', 'he-IL')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
