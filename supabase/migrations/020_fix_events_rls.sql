-- Fix events SELECT policy to use direct subquery instead of EXISTS with
-- unqualified `id` column reference.

DROP POLICY IF EXISTS "events_select" ON events;

CREATE POLICY "events_select" ON events FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR id IN (
      SELECT em.event_id FROM event_members em WHERE em.user_id = auth.uid()
    )
  );
