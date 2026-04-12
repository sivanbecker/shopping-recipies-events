-- ============================================================================
-- Stage 6.2 — Add fields needed for event detail tabs
-- ============================================================================

-- event_invitees: transport tracking
ALTER TABLE event_invitees ADD COLUMN needs_transport boolean NOT NULL DEFAULT false;
ALTER TABLE event_invitees ADD COLUMN transport_by uuid REFERENCES event_invitees(id) ON DELETE SET NULL;

-- event_equipment: custom label + arrangement status
ALTER TABLE event_equipment ADD COLUMN label text;
ALTER TABLE event_equipment ADD COLUMN is_arranged boolean NOT NULL DEFAULT false;
