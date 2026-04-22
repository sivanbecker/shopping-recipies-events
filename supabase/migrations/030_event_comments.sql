-- ============================================================================
-- Stage 9.4 — Event comments
-- ============================================================================

CREATE TABLE event_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE event_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_comments_select" ON event_comments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id
        AND (
          e.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM event_members em
            WHERE em.event_id = e.id AND em.user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "event_comments_insert" ON event_comments FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id
        AND (
          e.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM event_members em
            WHERE em.event_id = e.id AND em.user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "event_comments_update" ON event_comments FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "event_comments_delete" ON event_comments FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_event_comments_event_id ON event_comments(event_id);
CREATE INDEX idx_event_comments_created_at ON event_comments(created_at);
