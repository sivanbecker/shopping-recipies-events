import { describe, it, expect } from 'vitest'
import { canEdit, canOwn } from '@/hooks/useListRole'
import type { ListRole } from '@/types'

// ─── Role helpers ─────────────────────────────────────────────────────────────

describe('canEdit', () => {
  it('returns true for owner', () => expect(canEdit('owner')).toBe(true))
  it('returns true for editor', () => expect(canEdit('editor')).toBe(true))
  it('returns false for viewer', () => expect(canEdit('viewer')).toBe(false))
  it('returns false for null (not a member)', () => expect(canEdit(null)).toBe(false))
  it('returns false for undefined', () => expect(canEdit(undefined)).toBe(false))
})

describe('canOwn', () => {
  it('returns true only for owner', () => expect(canOwn('owner')).toBe(true))
  it('returns false for editor', () => expect(canOwn('editor')).toBe(false))
  it('returns false for viewer', () => expect(canOwn('viewer')).toBe(false))
  it('returns false for null', () => expect(canOwn(null)).toBe(false))
})

// ─── Undo action type discrimination ──────────────────────────────────────────
// Tests the UndoableAction discriminated union logic without calling Supabase.

type UndoableAction =
  | { type: 'item_add'; listId: string; itemId: string; at: string }
  | { type: 'item_remove'; listId: string; snapshot: object }
  | { type: 'item_quantity'; itemId: string; before: number; after: number; updatedAt: string }
  | { type: 'item_toggle'; itemId: string; before: boolean; updatedAt: string }

function describeAction(action: UndoableAction): string {
  switch (action.type) {
    case 'item_add':
      return `delete item ${action.itemId} from list ${action.listId}`
    case 'item_remove':
      return 're-insert snapshot into list'
    case 'item_quantity':
      return `set quantity to ${action.before} (was ${action.after})`
    case 'item_toggle':
      return `set is_checked to ${action.before}`
  }
}

describe('UndoableAction discrimination', () => {
  it('item_add reversal description is correct', () => {
    const a: UndoableAction = { type: 'item_add', listId: 'l1', itemId: 'i1', at: 't1' }
    expect(describeAction(a)).toContain('delete item i1')
  })

  it('item_remove reversal description is correct', () => {
    const a: UndoableAction = { type: 'item_remove', listId: 'l1', snapshot: {} }
    expect(describeAction(a)).toContain('re-insert')
  })

  it('item_quantity reversal uses `before` value', () => {
    const a: UndoableAction = {
      type: 'item_quantity',
      itemId: 'i1',
      before: 2,
      after: 5,
      updatedAt: 't1',
    }
    expect(describeAction(a)).toBe('set quantity to 2 (was 5)')
  })

  it('item_toggle reversal restores previous boolean', () => {
    const a: UndoableAction = { type: 'item_toggle', itemId: 'i1', before: false, updatedAt: 't1' }
    expect(describeAction(a)).toBe('set is_checked to false')
  })
})

// ─── Undo staleness guard ─────────────────────────────────────────────────────
// The guard compares the stored updatedAt against the current DB value.
// We test the comparison logic without hitting the DB.

function isStale(storedAt: string, currentAt: string): boolean {
  return storedAt !== currentAt
}

describe('undo staleness guard', () => {
  it('not stale when timestamps are equal', () => {
    expect(isStale('2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z')).toBe(false)
  })

  it('stale when timestamps differ (someone else edited)', () => {
    expect(isStale('2024-01-01T00:00:00Z', '2024-01-01T00:01:00Z')).toBe(true)
  })
})

// ─── Soft-delete field transitions ────────────────────────────────────────────
// Verify the soft-delete / restore payload shapes match what the DB expects.

interface SoftDeletePayload {
  deleted_at: string
  deleted_by: string
}
interface RestorePayload {
  deleted_at: null
  deleted_by: null
}

function buildSoftDelete(userId: string): SoftDeletePayload {
  return { deleted_at: new Date().toISOString(), deleted_by: userId }
}

function buildRestore(): RestorePayload {
  return { deleted_at: null, deleted_by: null }
}

describe('soft-delete payload', () => {
  it('sets deleted_at to a valid ISO string', () => {
    const payload = buildSoftDelete('user-1')
    expect(() => new Date(payload.deleted_at)).not.toThrow()
    expect(new Date(payload.deleted_at).toISOString()).toBe(payload.deleted_at)
  })

  it('sets deleted_by to the supplied user id', () => {
    expect(buildSoftDelete('user-42').deleted_by).toBe('user-42')
  })
})

describe('restore payload', () => {
  it('nulls both deleted_at and deleted_by', () => {
    const payload = buildRestore()
    expect(payload.deleted_at).toBeNull()
    expect(payload.deleted_by).toBeNull()
  })
})

// ─── Notification fan-out exclusion ──────────────────────────────────────────
// Mirrors the SQL: notify_list_recipients excludes the actor from recipients.

interface FakeMember {
  user_id: string
}

function fanOut(ownerId: string, members: FakeMember[], actorId: string): string[] {
  const all = new Set([ownerId, ...members.map(m => m.user_id)])
  all.delete(actorId)
  return Array.from(all)
}

describe('notification fan-out', () => {
  const OWNER = 'user-owner'
  const EDITOR = 'user-editor'
  const VIEWER = 'user-viewer'
  const members = [{ user_id: EDITOR }, { user_id: VIEWER }]

  it('excludes the actor from recipients', () => {
    const recipients = fanOut(OWNER, members, EDITOR)
    expect(recipients).not.toContain(EDITOR)
  })

  it('includes all other members including owner', () => {
    const recipients = fanOut(OWNER, members, EDITOR)
    expect(recipients).toContain(OWNER)
    expect(recipients).toContain(VIEWER)
  })

  it('when owner is the actor, only members receive', () => {
    const recipients = fanOut(OWNER, members, OWNER)
    expect(recipients).not.toContain(OWNER)
    expect(recipients).toContain(EDITOR)
    expect(recipients).toContain(VIEWER)
  })

  it('no recipients when list has only the actor', () => {
    const recipients = fanOut(OWNER, [], OWNER)
    expect(recipients).toHaveLength(0)
  })
})

// ─── Leave-list eligibility ───────────────────────────────────────────────────

function canLeave(ownerId: string, userId: string, role: ListRole | null): boolean {
  return role !== null && role !== 'owner' && userId !== ownerId
}

describe('canLeave', () => {
  it('owner cannot leave', () => {
    expect(canLeave('u-owner', 'u-owner', 'owner')).toBe(false)
  })

  it('editor can leave', () => {
    expect(canLeave('u-owner', 'u-editor', 'editor')).toBe(true)
  })

  it('viewer can leave', () => {
    expect(canLeave('u-owner', 'u-viewer', 'viewer')).toBe(true)
  })

  it('non-member (null role) cannot leave', () => {
    expect(canLeave('u-owner', 'u-stranger', null)).toBe(false)
  })
})
