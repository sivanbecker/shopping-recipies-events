-- Extend notification enums to include contact events
ALTER TYPE notification_entity_type ADD VALUE IF NOT EXISTS 'contact';
ALTER TYPE notification_type      ADD VALUE IF NOT EXISTS 'contact_added';

-- Trigger function: fires when accept_invitation inserts the contact row for the inviter.
-- We only notify the inviter (owner_id) — the invitee row they see immediately in the UI.
CREATE OR REPLACE FUNCTION notify_contact_added()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Only fire for rows that have a linked_user_id (i.e. created via invitation accept)
  IF NEW.linked_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (recipient_user_id, actor_user_id, entity_type, entity_id, notification_type, payload)
  VALUES (
    NEW.owner_id,
    NEW.linked_user_id,
    'contact',
    NEW.id,
    'contact_added',
    jsonb_build_object('name', NEW.name, 'label', NEW.label)
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_contact_added
AFTER INSERT ON contacts
FOR EACH ROW EXECUTE FUNCTION notify_contact_added();
