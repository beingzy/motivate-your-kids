-- Motivate Your Kids — Initial Supabase Schema
-- Mirrors the existing localStorage data model + new family_members & invites tables

-- ============================================================================
-- FAMILIES
-- ============================================================================
create table if not exists families (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- FAMILY MEMBERS (new — replaces trust-based role selection)
-- ============================================================================
create type member_relationship as enum (
  'mother', 'father', 'grandma', 'grandpa', 'aunt', 'uncle', 'other'
);

create table if not exists family_members (
  id             uuid primary key default gen_random_uuid(),
  family_id      uuid not null references families(id) on delete cascade,
  user_id        uuid references auth.users(id) on delete set null,
  email          text not null,
  display_name   text not null,
  relationship   member_relationship not null default 'mother',
  is_owner       boolean not null default false,
  joined_at      timestamptz not null default now()
);

create index idx_family_members_family on family_members(family_id);
create index idx_family_members_user   on family_members(user_id);
create unique index idx_family_members_email_family on family_members(email, family_id);

-- ============================================================================
-- INVITES (new — 24h expiry invite links)
-- ============================================================================
create type invite_status as enum ('pending', 'accepted', 'expired');

create table if not exists invites (
  id                 uuid primary key default gen_random_uuid(),
  family_id          uuid not null references families(id) on delete cascade,
  invited_by         uuid not null references family_members(id) on delete cascade,
  email              text,
  token              text not null unique,
  relationship       member_relationship not null default 'mother',
  status             invite_status not null default 'pending',
  created_at         timestamptz not null default now(),
  expires_at         timestamptz not null default (now() + interval '24 hours'),
  accepted_at        timestamptz
);

create index idx_invites_token  on invites(token);
create index idx_invites_family on invites(family_id);

-- ============================================================================
-- KIDS
-- ============================================================================
create table if not exists kids (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references families(id) on delete cascade,
  name          text not null,
  avatar        text not null default '🧒',
  color_accent  text not null default '#FFC800',
  wishlist      text[] default '{}',
  created_at    timestamptz not null default now()
);

create index idx_kids_family on kids(family_id);

-- ============================================================================
-- CATEGORIES
-- ============================================================================
create table if not exists categories (
  id        uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  name      text not null,
  icon      text not null default '📂'
);

create index idx_categories_family on categories(family_id);

-- ============================================================================
-- ACTIONS
-- ============================================================================
create table if not exists actions (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references families(id) on delete cascade,
  name          text not null,
  description   text not null default '',
  category_id   uuid references categories(id) on delete set null,
  points_value  integer not null default 1,
  is_deduction  boolean not null default false,
  badge_id      uuid,
  is_template   boolean not null default false,
  is_active     boolean not null default true
);

create index idx_actions_family on actions(family_id);

-- ============================================================================
-- BADGES
-- ============================================================================
create table if not exists badges (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families(id) on delete cascade,
  name        text not null,
  icon        text not null default '🏅',
  description text not null default ''
);

create index idx_badges_family on badges(family_id);

-- Add FK from actions.badge_id -> badges.id now that badges table exists
alter table actions
  add constraint fk_actions_badge foreign key (badge_id) references badges(id) on delete set null;

-- ============================================================================
-- REWARDS
-- ============================================================================
create table if not exists rewards (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families(id) on delete cascade,
  name        text not null,
  description text not null default '',
  points_cost integer not null default 10,
  is_active   boolean not null default true
);

create index idx_rewards_family on rewards(family_id);

-- ============================================================================
-- TRANSACTIONS
-- ============================================================================
create type transaction_type   as enum ('earn', 'redeem', 'deduct');
create type transaction_status as enum ('approved', 'pending', 'denied');

create table if not exists transactions (
  id         uuid primary key default gen_random_uuid(),
  kid_id     uuid not null references kids(id) on delete cascade,
  type       transaction_type not null,
  amount     integer not null,
  action_id  uuid references actions(id) on delete set null,
  reward_id  uuid references rewards(id) on delete set null,
  status     transaction_status not null default 'approved',
  timestamp  timestamptz not null default now(),
  note       text,
  reason     text
);

create index idx_transactions_kid       on transactions(kid_id);
create index idx_transactions_timestamp on transactions(timestamp desc);

-- ============================================================================
-- KID BADGES
-- ============================================================================
create table if not exists kid_badges (
  kid_id     uuid not null references kids(id) on delete cascade,
  badge_id   uuid not null references badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (kid_id, badge_id)
);

-- ============================================================================
-- RPC FUNCTIONS (SECURITY DEFINER — bypass RLS for controlled operations)
-- ============================================================================

-- Accept an invite: creates a family_member record and marks invite as accepted
create or replace function accept_invite(
  p_token text,
  p_user_id uuid,
  p_email text,
  p_display_name text,
  p_relationship member_relationship
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_invite invites%rowtype;
  v_family_id uuid;
begin
  -- Fetch and lock the invite
  select * into v_invite from invites where token = p_token for update;

  if v_invite is null then
    raise exception 'Invalid invite token';
  end if;

  if v_invite.status != 'pending' then
    raise exception 'Invite is %', v_invite.status;
  end if;

  if v_invite.expires_at < now() then
    update invites set status = 'expired' where id = v_invite.id;
    raise exception 'Invite has expired';
  end if;

  -- Check if user is already a member
  if exists (select 1 from family_members where user_id = p_user_id and family_id = v_invite.family_id) then
    raise exception 'Already a member of this family';
  end if;

  -- Create family member
  insert into family_members (family_id, user_id, email, display_name, relationship, is_owner)
  values (v_invite.family_id, p_user_id, p_email, p_display_name, p_relationship, false);

  -- Mark invite as accepted
  update invites set status = 'accepted', accepted_at = now() where id = v_invite.id;

  return v_invite.family_id;
end;
$$;

-- Validate an invite token (public, no auth required)
create or replace function validate_invite(p_token text)
returns json
language plpgsql
security definer
as $$
declare
  v_invite record;
begin
  select i.*, f.name as family_name
  into v_invite
  from invites i
  join families f on f.id = i.family_id
  where i.token = p_token;

  if v_invite is null then
    raise exception 'Invalid invite token';
  end if;

  if v_invite.expires_at < now() then
    if v_invite.status = 'pending' then
      update invites set status = 'expired' where id = v_invite.id;
    end if;
    raise exception 'Invite has expired';
  end if;

  if v_invite.status != 'pending' then
    raise exception 'Invite is %', v_invite.status;
  end if;

  return json_build_object(
    'id', v_invite.id,
    'family_id', v_invite.family_id,
    'family_name', v_invite.family_name,
    'relationship', v_invite.relationship,
    'expires_at', v_invite.expires_at
  );
end;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
alter table families       enable row level security;
alter table family_members enable row level security;
alter table invites        enable row level security;
alter table kids           enable row level security;
alter table categories     enable row level security;
alter table actions        enable row level security;
alter table badges         enable row level security;
alter table rewards        enable row level security;
alter table transactions   enable row level security;
alter table kid_badges     enable row level security;

-- Helper: get the family IDs the current user belongs to
create or replace function user_family_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select family_id from family_members where user_id = auth.uid()
$$;

-- FAMILIES: members can read their own families
create policy "Members can view their families"
  on families for select using (id in (select user_family_ids()));

create policy "Authenticated users can create families"
  on families for insert with check (auth.uid() is not null);

create policy "Owners can update their family"
  on families for update using (
    id in (select family_id from family_members where user_id = auth.uid() and is_owner = true)
  );

-- FAMILY MEMBERS: members can see co-members
create policy "Members can view family members"
  on family_members for select using (family_id in (select user_family_ids()));

create policy "Can insert own membership"
  on family_members for insert with check (auth.uid() is not null);

create policy "Members can update own record"
  on family_members for update using (user_id = auth.uid());

-- INVITES: owners can create, anyone with token can read
create policy "Family members can view invites"
  on invites for select using (family_id in (select user_family_ids()));

create policy "Family members can create invites"
  on invites for insert with check (family_id in (select user_family_ids()));

create policy "Anyone can read invite by token"
  on invites for select using (true);

create policy "Invite can be updated on accept"
  on invites for update using (true);

-- KIDS through KID_BADGES: family-scoped access
create policy "Family members can manage kids"
  on kids for all using (family_id in (select user_family_ids()));

create policy "Family members can manage categories"
  on categories for all using (family_id in (select user_family_ids()));

create policy "Family members can manage actions"
  on actions for all using (family_id in (select user_family_ids()));

create policy "Family members can manage badges"
  on badges for all using (family_id in (select user_family_ids()));

create policy "Family members can manage rewards"
  on rewards for all using (family_id in (select user_family_ids()));

create policy "Family members can manage transactions"
  on transactions for all using (
    kid_id in (select id from kids where family_id in (select user_family_ids()))
  );

create policy "Family members can manage kid badges"
  on kid_badges for all using (
    kid_id in (select id from kids where family_id in (select user_family_ids()))
  );
