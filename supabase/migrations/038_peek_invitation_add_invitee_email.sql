-- Extend peek_invitation to also return invitee_email so the accept page
-- can show which email address the invitation was sent to.
-- DROP required because CREATE OR REPLACE cannot change a function's RETURNS TABLE signature.
DROP FUNCTION IF EXISTS peek_invitation(text);

CREATE FUNCTION peek_invitation(p_token text)
RETURNS TABLE(inviter_name text, label text, status text, expires_at timestamptz, invitee_email text)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT p.display_name, ci.label, ci.status, ci.expires_at, ci.invitee_email
  FROM contact_invitations ci
  JOIN profiles p ON p.user_id = ci.inviter_id
  WHERE ci.token = p_token;
$$;
