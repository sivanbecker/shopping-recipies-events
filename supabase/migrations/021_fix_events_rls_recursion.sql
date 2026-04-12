-- Fix infinite RLS recursion between events and event_members.
--
-- Root cause:
--   events SELECT (from 020) queries event_members via IN subquery
--   event_members SELECT (from 019) queries events via EXISTS
--   → infinite recursion
--
-- Fix: break the cycle by making both policies self-contained.
--   events SELECT → owner_id only, no cross-table reference
--   event_members SELECT → user_id = auth.uid() OR a SECURITY DEFINER
--     function (deferred to sharing feature); for now owner check uses
--     a direct events lookup that is safe because events SELECT no longer
--     references event_members.

DROP POLICY IF EXISTS "events_select" ON events;
DROP POLICY IF EXISTS "event_members_select" ON event_members;

-- events: owner sees their own events only (no event_members join)
CREATE POLICY "events_select" ON events FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

-- event_members: member sees their own row, or owner sees rows for their events.
-- Safe: events SELECT no longer references event_members, so no cycle.
CREATE POLICY "event_members_select" ON event_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id AND e.owner_id = auth.uid()
    )
  );
