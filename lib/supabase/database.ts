import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  AppStore,
  Family,
  Kid,
  Category,
  Action,
  Badge,
  Reward,
  Transaction,
  KidBadge,
  FamilyMember,
  FamilyInvite,
  JoinRequest,
  ProfileChangeRequest,
} from '@/types'
import { DEFAULT_STORE } from '@/lib/store'

// ── camelCase ↔ snake_case mapping ────────────────────────────────────────────

type RowMap = Record<string, unknown>

function toSnake(key: string): string {
  return key.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`)
}

function toCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function rowToSnake(obj: RowMap): RowMap {
  const out: RowMap = {}
  for (const [k, v] of Object.entries(obj)) {
    out[toSnake(k)] = v
  }
  return out
}

function rowToCamel<T>(obj: RowMap): T {
  const out: RowMap = {}
  for (const [k, v] of Object.entries(obj)) {
    out[toCamel(k)] = v
  }
  return out as T
}

function rowsToCamel<T>(rows: RowMap[]): T[] {
  return rows.map(r => rowToCamel<T>(r))
}

// ── Fetch all family data for a user ──────────────────────────────────────────

export async function fetchFamilyData(
  supabase: SupabaseClient,
  userId: string,
): Promise<AppStore> {
  // Look up the user's family via family_members.user_id (works for owners AND invited members)
  const { data: memberRows } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', userId)
    .limit(1)

  if (!memberRows || memberRows.length === 0) {
    return DEFAULT_STORE
  }

  const familyId = memberRows[0].family_id as string

  const { data: familyRows } = await supabase
    .from('families')
    .select('*')
    .eq('id', familyId)
    .limit(1)

  if (!familyRows || familyRows.length === 0) {
    return DEFAULT_STORE
  }

  const familyRow = familyRows[0]
  const family = rowToCamel<Family & { userId?: string }>(familyRow)
  // Strip the DB-only userId field from the Family type
  delete family.userId

  // Fetch all child tables in parallel
  const [
    { data: kidsRows },
    { data: categoriesRows },
    { data: actionsRows },
    { data: badgesRows },
    { data: rewardsRows },
    { data: transactionsRows },
    { data: kidBadgesRows },
    { data: membersRows },
    { data: invitesRows },
    { data: joinRequestsRows },
    { data: profileChangeRows },
  ] = await Promise.all([
    supabase.from('kids').select('*').eq('family_id', familyId),
    supabase.from('categories').select('*').eq('family_id', familyId),
    supabase.from('actions').select('*').eq('family_id', familyId),
    supabase.from('badges').select('*').eq('family_id', familyId),
    supabase.from('rewards').select('*').eq('family_id', familyId),
    supabase.from('transactions').select('*').in(
      'kid_id',
      // Subquery: get kid IDs belonging to this family
      (await supabase.from('kids').select('id').eq('family_id', familyId)).data?.map(k => k.id) ?? [],
    ),
    supabase.from('kid_badges').select('*').in(
      'kid_id',
      (await supabase.from('kids').select('id').eq('family_id', familyId)).data?.map(k => k.id) ?? [],
    ),
    supabase.from('family_members').select('*').eq('family_id', familyId),
    supabase.from('family_invites').select('*').eq('family_id', familyId),
    supabase.from('join_requests').select('*').eq('family_id', familyId),
    supabase.from('profile_change_requests').select('*').in(
      'member_id',
      (await supabase.from('family_members').select('id').eq('family_id', familyId)).data?.map(m => m.id) ?? [],
    ),
  ])

  return {
    family,
    kids: rowsToCamel<Kid>(kidsRows ?? []),
    categories: rowsToCamel<Category>(categoriesRows ?? []),
    actions: rowsToCamel<Action>(actionsRows ?? []),
    badges: rowsToCamel<Badge>(badgesRows ?? []),
    rewards: rowsToCamel<Reward>(rewardsRows ?? []),
    transactions: rowsToCamel<Transaction>(transactionsRows ?? []),
    kidBadges: rowsToCamel<KidBadge>(kidBadgesRows ?? []),
    familyMembers: rowsToCamel<FamilyMember>(membersRows ?? []),
    familyInvites: rowsToCamel<FamilyInvite>(invitesRows ?? []),
    joinRequests: rowsToCamel<JoinRequest>(joinRequestsRows ?? []),
    profileChangeRequests: rowsToCamel<ProfileChangeRequest>(profileChangeRows ?? []),
  }
}

// ── Individual CRUD operations ────────────────────────────────────────────────

// Families
export async function insertFamily(supabase: SupabaseClient, family: Family, userId: string) {
  const row = { ...rowToSnake(family as unknown as RowMap), user_id: userId }
  const { error } = await supabase.from('families').insert(row)
  if (error) throw error
}

export async function updateFamily(supabase: SupabaseClient, family: Family) {
  const { id, ...rest } = rowToSnake(family as unknown as RowMap)
  const { error } = await supabase.from('families').update(rest).eq('id', id)
  if (error) throw error
}

// Kids
export async function insertKid(supabase: SupabaseClient, kid: Kid) {
  const { error } = await supabase.from('kids').insert(rowToSnake(kid as unknown as RowMap))
  if (error) throw error
}

export async function updateKid(supabase: SupabaseClient, kid: Kid) {
  const { id, ...rest } = rowToSnake(kid as unknown as RowMap)
  const { error } = await supabase.from('kids').update(rest).eq('id', id)
  if (error) throw error
}

export async function deleteKid(supabase: SupabaseClient, kidId: string) {
  const { error } = await supabase.from('kids').delete().eq('id', kidId)
  if (error) throw error
}

// Categories
export async function insertCategory(supabase: SupabaseClient, category: Category) {
  const { error } = await supabase.from('categories').insert(rowToSnake(category as unknown as RowMap))
  if (error) throw error
}

export async function updateCategory(supabase: SupabaseClient, category: Category) {
  const { id, ...rest } = rowToSnake(category as unknown as RowMap)
  const { error } = await supabase.from('categories').update(rest).eq('id', id)
  if (error) throw error
}

export async function deleteCategory(supabase: SupabaseClient, categoryId: string) {
  const { error } = await supabase.from('categories').delete().eq('id', categoryId)
  if (error) throw error
}

// Actions
export async function insertAction(supabase: SupabaseClient, action: Action) {
  const { error } = await supabase.from('actions').insert(rowToSnake(action as unknown as RowMap))
  if (error) throw error
}

export async function updateAction(supabase: SupabaseClient, action: Action) {
  const { id, ...rest } = rowToSnake(action as unknown as RowMap)
  const { error } = await supabase.from('actions').update(rest).eq('id', id)
  if (error) throw error
}

// Badges
export async function insertBadge(supabase: SupabaseClient, badge: Badge) {
  const { error } = await supabase.from('badges').insert(rowToSnake(badge as unknown as RowMap))
  if (error) throw error
}

export async function updateBadge(supabase: SupabaseClient, badge: Badge) {
  const { id, ...rest } = rowToSnake(badge as unknown as RowMap)
  const { error } = await supabase.from('badges').update(rest).eq('id', id)
  if (error) throw error
}

export async function deleteBadge(supabase: SupabaseClient, badgeId: string) {
  const { error } = await supabase.from('badges').delete().eq('id', badgeId)
  if (error) throw error
}

// Rewards
export async function insertReward(supabase: SupabaseClient, reward: Reward) {
  const { error } = await supabase.from('rewards').insert(rowToSnake(reward as unknown as RowMap))
  if (error) throw error
}

export async function updateReward(supabase: SupabaseClient, reward: Reward) {
  const { id, ...rest } = rowToSnake(reward as unknown as RowMap)
  const { error } = await supabase.from('rewards').update(rest).eq('id', id)
  if (error) throw error
}

export async function deleteReward(supabase: SupabaseClient, rewardId: string) {
  const { error } = await supabase.from('rewards').delete().eq('id', rewardId)
  if (error) throw error
}

// Transactions
export async function insertTransaction(supabase: SupabaseClient, tx: Transaction) {
  const { error } = await supabase.from('transactions').insert(rowToSnake(tx as unknown as RowMap))
  if (error) throw error
}

export async function updateTransaction(supabase: SupabaseClient, tx: Partial<Transaction> & { id: string }) {
  const { id, ...rest } = rowToSnake(tx as unknown as RowMap)
  const { error } = await supabase.from('transactions').update(rest).eq('id', id)
  if (error) throw error
}

export async function deleteTransaction(supabase: SupabaseClient, txId: string) {
  const { error } = await supabase.from('transactions').delete().eq('id', txId)
  if (error) throw error
}

// Kid badges
export async function insertKidBadge(supabase: SupabaseClient, kb: KidBadge) {
  const { error } = await supabase.from('kid_badges').insert(rowToSnake(kb as unknown as RowMap))
  if (error) throw error
}

// Family members
export async function insertFamilyMember(supabase: SupabaseClient, member: FamilyMember, authUserId?: string) {
  const row = rowToSnake(member as unknown as RowMap)
  if (authUserId) row.user_id = authUserId
  const { error } = await supabase.from('family_members').insert(row)
  if (error) throw error
}

export async function updateFamilyMember(supabase: SupabaseClient, member: FamilyMember) {
  const { id, ...rest } = rowToSnake(member as unknown as RowMap)
  const { error } = await supabase.from('family_members').update(rest).eq('id', id)
  if (error) throw error
}

export async function deleteFamilyMember(supabase: SupabaseClient, memberId: string) {
  const { error } = await supabase.from('family_members').delete().eq('id', memberId)
  if (error) throw error
}

// Family invites
export async function insertFamilyInvite(supabase: SupabaseClient, invite: FamilyInvite) {
  const { error } = await supabase.from('family_invites').insert(rowToSnake(invite as unknown as RowMap))
  if (error) throw error
}

export async function updateFamilyInvite(supabase: SupabaseClient, invite: FamilyInvite) {
  const { id, ...rest } = rowToSnake(invite as unknown as RowMap)
  const { error } = await supabase.from('family_invites').update(rest).eq('id', id)
  if (error) throw error
}

export async function deleteFamilyInvite(supabase: SupabaseClient, inviteId: string) {
  const { error } = await supabase.from('family_invites').delete().eq('id', inviteId)
  if (error) throw error
}

// Join requests
export async function insertJoinRequest(supabase: SupabaseClient, req: JoinRequest) {
  const { error } = await supabase.from('join_requests').insert(rowToSnake(req as unknown as RowMap))
  if (error) throw error
}

export async function updateJoinRequest(supabase: SupabaseClient, req: JoinRequest) {
  const { id, ...rest } = rowToSnake(req as unknown as RowMap)
  const { error } = await supabase.from('join_requests').update(rest).eq('id', id)
  if (error) throw error
}

// Profile change requests
export async function insertProfileChangeRequest(supabase: SupabaseClient, req: ProfileChangeRequest) {
  const { error } = await supabase.from('profile_change_requests').insert(rowToSnake(req as unknown as RowMap))
  if (error) throw error
}

export async function updateProfileChangeRequest(supabase: SupabaseClient, req: ProfileChangeRequest) {
  const { id, ...rest } = rowToSnake(req as unknown as RowMap)
  const { error } = await supabase.from('profile_change_requests').update(rest).eq('id', id)
  if (error) throw error
}

// ── Migrate localStorage data to Supabase ─────────────────────────────────────

export async function migrateLocalToSupabase(
  supabase: SupabaseClient,
  userId: string,
  store: AppStore,
): Promise<void> {
  if (!store.family) return

  // 1. Insert family with user_id
  await insertFamily(supabase, store.family, userId)

  // 2. Insert entities that only depend on family
  await Promise.all([
    ...store.categories.map(c => insertCategory(supabase, c)),
    ...store.badges.map(b => insertBadge(supabase, b)),
    ...store.familyMembers.map(m => insertFamilyMember(supabase, m)),
  ])

  // 3. Insert entities that depend on categories/badges
  await Promise.all([
    ...store.actions.map(a => insertAction(supabase, a)),
    ...store.rewards.map(r => insertReward(supabase, r)),
    ...store.kids.map(k => insertKid(supabase, k)),
    ...store.familyInvites.map(i => insertFamilyInvite(supabase, i)),
    ...store.joinRequests.map(r => insertJoinRequest(supabase, r)),
  ])

  // 4. Insert entities that depend on kids/members
  await Promise.all([
    ...store.transactions.map(t => insertTransaction(supabase, t)),
    ...store.kidBadges.map(kb => insertKidBadge(supabase, kb)),
    ...store.profileChangeRequests.map(r => insertProfileChangeRequest(supabase, r)),
  ])
}
