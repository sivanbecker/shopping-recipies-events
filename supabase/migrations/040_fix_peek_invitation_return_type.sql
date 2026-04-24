-- DROP required because CREATE OR REPLACE cannot change a function's return type.
-- Migration 038 attempted CREATE OR REPLACE to add invitee_email to the return set,
-- but the existing function signature (from 037) had a different RETURNS TABLE definition.
DROP FUNCTION IF EXISTS peek_invitation(text);

CREATE FUNCTION peek_invitation(p_token text)
RETURNS TABLE(inviter_name text, label text, status text, expires_at timestamptz, invitee_email text)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT p.display_name, ci.label, ci.status, ci.expires_at, ci.invitee_email
  FROM contact_invitations ci
  JOIN profiles p ON p.user_id = ci.inviter_id
  WHERE ci.token = p_token;
$$;
