-- Add user_id to family_members so members can be linked to auth accounts
-- Previously only family owners had an auth link (via families.user_id)

ALTER TABLE family_members ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);

-- Backfill: link existing owners to their auth accounts
UPDATE family_members fm
SET user_id = f.user_id
FROM families f
WHERE fm.family_id = f.id AND fm.is_owner = true AND fm.user_id IS NULL;

-- Update RLS helper to use family_members.user_id
CREATE OR REPLACE FUNCTION user_family_ids()
RETURNS SETOF TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT family_id FROM family_members WHERE user_id = auth.uid()
$$;

-- Update accept_invite_by_token to accept and store user_id
DROP FUNCTION IF EXISTS accept_invite_by_token(text, text, text, text, text, date);

CREATE OR REPLACE FUNCTION accept_invite_by_token(
  p_token TEXT,
  p_member_id TEXT,
  p_name TEXT,
  p_avatar TEXT,
  p_role TEXT,
  p_birthday DATE DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invite RECORD;
  v_family_id TEXT;
  v_existing_member RECORD;
BEGIN
  SELECT fi.*, f.name AS family_name
  INTO v_invite
  FROM family_invites fi
  JOIN families f ON f.id = fi.family_id
  WHERE fi.token = p_token;

  IF v_invite IS NULL THEN
    RETURN json_build_object('error', 'not_found');
  END IF;

  IF v_invite.expires_at < now() THEN
    UPDATE family_invites SET status = 'expired' WHERE id = v_invite.id AND status = 'pending';
    RETURN json_build_object('error', 'expired');
  END IF;

  IF v_invite.status != 'pending' THEN
    RETURN json_build_object('error', v_invite.status);
  END IF;

  -- Prevent joining multiple families
  IF p_user_id IS NOT NULL THEN
    SELECT * INTO v_existing_member FROM family_members WHERE user_id = p_user_id LIMIT 1;
    IF v_existing_member IS NOT NULL THEN
      RETURN json_build_object('error', 'already_member', 'familyName', v_invite.family_name);
    END IF;
  END IF;

  v_family_id := v_invite.family_id;

  INSERT INTO family_members (id, family_id, name, avatar, role, birthday, is_owner, user_id, created_at)
  VALUES (p_member_id, v_family_id, p_name, p_avatar, p_role, p_birthday, false, p_user_id, now());

  UPDATE family_invites SET status = 'accepted' WHERE id = v_invite.id;

  RETURN json_build_object('familyId', v_family_id, 'familyName', v_invite.family_name);
END;
$$;

GRANT EXECUTE ON FUNCTION accept_invite_by_token(text, text, text, text, text, date, uuid) TO authenticated;
