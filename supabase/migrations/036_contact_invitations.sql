-- contact_invitations table
CREATE TABLE contact_invitations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token         text UNIQUE NOT NULL DEFAULT encode(uuid_send(gen_random_uuid()) || uuid_send(gen_random_uuid()), 'hex'),
  inviter_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email text NOT NULL,
  label         text CHECK (label IN ('family', 'friend')) DEFAULT NULL,
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'declined', 'revoked', 'expired')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL DEFAULT now() + interval '24 hours',
  accepted_at   timestamptz,
  invitee_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX contact_invitations_inviter_idx ON contact_invitations(inviter_id);
CREATE INDEX contact_invitations_token_idx   ON contact_invitations(token);
CREATE INDEX contact_invitations_email_idx   ON contact_invitations(invitee_email);

ALTER TABLE contact_invitations ENABLE ROW LEVEL SECURITY;

-- Inviter can see and manage their own invitations
CREATE POLICY "inviter_access" ON contact_invitations
  FOR ALL USING (inviter_id = auth.uid());

-- peek_invitation: public RPC — returns safe display data without requiring auth
CREATE OR REPLACE FUNCTION peek_invitation(p_token text)
RETURNS TABLE(inviter_name text, label text, status text, expires_at timestamptz)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT p.display_name, ci.label, ci.status, ci.expires_at
  FROM contact_invitations ci
  JOIN profiles p ON p.user_id = ci.inviter_id
  WHERE ci.token = p_token;
$$;

-- revoke_invitation: inviter-only; sets status to 'revoked'
CREATE OR REPLACE FUNCTION revoke_invitation(p_token text)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE contact_invitations
  SET status = 'revoked'
  WHERE token = p_token
    AND inviter_id = auth.uid()
    AND status = 'pending';
$$;
