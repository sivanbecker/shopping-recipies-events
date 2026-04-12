-- ============================================================================
-- Stage 6 — Events schema
-- Creates all event-related tables, RLS policies, and indexes.
-- ============================================================================

-- Pre-configured guest contacts (per-user, reusable across events)
CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  party_size int NOT NULL DEFAULT 1,
  linked_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Global host equipment inventory (per-user)
CREATE TABLE host_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  label text NOT NULL,
  quantity_owned int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id, item_type)
);

-- Core events table (replaces the stub types from database.ts)
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date timestamptz NOT NULL,
  location text,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notes text,
  photo_album_url text,
  retro_enough_food text,
  retro_what_went_wrong text,
  retro_what_went_well text,
  retro_remember_next_time text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Event members (app users who can view/edit the event)
CREATE TABLE event_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'editor',
  UNIQUE(event_id, user_id)
);

-- Event invitees (picked from contacts or one-time)
CREATE TABLE event_invitees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone text,
  party_size int NOT NULL DEFAULT 1,
  confirmed boolean NOT NULL DEFAULT false,
  brings text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Per-event equipment needs
CREATE TABLE event_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  quantity_needed int NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  notes text
);

-- Recipes attached to event
CREATE TABLE event_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  servings_override int,
  is_dessert boolean NOT NULL DEFAULT false,
  UNIQUE(event_id, recipe_id)
);

-- Shopping lists linked to event
CREATE TABLE event_shopping_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  list_id uuid NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  UNIQUE(event_id, list_id)
);

-- ============================================================================
-- Enable RLS on all tables
-- ============================================================================

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_invitees ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_shopping_lists ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies — contacts (owner-only)
-- ============================================================================

CREATE POLICY "contacts_select" ON contacts FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "contacts_insert" ON contacts FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "contacts_update" ON contacts FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "contacts_delete" ON contacts FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- ============================================================================
-- RLS Policies — host_inventory (owner-only)
-- ============================================================================

CREATE POLICY "host_inventory_select" ON host_inventory FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "host_inventory_insert" ON host_inventory FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "host_inventory_update" ON host_inventory FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "host_inventory_delete" ON host_inventory FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- ============================================================================
-- RLS Policies — events (owner + members)
-- ============================================================================

CREATE POLICY "events_select" ON events FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM event_members em
      WHERE em.event_id = id AND em.user_id = auth.uid()
    )
  );

CREATE POLICY "events_insert" ON events FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "events_update" ON events FOR UPDATE TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM event_members em
      WHERE em.event_id = id AND em.user_id = auth.uid() AND em.role IN ('editor')
    )
  );

CREATE POLICY "events_delete" ON events FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- ============================================================================
-- RLS Policies — event_members (owner + self)
-- ============================================================================

CREATE POLICY "event_members_select" ON event_members FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id AND (e.owner_id = auth.uid()
        OR EXISTS (SELECT 1 FROM event_members em2 WHERE em2.event_id = e.id AND em2.user_id = auth.uid()))
    )
  );

CREATE POLICY "event_members_insert" ON event_members FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.owner_id = auth.uid())
  );

CREATE POLICY "event_members_delete" ON event_members FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.owner_id = auth.uid())
    OR user_id = auth.uid()
  );

-- ============================================================================
-- RLS Policies — event_invitees (event owner + members)
-- ============================================================================

CREATE POLICY "event_invitees_select" ON event_invitees FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id AND (e.owner_id = auth.uid()
        OR EXISTS (SELECT 1 FROM event_members em WHERE em.event_id = e.id AND em.user_id = auth.uid()))
    )
  );

CREATE POLICY "event_invitees_write" ON event_invitees FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id AND (e.owner_id = auth.uid()
        OR EXISTS (SELECT 1 FROM event_members em WHERE em.event_id = e.id AND em.user_id = auth.uid() AND em.role IN ('editor')))
    )
  );

-- ============================================================================
-- RLS Policies — event_equipment (event owner + members)
-- ============================================================================

CREATE POLICY "event_equipment_select" ON event_equipment FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id AND (e.owner_id = auth.uid()
        OR EXISTS (SELECT 1 FROM event_members em WHERE em.event_id = e.id AND em.user_id = auth.uid()))
    )
  );

CREATE POLICY "event_equipment_write" ON event_equipment FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id AND (e.owner_id = auth.uid()
        OR EXISTS (SELECT 1 FROM event_members em WHERE em.event_id = e.id AND em.user_id = auth.uid() AND em.role IN ('editor')))
    )
  );

-- ============================================================================
-- RLS Policies — event_recipes (event owner + members)
-- ============================================================================

CREATE POLICY "event_recipes_select" ON event_recipes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id AND (e.owner_id = auth.uid()
        OR EXISTS (SELECT 1 FROM event_members em WHERE em.event_id = e.id AND em.user_id = auth.uid()))
    )
  );

CREATE POLICY "event_recipes_write" ON event_recipes FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id AND (e.owner_id = auth.uid()
        OR EXISTS (SELECT 1 FROM event_members em WHERE em.event_id = e.id AND em.user_id = auth.uid() AND em.role IN ('editor')))
    )
  );

-- ============================================================================
-- RLS Policies — event_shopping_lists (event owner + members)
-- ============================================================================

CREATE POLICY "event_shopping_lists_select" ON event_shopping_lists FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id AND (e.owner_id = auth.uid()
        OR EXISTS (SELECT 1 FROM event_members em WHERE em.event_id = e.id AND em.user_id = auth.uid()))
    )
  );

CREATE POLICY "event_shopping_lists_write" ON event_shopping_lists FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id AND (e.owner_id = auth.uid()
        OR EXISTS (SELECT 1 FROM event_members em WHERE em.event_id = e.id AND em.user_id = auth.uid() AND em.role IN ('editor')))
    )
  );

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_contacts_owner_id ON contacts(owner_id);
CREATE INDEX idx_host_inventory_owner_id ON host_inventory(owner_id);
CREATE INDEX idx_events_owner_id ON events(owner_id);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_event_members_event_id ON event_members(event_id);
CREATE INDEX idx_event_members_user_id ON event_members(user_id);
CREATE INDEX idx_event_invitees_event_id ON event_invitees(event_id);
CREATE INDEX idx_event_invitees_contact_id ON event_invitees(contact_id);
CREATE INDEX idx_event_equipment_event_id ON event_equipment(event_id);
CREATE INDEX idx_event_recipes_event_id ON event_recipes(event_id);
CREATE INDEX idx_event_shopping_lists_event_id ON event_shopping_lists(event_id);
