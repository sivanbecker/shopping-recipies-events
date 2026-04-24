-- Unique constraint to support ON CONFLICT upserts in accept_invitation
ALTER TABLE contacts ADD CONSTRAINT contacts_owner_linked_unique UNIQUE (owner_id, linked_user_id);

-- accept_invitation: called by the invitee (authenticated).
-- SECURITY DEFINER so it can write to other users' contact rows.
CREATE OR REPLACE FUNCTION accept_invitation(p_token text, p_action text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_inv        contact_invitations%ROWTYPE;
  v_inviter_name   text;
  v_invitee_name   text;
  v_inviter_email  text;
BEGIN
  -- Lock the row
  SELECT * INTO v_inv
  FROM contact_invitations
  WHERE token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'invalid_token');
  END IF;

  IF v_inv.status <> 'pending' THEN
    RETURN jsonb_build_object('error', 'already_responded', 'status', v_inv.status);
  END IF;

  IF v_inv.expires_at < now() THEN
    UPDATE contact_invitations SET status = 'expired' WHERE id = v_inv.id;
    RETURN jsonb_build_object('error', 'expired');
  END IF;

  -- Verify the caller's email matches the invitee email
  IF lower((SELECT email FROM auth.users WHERE id = auth.uid())) <> lower(v_inv.invitee_email) THEN
    RETURN jsonb_build_object('error', 'email_mismatch');
  END IF;

  IF p_action = 'decline' THEN
    UPDATE contact_invitations SET status = 'declined' WHERE id = v_inv.id;
    RETURN jsonb_build_object('ok', true);
  END IF;

  -- action = 'accept'

  -- Resolve display names and inviter email
  SELECT display_name INTO v_inviter_name FROM profiles WHERE user_id = v_inv.inviter_id;
  SELECT display_name INTO v_invitee_name FROM profiles WHERE user_id = auth.uid();
  SELECT email       INTO v_inviter_email FROM auth.users WHERE id = v_inv.inviter_id;

  v_inviter_name  := coalesce(v_inviter_name, v_inviter_email, 'Unknown');
  v_invitee_name  := coalesce(v_invitee_name, v_inv.invitee_email, 'Unknown');

  -- Mark accepted
  UPDATE contact_invitations
  SET status = 'accepted', accepted_at = now(), invitee_id = auth.uid()
  WHERE id = v_inv.id;

  -- Upsert invitee → inviter's contacts
  INSERT INTO contacts (owner_id, name, email, label, linked_user_id)
  VALUES (v_inv.inviter_id, v_invitee_name, v_inv.invitee_email, v_inv.label, auth.uid())
  ON CONFLICT (owner_id, linked_user_id) DO UPDATE
    SET label = EXCLUDED.label, email = EXCLUDED.email;

  -- Upsert inviter → invitee's contacts
  INSERT INTO contacts (owner_id, name, email, label, linked_user_id)
  VALUES (auth.uid(), v_inviter_name, v_inviter_email, v_inv.label, v_inv.inviter_id)
  ON CONFLICT (owner_id, linked_user_id) DO UPDATE
    SET label = EXCLUDED.label, email = EXCLUDED.email;

  RETURN jsonb_build_object('ok', true, 'inviter_name', v_inviter_name);
END;
$$;
