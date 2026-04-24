-- notifications uses text CHECK constraints, not Postgres enum types.
-- Drop and recreate both constraints to add the contact values.

ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_entity_type_check,
  ADD CONSTRAINT notifications_entity_type_check
    CHECK (entity_type IN ('shopping_item', 'shopping_list', 'list_member', 'contact'));

ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_notification_type_check,
  ADD CONSTRAINT notifications_notification_type_check
    CHECK (notification_type IN (
      'item_added',
      'item_completed',
      'item_uncompleted',
      'item_quantity_changed',
      'list_renamed',
      'list_deleted',
      'list_restored',
      'member_added',
      'member_removed',
      'role_changed',
      'member_left',
      'contact_added'
    ));

-- Trigger function: fires when accept_invitation inserts the contact row for the inviter.
-- Only fires for rows with a linked_user_id (i.e. created via invitation accept).
CREATE OR REPLACE FUNCTION notify_contact_added()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
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
