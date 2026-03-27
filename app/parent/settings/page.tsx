'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useFamily } from '@/context/FamilyContext'
import { useLocale } from '@/context/LocaleContext'
import { createClient } from '@/lib/supabase/client'
import { clearStore } from '@/lib/store'
import { loadMeta, saveMeta } from '@/lib/meta'
import { Pencil } from 'lucide-react'
import { AvatarPicker } from '@/components/AvatarPicker'
import { AvatarDisplay } from '@/components/AvatarDisplay'
import { FramePicker } from '@/components/FramePicker'
import type { Category, FamilyRole, Gender, FamilyMember, FamilyInvite, Badge, Kid, TransactionType } from '@/types'

// ── Shared constants ────────────────────────────────────────────────────────

const ROLES: { value: FamilyRole; label: string; emoji: string }[] = [
  { value: 'mother', label: 'Mother', emoji: '👩' },
  { value: 'father', label: 'Father', emoji: '👨' },
  { value: 'grandma', label: 'Grandma', emoji: '👵' },
  { value: 'grandpa', label: 'Grandpa', emoji: '👴' },
  { value: 'aunt', label: 'Aunt', emoji: '👩‍🦰' },
  { value: 'uncle', label: 'Uncle', emoji: '👨‍🦱' },
  { value: 'nanny', label: 'Nanny', emoji: '🧑‍🍼' },
  { value: 'other', label: 'Other', emoji: '👤' },
]

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

const KID_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316']

const EMOJI_SUGGESTIONS = ['🏅', '🌟', '🔥', '💎', '🚀', '🦸', '🎯', '🏆', '🌈', '⚡']

const TABS = ['Members', 'Profiles', 'Badges', 'History'] as const
type Tab = typeof TABS[number]

function getRoleLabel(role: FamilyRole): string {
  return ROLES.find(r => r.value === role)?.label ?? role
}

function getRoleEmoji(role: FamilyRole): string {
  return ROLES.find(r => r.value === role)?.emoji ?? '👤'
}

function formatTime(ts: string): string {
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function computeAge(birthday: string): number {
  const bd = new Date(birthday)
  const now = new Date()
  let age = now.getFullYear() - bd.getFullYear()
  if (now.getMonth() < bd.getMonth() || (now.getMonth() === bd.getMonth() && now.getDate() < bd.getDate())) {
    age--
  }
  return age
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter()
  const {
    store,
    updateFamilyName,
    addCategory, removeCategory,
    requestProfileChange, approveProfileChange, denyProfileChange,
    updateFamilyMember, removeFamilyMember,
    createFamilyInvite, approveInvite, removeFamilyInvite,
    transferOwnership,
    approveJoinRequest, denyJoinRequest,
    addKid, updateKid, removeKid,
    addBadge, updateBadge, removeBadge, awardBadge,
    getBalance, getLifetimeStars,
  } = useFamily()
  const { locale, setLocale, t } = useLocale()

  const [activeTab, setActiveTab] = useState<Tab>('Members')
  const [soundEnabled, setSoundEnabled] = useState(() => loadMeta().soundEnabled)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetTyped, setResetTyped] = useState('')
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [catToDelete, setCatToDelete] = useState<Category | null>(null)
  const [catDeleteError, setCatDeleteError] = useState('')

  // Family name editing
  const [editingName, setEditingName] = useState(false)
  const [familyNameDraft, setFamilyNameDraft] = useState('')

  // Category management
  const [showAddCat, setShowAddCat] = useState(false)
  const [newCatEmoji, setNewCatEmoji] = useState('📚')
  const [newCatName, setNewCatName] = useState('')

  useEffect(() => {
    if (!store.family) router.replace('/')
  }, [store.family, router])

  if (!store.family) return null

  const currentMember = store.familyMembers.find(m => m.isOwner) ?? store.familyMembers[0]
  const isCurrentOwner = currentMember?.isOwner ?? false

  function startEditName() {
    setFamilyNameDraft(store.family!.name)
    setEditingName(true)
  }

  function saveFamilyName() {
    if (familyNameDraft.trim()) updateFamilyName(familyNameDraft.trim())
    setEditingName(false)
  }

  function handleAddCategory() {
    if (!newCatName.trim()) return
    addCategory({ name: newCatName.trim(), icon: newCatEmoji })
    setNewCatName('')
    setNewCatEmoji('📚')
    setShowAddCat(false)
  }

  function handleDeleteCategory(cat: Category) {
    const usedByAction = store.actions.some(a => a.categoryId === cat.id)
    if (usedByAction) {
      setCatDeleteError(`"${cat.name}" is used by one or more actions. Archive those actions first.`)
      setTimeout(() => setCatDeleteError(''), 4000)
      return
    }
    setCatToDelete(cat)
  }

  function confirmDeleteCategory() {
    if (!catToDelete) return
    removeCategory(catToDelete.id)
    setCatToDelete(null)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  function handleReset() {
    if (resetTyped !== 'DELETE') return
    clearStore()
    window.location.href = '/setup'
  }

  return (
    <main className="p-5 max-w-lg mx-auto pb-28">
      {/* Header */}
      <header className="pt-4 mb-4">
        <h1 className="text-2xl font-bold text-ink-primary">Settings</h1>
        <div className="flex items-center gap-2 mt-1">
          {editingName ? (
            <div className="flex gap-2 flex-1">
              <input
                autoFocus
                value={familyNameDraft}
                onChange={e => setFamilyNameDraft(e.target.value)}
                className="flex-1 rounded-xl border-2 border-line px-3 py-1.5 text-ink-primary text-sm outline-none focus:border-brand"
                onKeyDown={e => { if (e.key === 'Enter') saveFamilyName() }}
              />
              <button onClick={saveFamilyName} className="px-3 py-1.5 rounded-xl bg-brand text-white font-bold text-xs">Save</button>
              <button onClick={() => setEditingName(false)} className="text-ink-muted text-xs">Cancel</button>
            </div>
          ) : (
            <>
              <p className="text-ink-secondary text-sm">{store.family.name}</p>
              <button onClick={startEditName} className="text-brand text-xs font-medium">Edit</button>
              {store.family.uid && (
                <span className="text-ink-muted text-xs font-mono ml-auto">ID: {store.family.uid}</span>
              )}
            </>
          )}
        </div>
      </header>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto mb-5 -mx-5 px-5 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-brand text-white'
                : 'bg-white text-ink-secondary hover:bg-page border border-line-subtle'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Members' && (
        <MembersTab
          store={store}
          isCurrentOwner={isCurrentOwner}
          updateFamilyMember={updateFamilyMember}
          removeFamilyMember={removeFamilyMember}
          createFamilyInvite={createFamilyInvite}
          approveInvite={approveInvite}
          removeFamilyInvite={removeFamilyInvite}
          transferOwnership={transferOwnership}
          approveJoinRequest={approveJoinRequest}
          denyJoinRequest={denyJoinRequest}
        />
      )}
      {activeTab === 'Profiles' && (
        <ProfilesTab
          store={store}
          currentMember={currentMember}
          isCurrentOwner={isCurrentOwner}
          requestProfileChange={requestProfileChange}
          approveProfileChange={approveProfileChange}
          denyProfileChange={denyProfileChange}
          addKid={addKid}
          updateKid={updateKid}
          removeKid={removeKid}
          getBalance={getBalance}
          getLifetimeStars={getLifetimeStars}
        />
      )}
      {activeTab === 'Badges' && (
        <BadgesTab
          store={store}
          addBadge={addBadge}
          updateBadge={updateBadge}
          removeBadge={removeBadge}
          awardBadge={awardBadge}
        />
      )}
      {activeTab === 'History' && (
        <HistoryTab store={store} />
      )}

      {/* ── Footer section (always visible) ─────────────────────────────── */}
      <div className="mt-8 border-t border-line-subtle pt-6 flex flex-col gap-5">
        {/* Language */}
        <section className="bg-white rounded-2xl p-5 shadow-card">
          <h2 className="text-sm font-semibold text-brand uppercase tracking-wide mb-3">{t('settings.language')}</h2>
          <div className="flex rounded-xl overflow-hidden border-2 border-line-subtle">
            <button
              onClick={() => setLocale('en')}
              className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
                locale === 'en' ? 'bg-brand text-white' : 'text-brand hover:bg-page'
              }`}
            >
              {t('settings.lang.en')}
            </button>
            <button
              onClick={() => setLocale('zh')}
              className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
                locale === 'zh' ? 'bg-brand text-white' : 'text-brand hover:bg-page'
              }`}
            >
              {t('settings.lang.zh')}
            </button>
          </div>
        </section>

        {/* Sound */}
        <section className="bg-white rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-brand uppercase tracking-wide">Sound Effects</h2>
              <p className="text-ink-muted text-xs mt-1">Play sounds on earn, deduct, and redeem</p>
            </div>
            <button
              onClick={() => {
                const next = !soundEnabled
                setSoundEnabled(next)
                saveMeta({ soundEnabled: next })
              }}
              className={`w-12 h-7 rounded-full transition-colors relative outline-none focus:ring-2 focus:ring-brand/30 ${
                soundEnabled ? 'bg-brand' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                soundEnabled ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </section>

        {/* Categories */}
        <section className="bg-white rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-brand uppercase tracking-wide">Categories</h2>
            <button onClick={() => setShowAddCat(v => !v)} className="text-sm text-brand font-medium">
              {showAddCat ? 'Cancel' : '+ Add'}
            </button>
          </div>
          {showAddCat && (
            <div className="flex gap-2 mb-4">
              <input value={newCatEmoji} onChange={e => setNewCatEmoji(e.target.value)} maxLength={2}
                className="w-14 text-center rounded-xl border-2 border-line px-2 py-2 text-xl outline-none focus:border-brand" />
              <input autoFocus placeholder="Category name" value={newCatName} onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddCategory() }}
                className="flex-1 rounded-xl border-2 border-line px-3 py-2 text-ink-primary outline-none focus:border-brand" />
              <button onClick={handleAddCategory} disabled={!newCatName.trim()}
                className="px-4 py-2 rounded-xl bg-brand disabled:opacity-40 text-white font-bold text-sm">Add</button>
            </div>
          )}
          {store.categories.length === 0 ? (
            <p className="text-ink-muted text-sm text-center py-4">No categories yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {store.categories.map(cat => (
                <div key={cat.id} className="flex items-center gap-3 py-2 border-b border-line-subtle last:border-0">
                  <span className="text-xl">{cat.icon}</span>
                  <span className="flex-1 text-ink-primary font-medium">{cat.name}</span>
                  <button onClick={() => handleDeleteCategory(cat)} className="text-red-300 hover:text-red-500 text-sm">Remove</button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sign out */}
        <button
          onClick={() => setShowSignOutConfirm(true)}
          className="w-full py-3 rounded-2xl bg-white shadow-card text-red-500 font-bold hover:bg-red-50 transition-colors border border-line-subtle"
        >
          Sign Out
        </button>

        {/* Danger zone */}
        <section className="bg-red-50 rounded-2xl p-5 shadow-card border border-red-100">
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-3">{t('settings.danger')}</h2>
          <p className="text-red-600 text-sm mb-4">{t('settings.danger-description')}</p>
          {!showResetConfirm ? (
            <button onClick={() => { setShowResetConfirm(true); setResetTyped('') }}
              className="w-full py-3 rounded-2xl bg-red-100 hover:bg-red-200 text-red-600 font-bold transition-colors">
              {t('settings.reset')}
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-red-700 font-bold text-center">{t('settings.reset-confirm')}</p>
              <p className="text-red-600 text-xs text-center">Type <span className="font-mono font-bold">DELETE</span> to confirm.</p>
              <input
                type="text"
                value={resetTyped}
                onChange={e => setResetTyped(e.target.value)}
                placeholder="Type DELETE"
                className="w-full rounded-xl border-2 border-red-300 px-4 py-3 text-center text-red-700 font-mono font-bold outline-none focus:border-red-500"
              />
              <button onClick={handleReset} disabled={resetTyped !== 'DELETE'}
                className="w-full py-3 rounded-2xl bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-bold transition-colors">
                {t('settings.reset-yes')}
              </button>
              <button onClick={() => { setShowResetConfirm(false); setResetTyped('') }} className="text-center text-red-400 text-sm">
                Cancel
              </button>
            </div>
          )}
        </section>

        {/* Sign out confirmation modal */}
        {showSignOutConfirm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowSignOutConfirm(false)}>
            <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-w-lg mx-auto" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-ink-primary text-center">Sign out?</h2>
              <p className="text-sm text-ink-secondary text-center">Your family data is stored locally on this device and will still be here when you sign back in.</p>
              <button onClick={handleSignOut}
                className="w-full py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors">
                Sign Out
              </button>
              <button onClick={() => setShowSignOutConfirm(false)} className="text-center text-ink-muted text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* Category delete confirmation modal */}
        {catToDelete && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setCatToDelete(null)}>
            <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-w-lg mx-auto" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-ink-primary">Remove &ldquo;{catToDelete.name}&rdquo;?</h2>
              <p className="text-sm text-ink-secondary">This category will be permanently deleted. Actions in this category will become uncategorised.</p>
              <button onClick={confirmDeleteCategory}
                className="w-full py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors">
                Remove Category
              </button>
              <button onClick={() => setCatToDelete(null)} className="text-center text-ink-muted text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* Category error toast */}
        {catDeleteError && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-amber-100 border border-amber-300 text-amber-800 text-sm font-semibold px-5 py-3 rounded-xl shadow-lg">
            {catDeleteError}
          </div>
        )}
      </div>
    </main>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 1: Members
// ═══════════════════════════════════════════════════════════════════════════════

function MembersTab({
  store, isCurrentOwner,
  updateFamilyMember, removeFamilyMember,
  createFamilyInvite, approveInvite, removeFamilyInvite,
  transferOwnership, approveJoinRequest, denyJoinRequest,
}: {
  store: ReturnType<typeof useFamily>['store']
  isCurrentOwner: boolean
  updateFamilyMember: ReturnType<typeof useFamily>['updateFamilyMember']
  removeFamilyMember: ReturnType<typeof useFamily>['removeFamilyMember']
  createFamilyInvite: ReturnType<typeof useFamily>['createFamilyInvite']
  approveInvite: ReturnType<typeof useFamily>['approveInvite']
  removeFamilyInvite: ReturnType<typeof useFamily>['removeFamilyInvite']
  transferOwnership: ReturnType<typeof useFamily>['transferOwnership']
  approveJoinRequest: ReturnType<typeof useFamily>['approveJoinRequest']
  denyJoinRequest: ReturnType<typeof useFamily>['denyJoinRequest']
}) {
  const [editing, setEditing] = useState<FamilyMember | null>(null)
  const [editName, setEditName] = useState('')
  const [editAvatar, setEditAvatar] = useState('👩')
  const [editRole, setEditRole] = useState<FamilyRole>('mother')
  const [editBirthday, setEditBirthday] = useState('')
  const [showEditForm, setShowEditForm] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  const [showInvite, setShowInvite] = useState(false)
  const [inviteRole, setInviteRole] = useState<FamilyRole>('mother')
  const [inviteName, setInviteName] = useState('')
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)

  const [memberToRemove, setMemberToRemove] = useState<FamilyMember | null>(null)

  const [showTransfer, setShowTransfer] = useState(false)
  const [transferTargetId, setTransferTargetId] = useState<string | null>(null)
  const [confirmTransfer, setConfirmTransfer] = useState(false)

  const takenRoles = new Set(store.familyMembers.map(m => m.role))

  function getAvailableRoles(currentRole?: FamilyRole) {
    const singleOccupancy: FamilyRole[] = ['mother', 'father']
    return ROLES.filter(r => {
      if (singleOccupancy.includes(r.value) && takenRoles.has(r.value) && r.value !== currentRole) return false
      return true
    })
  }

  function openEdit(member: FamilyMember) {
    setEditing(member); setEditName(member.name); setEditAvatar(member.avatar)
    setEditRole(member.role); setEditBirthday(member.birthday ?? '')
    setShowEditForm(true); setShowAvatarPicker(false)
  }

  function handleEditSave() {
    if (!editName.trim() || !editing) return
    updateFamilyMember({ ...editing, name: editName.trim(), avatar: editAvatar, role: editRole, birthday: editBirthday || undefined })
    setShowEditForm(false)
  }

  function handleRemove(member: FamilyMember) {
    if (member.isOwner) return // owner cannot remove themselves
    setMemberToRemove(member)
  }

  function confirmRemove() {
    if (!memberToRemove) return
    removeFamilyMember(memberToRemove.id)
    setMemberToRemove(null)
  }

  function buildInviteUrl(invite: FamilyInvite, name?: string) {
    const base = `${window.location.origin}/invite/${invite.token}`
    const url = new URL(base)
    if (name?.trim()) url.searchParams.set('name', name.trim())
    return url.toString()
  }

  function handleCreateInvite() {
    const invite = createFamilyInvite(inviteRole)
    const url = buildInviteUrl(invite, inviteName)
    navigator.clipboard.writeText(url).then(() => {
      setCopiedInviteId(invite.id)
      setTimeout(() => setCopiedInviteId(null), 3000)
    }).catch(() => {})
    setInviteName('')
    setShowInvite(false)
  }

  function copyInviteLink(invite: FamilyInvite) {
    const url = buildInviteUrl(invite)
    navigator.clipboard.writeText(url).then(() => {
      setCopiedInviteId(invite.id)
      setTimeout(() => setCopiedInviteId(null), 3000)
    }).catch(() => {})
  }

  function copyFamilyCode() {
    if (!store.family?.displayCode) return
    navigator.clipboard.writeText(store.family.displayCode).then(() => {
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 3000)
    }).catch(() => {})
  }

  function handleTransfer() {
    if (!transferTargetId || !confirmTransfer) return
    transferOwnership(transferTargetId)
    setShowTransfer(false); setConfirmTransfer(false); setTransferTargetId(null)
  }

  const activeInvites = store.familyInvites.filter(i => new Date(i.expiresAt) > new Date())
  const pendingInvites = activeInvites.filter(i => i.status === 'pending_approval')
  const approvedInvites = activeInvites.filter(i => i.status === 'approved')
  const pendingJoinRequests = store.joinRequests.filter(r => r.status === 'pending')
  const transferCandidates = store.familyMembers.filter(m => !m.isOwner && m.role !== 'other')

  return (
    <div className="flex flex-col gap-5">
      {/* Family code card — always visible */}
      <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
        <p className="text-xs text-amber-700 font-bold uppercase tracking-wide mb-1">Family Code</p>
        {store.family?.displayCode ? (
          <>
            <p className="text-3xl font-mono font-black text-amber-800 tracking-widest mb-1">{store.family.displayCode}</p>
            <p className="text-xs text-amber-600 mb-3">Share this code so others can request to join your family</p>
            <button onClick={copyFamilyCode}
              className="px-4 py-1.5 rounded-lg bg-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-300 transition-colors">
              {copiedCode ? 'Copied!' : 'Copy Code'}
            </button>
          </>
        ) : store.family?.uid ? (
          <>
            <p className="text-3xl font-mono font-black text-amber-800 tracking-widest mb-1">{store.family.uid}</p>
            <p className="text-xs text-amber-600">Your family ID</p>
          </>
        ) : (
          <p className="text-xs text-amber-600 py-2">No family code — re-create your family to get one.</p>
        )}
      </section>

      {/* Pending join requests */}
      {isCurrentOwner && pendingJoinRequests.length > 0 && (
        <section className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-3">
            Join Requests ({pendingJoinRequests.length})
          </h2>
          <div className="flex flex-col gap-2">
            {pendingJoinRequests.map(req => (
              <div key={req.id} className="bg-white rounded-xl p-3 flex items-center gap-3">
                <AvatarDisplay avatar={req.requesterAvatar} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink-primary text-sm">{req.requesterName}</p>
                  <p className="text-xs text-ink-secondary">{getRoleEmoji(req.requestedRole)} {getRoleLabel(req.requestedRole)}</p>
                </div>
                <button onClick={() => approveJoinRequest(req.id)}
                  className="px-3 py-1 rounded-lg bg-green-500 text-white text-xs font-bold">Approve</button>
                <button onClick={() => denyJoinRequest(req.id)}
                  className="px-3 py-1 rounded-lg bg-red-100 text-red-500 text-xs font-bold">Deny</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pending invite approvals */}
      {isCurrentOwner && pendingInvites.length > 0 && (
        <section className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-purple-700 uppercase tracking-wide mb-3">
            Invites Awaiting Approval ({pendingInvites.length})
          </h2>
          <div className="flex flex-col gap-2">
            {pendingInvites.map(invite => (
              <div key={invite.id} className="bg-white rounded-xl p-3 flex items-center gap-3">
                <span className="text-lg">{getRoleEmoji(invite.role)}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-primary">{getRoleLabel(invite.role)} invite</p>
                </div>
                <button onClick={() => approveInvite(invite.id)}
                  className="px-3 py-1 rounded-lg bg-green-500 text-white text-xs font-bold">Approve</button>
                <button onClick={() => removeFamilyInvite(invite.id)}
                  className="text-red-300 hover:text-red-500 text-xs">Delete</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Members list */}
      <section>
        <h2 className="text-sm font-semibold text-brand uppercase tracking-wide mb-3">Members</h2>
        {store.familyMembers.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-5xl mb-3">👨‍👩‍👧</div>
            <p className="text-ink-secondary mb-1">No family members yet.</p>
            <p className="text-xs text-ink-muted">Create an invite link below to add caregivers.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {store.familyMembers.map(member => (
              <div key={member.id} className="bg-white rounded-2xl p-4 shadow-card flex items-center gap-3">
                {isCurrentOwner ? (
                  <button type="button" onClick={() => openEdit(member)} className="relative flex-shrink-0">
                    <AvatarDisplay avatar={member.avatar} size={48} />
                    <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center shadow-md">
                      <Pencil size={10} />
                    </span>
                  </button>
                ) : (
                  <AvatarDisplay avatar={member.avatar} size={48} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-ink-primary">{member.name}</p>
                    {member.isOwner && (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md">Owner</span>
                    )}
                  </div>
                  <p className="text-sm text-ink-secondary">{getRoleEmoji(member.role)} {getRoleLabel(member.role)}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {isCurrentOwner && (
                    <button onClick={() => openEdit(member)} className="text-ink-muted hover:text-ink-secondary text-sm">Edit</button>
                  )}
                  {isCurrentOwner && !member.isOwner && (
                    <button onClick={() => handleRemove(member)} className="text-red-300 hover:text-red-500 text-sm">Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Invite links */}
      <section className="bg-white rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-brand uppercase tracking-wide">Invite Links</h2>
          <button onClick={() => setShowInvite(true)} className="text-sm text-brand font-medium">+ Create</button>
        </div>
        {approvedInvites.length === 0 ? (
          <p className="text-ink-muted text-sm text-center py-3">No active invites.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {approvedInvites.map(invite => {
              const expiresIn = Math.max(0, Math.round((new Date(invite.expiresAt).getTime() - Date.now()) / 3600000))
              return (
                <div key={invite.id} className="flex items-center gap-3 py-2 border-b border-line-subtle last:border-0">
                  <span className="text-lg">{getRoleEmoji(invite.role)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-ink-primary text-sm font-medium">{getRoleLabel(invite.role)}</p>
                    <p className="text-ink-muted text-xs">Expires in {expiresIn}h</p>
                  </div>
                  <button onClick={() => copyInviteLink(invite)}
                    className="px-3 py-1 rounded-lg bg-brand-light text-brand text-xs font-bold hover:bg-brand hover:text-white transition-colors">
                    {copiedInviteId === invite.id ? 'Copied!' : 'Copy Link'}
                  </button>
                  <button onClick={() => removeFamilyInvite(invite.id)} className="text-red-300 hover:text-red-500 text-xs">Delete</button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Transfer ownership */}
      {isCurrentOwner && transferCandidates.length > 0 && (
        <section className="bg-white rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-brand uppercase tracking-wide">Ownership</h2>
            <button onClick={() => setShowTransfer(true)} className="text-sm text-ink-muted font-medium">Transfer</button>
          </div>
          <p className="text-ink-muted text-xs">You can transfer ownership to another parent if needed.</p>
        </section>
      )}

      {/* ── Modals ────────────────────────────────────────────────────── */}

      {/* Edit member modal */}
      {showEditForm && editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowEditForm(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto max-w-lg mx-auto"
            onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-ink-primary">Edit Member</h2>

            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-2 uppercase tracking-wide">Avatar</label>
              {showAvatarPicker ? (
                <AvatarPicker value={editAvatar} onChange={v => { setEditAvatar(v); setShowAvatarPicker(false) }} />
              ) : (
                <button type="button" onClick={() => setShowAvatarPicker(true)}
                  className="flex items-center gap-3 w-full p-3 rounded-xl border-2 border-line hover:border-brand transition-colors">
                  <AvatarDisplay avatar={editAvatar} size={48} />
                  <span className="text-sm text-brand font-medium">Tap to change avatar</span>
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-1.5 uppercase tracking-wide">Name</label>
              <input autoFocus autoComplete="off" value={editName} onChange={e => setEditName(e.target.value)} placeholder="e.g. Sarah"
                className="w-full rounded-xl border-2 border-line px-4 py-3 text-ink-primary outline-none focus:border-brand" />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-2 uppercase tracking-wide">Relationship to kids</label>
              <div className="grid grid-cols-4 gap-2">
                {getAvailableRoles(editing.role).map(r => (
                  <button key={r.value} type="button" onClick={() => setEditRole(r.value)}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 text-xs font-medium transition-all ${
                      editRole === r.value ? 'border-brand bg-brand-light text-brand' : 'border-line text-ink-secondary'
                    }`}>
                    <span className="text-lg">{r.emoji}</span><span>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-1.5 uppercase tracking-wide">Birthday (optional)</label>
              <input type="date" value={editBirthday} onChange={e => setEditBirthday(e.target.value)}
                className="w-full rounded-xl border-2 border-line px-4 py-3 text-ink-primary outline-none focus:border-brand" />
            </div>

            <button onClick={handleEditSave} disabled={!editName.trim()}
              className="w-full py-3 rounded-2xl bg-brand hover:bg-brand-hover disabled:opacity-40 text-white font-bold">
              Save Changes
            </button>
            <button onClick={() => setShowEditForm(false)} className="text-center text-ink-muted text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Remove member confirmation modal */}
      {memberToRemove && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setMemberToRemove(null)}>
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-w-lg mx-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <AvatarDisplay avatar={memberToRemove.avatar} size={48} />
              <div>
                <h2 className="text-lg font-bold text-ink-primary">Remove {memberToRemove.name}?</h2>
                <p className="text-sm text-ink-secondary">{getRoleEmoji(memberToRemove.role)} {getRoleLabel(memberToRemove.role)}</p>
              </div>
            </div>
            <p className="text-sm text-ink-secondary bg-red-50 rounded-xl px-4 py-3 text-red-700">
              This will remove {memberToRemove.name} from the family. They won&apos;t be able to manage kids or log actions. This cannot be undone.
            </p>
            <button onClick={confirmRemove}
              className="w-full py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors">
              Remove {memberToRemove.name}
            </button>
            <button onClick={() => setMemberToRemove(null)} className="text-center text-ink-muted text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Create invite modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowInvite(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-w-lg mx-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-ink-primary">Create Invite Link</h2>
            {!isCurrentOwner && (
              <p className="text-amber-600 text-xs bg-amber-50 rounded-xl px-3 py-2">
                The family owner will need to approve this invite before it becomes active.
              </p>
            )}
            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-2 uppercase tracking-wide">Role for invitee</label>
              <div className="grid grid-cols-4 gap-2">
                {ROLES.map(r => (
                  <button key={r.value} type="button" onClick={() => setInviteRole(r.value)}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 text-xs font-medium transition-all ${
                      inviteRole === r.value ? 'border-brand bg-brand-light text-brand' : 'border-line text-ink-secondary'
                    }`}>
                    <span className="text-lg">{r.emoji}</span><span>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-2 uppercase tracking-wide">Invitee name (optional)</label>
              <input
                type="text"
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
                placeholder="e.g. Grandma Susan"
                className="w-full border-2 border-line rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand"
              />
              <p className="text-xs text-ink-muted mt-1">Pre-fills the name field when they open the invite link.</p>
            </div>
            <button onClick={handleCreateInvite}
              className="w-full py-3 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold">Create & Copy Link</button>
            <button onClick={() => setShowInvite(false)} className="text-center text-ink-muted text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Transfer ownership modal */}
      {showTransfer && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => { setShowTransfer(false); setConfirmTransfer(false) }}>
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-w-lg mx-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-ink-primary">Transfer Ownership</h2>
            <p className="text-sm text-ink-secondary">Choose a family member to become the new owner.</p>
            <div className="flex flex-col gap-2">
              {transferCandidates.map(m => (
                <button key={m.id} onClick={() => { setTransferTargetId(m.id); setConfirmTransfer(false) }}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    transferTargetId === m.id ? 'border-brand bg-brand-light' : 'border-line'
                  }`}>
                  <AvatarDisplay avatar={m.avatar} size={36} />
                  <div className="text-left">
                    <p className="font-bold text-ink-primary text-sm">{m.name}</p>
                    <p className="text-xs text-ink-secondary">{getRoleEmoji(m.role)} {getRoleLabel(m.role)}</p>
                  </div>
                </button>
              ))}
            </div>
            {transferTargetId && !confirmTransfer && (
              <button onClick={() => setConfirmTransfer(true)}
                className="w-full py-3 rounded-2xl bg-amber-500 text-white font-bold">
                Transfer to {transferCandidates.find(m => m.id === transferTargetId)?.name}
              </button>
            )}
            {confirmTransfer && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-red-700 text-sm font-bold text-center mb-3">Are you sure? This cannot be easily undone.</p>
                <button onClick={handleTransfer}
                  className="w-full py-3 rounded-2xl bg-red-500 text-white font-bold">Yes, transfer ownership</button>
              </div>
            )}
            <button onClick={() => { setShowTransfer(false); setConfirmTransfer(false) }}
              className="text-center text-ink-muted text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 2: Profiles
// ═══════════════════════════════════════════════════════════════════════════════

function ProfilesTab({
  store, currentMember, isCurrentOwner,
  requestProfileChange, approveProfileChange, denyProfileChange,
  addKid, updateKid, removeKid, getBalance, getLifetimeStars,
}: {
  store: ReturnType<typeof useFamily>['store']
  currentMember: FamilyMember | undefined
  isCurrentOwner: boolean
  requestProfileChange: ReturnType<typeof useFamily>['requestProfileChange']
  approveProfileChange: ReturnType<typeof useFamily>['approveProfileChange']
  denyProfileChange: ReturnType<typeof useFamily>['denyProfileChange']
  addKid: ReturnType<typeof useFamily>['addKid']
  updateKid: ReturnType<typeof useFamily>['updateKid']
  removeKid: ReturnType<typeof useFamily>['removeKid']
  getBalance: ReturnType<typeof useFamily>['getBalance']
  getLifetimeStars: ReturnType<typeof useFamily>['getLifetimeStars']
}) {
  // Account edit state
  const [showAccountEdit, setShowAccountEdit] = useState(false)
  const [acctAvatar, setAcctAvatar] = useState('')
  const [acctBirthday, setAcctBirthday] = useState('')
  const [acctGender, setAcctGender] = useState<Gender | ''>('')
  const [acctRole, setAcctRole] = useState<FamilyRole>('mother')
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [birthdayConfirmed, setBirthdayConfirmed] = useState(false)
  const [showBirthdayConfirm, setShowBirthdayConfirm] = useState(false)

  // Kid edit state
  const [showKidForm, setShowKidForm] = useState(false)
  const [editingKid, setEditingKid] = useState<Kid | null>(null)
  const [kidDraft, setKidDraft] = useState({ name: '', avatar: '🧒', colorAccent: KID_COLORS[0], avatarFrame: 'none', birthday: '', gender: '' as Gender | '', hobbies: '' })
  const [kidToRemove, setKidToRemove] = useState<Kid | null>(null)
  const [birthdayError, setBirthdayError] = useState('')

  function canEditBirthday(): boolean {
    if (!currentMember?.birthdayUpdatedAt) return true
    const lastUpdate = new Date(currentMember.birthdayUpdatedAt)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    return lastUpdate <= oneYearAgo
  }

  function openAccountEdit(openPicker = false) {
    if (!currentMember) return
    setAcctAvatar(currentMember.avatar)
    setAcctBirthday(currentMember.birthday ?? '')
    setAcctGender((currentMember.gender as Gender) ?? '')
    setAcctRole(currentMember.role)
    setShowAccountEdit(true)
    setShowAvatarPicker(openPicker)
    setBirthdayConfirmed(false)
    setShowBirthdayConfirm(false)
  }

  function handleAccountSave() {
    if (!currentMember) return
    const changes: Partial<Pick<FamilyMember, 'avatar' | 'birthday' | 'gender' | 'role'>> = {}
    if (acctAvatar !== currentMember.avatar) changes.avatar = acctAvatar
    if (acctGender && acctGender !== currentMember.gender) changes.gender = acctGender as Gender
    if (acctRole !== currentMember.role) changes.role = acctRole

    const birthdayChanged = acctBirthday !== (currentMember.birthday ?? '')
    if (birthdayChanged && acctBirthday) {
      if (!currentMember.birthday && !birthdayConfirmed) {
        setShowBirthdayConfirm(true)
        return
      }
      if (!canEditBirthday()) { setBirthdayError('Birthday can only be updated once per year.'); setTimeout(() => setBirthdayError(''), 4000); return }
      changes.birthday = acctBirthday
    }

    if (Object.keys(changes).length === 0) { setShowAccountEdit(false); return }
    requestProfileChange(currentMember.id, changes)
    setShowAccountEdit(false)
  }

  function openKidNew() {
    setEditingKid(null)
    setKidDraft({ name: '', avatar: '🧒', colorAccent: KID_COLORS[0], avatarFrame: 'none', birthday: '', gender: '', hobbies: '' })
    setShowKidForm(true)
  }

  function openKidEdit(kid: Kid) {
    setEditingKid(kid)
    setKidDraft({
      name: kid.name,
      avatar: kid.avatar,
      colorAccent: kid.colorAccent,
      avatarFrame: kid.avatarFrame ?? 'none',
      birthday: kid.birthday ?? '',
      gender: kid.gender ?? '',
      hobbies: kid.hobbies?.join(', ') ?? '',
    })
    setShowKidForm(true)
  }

  function handleKidSave() {
    if (!kidDraft.name.trim()) return
    const hobbiesArr = kidDraft.hobbies.split(',').map(h => h.trim()).filter(Boolean)
    if (editingKid) {
      updateKid({
        ...editingKid,
        name: kidDraft.name.trim(),
        avatar: kidDraft.avatar,
        colorAccent: kidDraft.colorAccent,
        avatarFrame: kidDraft.avatarFrame,
        birthday: kidDraft.birthday || undefined,
        gender: (kidDraft.gender || undefined) as Gender | undefined,
        hobbies: hobbiesArr.length > 0 ? hobbiesArr : undefined,
      })
    } else {
      addKid({
        name: kidDraft.name.trim(),
        avatar: kidDraft.avatar,
        colorAccent: kidDraft.colorAccent,
        avatarFrame: kidDraft.avatarFrame,
        birthday: kidDraft.birthday || undefined,
        gender: (kidDraft.gender || undefined) as Gender | undefined,
        hobbies: hobbiesArr.length > 0 ? hobbiesArr : undefined,
      })
    }
    setShowKidForm(false)
  }

  const pendingProfileChanges = store.profileChangeRequests.filter(r => r.status === 'pending')

  return (
    <div className="flex flex-col gap-5">
      {/* My Profile */}
      {currentMember && (
        <section className="bg-white rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-brand uppercase tracking-wide">My Profile</h2>
            <button onClick={() => openAccountEdit()} className="text-sm text-brand font-medium">Edit</button>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => openAccountEdit(true)} className="relative flex-shrink-0">
              <AvatarDisplay avatar={currentMember.avatar} size={64} />
              <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center shadow-md">
                <Pencil size={12} />
              </span>
            </button>
            <div className="flex-1">
              <p className="font-bold text-ink-primary text-lg">{currentMember.name}</p>
              <div className="flex flex-wrap gap-2 mt-1 text-xs text-ink-secondary">
                <span>{getRoleEmoji(currentMember.role)} {getRoleLabel(currentMember.role)}</span>
                {currentMember.gender && (
                  <span className="text-ink-muted">· {GENDERS.find(g => g.value === currentMember.gender)?.label}</span>
                )}
                {currentMember.birthday && (
                  <span className="text-ink-muted">· 🎂 {currentMember.birthday}</span>
                )}
              </div>
              {currentMember.isOwner && (
                <span className="inline-block mt-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md">Owner</span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Pending profile change requests (owner only) */}
      {isCurrentOwner && pendingProfileChanges.length > 0 && (
        <section className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-3">
            Profile Change Requests ({pendingProfileChanges.length})
          </h2>
          <div className="flex flex-col gap-2">
            {pendingProfileChanges.map(req => {
              const member = store.familyMembers.find(m => m.id === req.memberId)
              if (!member) return null
              const changeLabels: string[] = []
              if (req.changes.avatar) changeLabels.push('avatar')
              if (req.changes.birthday) changeLabels.push(`birthday → ${req.changes.birthday}`)
              if (req.changes.gender) changeLabels.push(`gender → ${GENDERS.find(g => g.value === req.changes.gender)?.label}`)
              if (req.changes.role) changeLabels.push(`role → ${ROLES.find(r => r.value === req.changes.role)?.label}`)
              return (
                <div key={req.id} className="bg-white rounded-xl p-3 flex items-center gap-3">
                  <AvatarDisplay avatar={member.avatar} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-ink-primary text-sm">{member.name}</p>
                    <p className="text-xs text-ink-secondary truncate">{changeLabels.join(', ')}</p>
                  </div>
                  <button onClick={() => approveProfileChange(req.id)}
                    className="px-3 py-1 rounded-lg bg-green-500 text-white text-xs font-bold">Approve</button>
                  <button onClick={() => denyProfileChange(req.id)}
                    className="px-3 py-1 rounded-lg bg-red-100 text-red-500 text-xs font-bold">Deny</button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Kid profiles */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-brand uppercase tracking-wide">Kids</h2>
          <button onClick={openKidNew} className="px-3 py-1.5 rounded-xl bg-brand text-white font-bold text-xs">+ Add Kid</button>
        </div>

        {store.kids.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-5xl mb-3">👦</div>
            <p className="text-ink-secondary">No kids added yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {store.kids.map(kid => (
              <div key={kid.id} className="bg-white rounded-2xl p-4 shadow-card border-l-4 flex items-center gap-4"
                style={{ borderColor: kid.colorAccent }}>
                <button type="button" onClick={() => openKidEdit(kid)} className="relative flex-shrink-0">
                  <AvatarDisplay avatar={kid.avatar} size={52} frame={kid.avatarFrame} />
                  <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center shadow-md">
                    <Pencil size={10} />
                  </span>
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink-primary">{kid.name}</p>
                  <div className="flex flex-wrap gap-1.5 text-xs text-ink-secondary mt-0.5">
                    <span>⭐ {getBalance(kid.id)} stars</span>
                    {kid.birthday && <span className="text-ink-muted">· {computeAge(kid.birthday)} yrs</span>}
                    {kid.gender && <span className="text-ink-muted">· {kid.gender}</span>}
                  </div>
                  {kid.hobbies && kid.hobbies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {kid.hobbies.map(h => (
                        <span key={h} className="px-2 py-0.5 bg-page rounded-full text-[10px] text-ink-secondary font-medium">{h}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openKidEdit(kid)} className="text-ink-muted hover:text-ink-secondary text-sm">Edit</button>
                  <button onClick={() => setKidToRemove(kid)} className="text-red-300 hover:text-red-500 text-sm">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Modals ────────────────────────────────────────────────────── */}

      {/* Account edit modal */}
      {showAccountEdit && currentMember && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowAccountEdit(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto max-w-lg mx-auto"
            onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-ink-primary">Edit My Profile</h2>
            {!isCurrentOwner && (
              <p className="text-amber-600 text-xs bg-amber-50 rounded-xl px-3 py-2">Changes require approval from the family owner.</p>
            )}

            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-2 uppercase tracking-wide">Avatar</label>
              {showAvatarPicker ? (
                <AvatarPicker value={acctAvatar} onChange={v => { setAcctAvatar(v); setShowAvatarPicker(false) }} />
              ) : (
                <button type="button" onClick={() => setShowAvatarPicker(true)}
                  className="flex items-center gap-3 w-full p-3 rounded-xl border-2 border-line hover:border-brand transition-colors">
                  <AvatarDisplay avatar={acctAvatar} size={48} />
                  <span className="text-sm text-brand font-medium">Tap to change</span>
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-2 uppercase tracking-wide">Gender</label>
              <div className="grid grid-cols-2 gap-2">
                {GENDERS.map(g => (
                  <button key={g.value} type="button" onClick={() => setAcctGender(g.value)}
                    className={`py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      acctGender === g.value ? 'border-brand bg-brand-light text-brand' : 'border-line text-ink-secondary'
                    }`}>{g.label}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-1.5 uppercase tracking-wide">
                Birthday
                {!canEditBirthday() && <span className="text-red-400 ml-2 normal-case">(locked — once per year)</span>}
              </label>
              <input type="date" value={acctBirthday}
                onChange={e => { setAcctBirthday(e.target.value); setBirthdayConfirmed(false) }}
                disabled={!canEditBirthday()}
                className="w-full rounded-xl border-2 border-line px-4 py-3 text-ink-primary outline-none focus:border-brand disabled:opacity-50" />
            </div>

            {showBirthdayConfirm && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-amber-800 text-sm font-bold mb-2">Confirm your birthday</p>
                <p className="text-amber-700 text-xs mb-3">
                  Once set, it can only be changed once per year. Is <strong>{acctBirthday}</strong> correct?
                </p>
                <div className="flex gap-2">
                  <button onClick={() => { setBirthdayConfirmed(true); setShowBirthdayConfirm(false) }}
                    className="flex-1 py-2 rounded-lg bg-brand text-white font-bold text-sm">Yes, confirm</button>
                  <button onClick={() => { setShowBirthdayConfirm(false); setAcctBirthday(currentMember.birthday ?? '') }}
                    className="flex-1 py-2 rounded-lg bg-white border border-line text-ink-secondary font-bold text-sm">Cancel</button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-2 uppercase tracking-wide">Relationship to kids</label>
              <div className="grid grid-cols-4 gap-2">
                {ROLES.map(r => (
                  <button key={r.value} type="button" onClick={() => setAcctRole(r.value)}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 text-xs font-medium transition-all ${
                      acctRole === r.value ? 'border-brand bg-brand-light text-brand' : 'border-line text-ink-secondary'
                    }`}>
                    <span className="text-lg">{r.emoji}</span><span>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleAccountSave}
              className="w-full py-3 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold">
              {isCurrentOwner ? 'Save Changes' : 'Submit for Approval'}
            </button>
            <button onClick={() => setShowAccountEdit(false)} className="text-center text-ink-muted text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Kid edit modal */}
      {showKidForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowKidForm(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto max-w-lg mx-auto"
            onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-ink-primary">{editingKid ? 'Edit Kid' : 'Add a Kid'}</h2>

            <input autoFocus placeholder="Kid's name" value={kidDraft.name}
              onChange={e => setKidDraft(d => ({ ...d, name: e.target.value }))}
              className="rounded-xl border-2 border-line px-3 py-2 text-ink-primary outline-none focus:border-brand" />

            <div>
              <p className="text-sm font-medium text-ink-secondary mb-2">Avatar</p>
              <AvatarPicker value={kidDraft.avatar} onChange={avatar => setKidDraft(d => ({ ...d, avatar }))} />
            </div>

            <div>
              <p className="text-sm font-medium text-ink-secondary mb-2">Avatar Frame</p>
              <FramePicker
                avatar={kidDraft.avatar}
                value={kidDraft.avatarFrame}
                onChange={avatarFrame => setKidDraft(d => ({ ...d, avatarFrame }))}
                lifetimeStars={editingKid ? getLifetimeStars(editingKid.id) : 0}
              />
            </div>

            <div>
              <p className="text-sm font-medium text-ink-secondary mb-2">Color</p>
              <div className="flex gap-2 flex-wrap">
                {KID_COLORS.map(c => (
                  <button key={c} onClick={() => setKidDraft(d => ({ ...d, colorAccent: c }))}
                    className={`w-8 h-8 rounded-full transition-transform ${kidDraft.colorAccent === c ? 'scale-125 ring-2 ring-offset-2 ring-brand' : ''}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-1.5 uppercase tracking-wide">Birthday (optional)</label>
              <input type="date" value={kidDraft.birthday}
                onChange={e => setKidDraft(d => ({ ...d, birthday: e.target.value }))}
                className="w-full rounded-xl border-2 border-line px-4 py-3 text-ink-primary outline-none focus:border-brand" />
              {kidDraft.birthday && (
                <p className="text-xs text-ink-muted mt-1">Age: {computeAge(kidDraft.birthday)} years old</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-2 uppercase tracking-wide">Gender (optional)</label>
              <div className="grid grid-cols-2 gap-2">
                {GENDERS.filter(g => g.value !== 'prefer_not_to_say').map(g => (
                  <button key={g.value} type="button"
                    onClick={() => setKidDraft(d => ({ ...d, gender: d.gender === g.value ? '' : g.value }))}
                    className={`py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      kidDraft.gender === g.value ? 'border-brand bg-brand-light text-brand' : 'border-line text-ink-secondary'
                    }`}>{g.label}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-1.5 uppercase tracking-wide">Hobbies (optional)</label>
              <input placeholder="e.g. Drawing, Soccer, Reading" value={kidDraft.hobbies}
                onChange={e => setKidDraft(d => ({ ...d, hobbies: e.target.value }))}
                className="w-full rounded-xl border-2 border-line px-4 py-3 text-ink-primary outline-none focus:border-brand" />
              <p className="text-[10px] text-ink-muted mt-1">Separate with commas</p>
            </div>

            <button onClick={handleKidSave} disabled={!kidDraft.name.trim()}
              className="w-full py-3 rounded-2xl bg-brand hover:bg-brand-hover disabled:opacity-40 text-white font-bold">
              {editingKid ? 'Save Changes' : 'Add Kid'}
            </button>
            <button onClick={() => setShowKidForm(false)} className="text-center text-ink-muted text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Remove kid confirmation modal */}
      {kidToRemove && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setKidToRemove(null)}>
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-w-lg mx-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <AvatarDisplay avatar={kidToRemove.avatar} size={48} frame={kidToRemove.avatarFrame} />
              <div>
                <h2 className="text-lg font-bold text-ink-primary">Remove {kidToRemove.name}?</h2>
                <p className="text-sm text-ink-secondary">⭐ {getBalance(kidToRemove.id)} stars</p>
              </div>
            </div>
            <p className="text-sm text-red-700 bg-red-50 rounded-xl px-4 py-3">
              {kidToRemove.name}&apos;s profile will be removed. Their transaction history will remain in the log.
            </p>
            <button onClick={() => { removeKid(kidToRemove.id); setKidToRemove(null) }}
              className="w-full py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors">
              Remove {kidToRemove.name}
            </button>
            <button onClick={() => setKidToRemove(null)} className="text-center text-ink-muted text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Birthday error toast */}
      {birthdayError && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-amber-100 border border-amber-300 text-amber-800 text-sm font-semibold px-5 py-3 rounded-xl shadow-lg">
          {birthdayError}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 3: Badges
// ═══════════════════════════════════════════════════════════════════════════════

function BadgesTab({
  store, addBadge, updateBadge, removeBadge, awardBadge,
}: {
  store: ReturnType<typeof useFamily>['store']
  addBadge: ReturnType<typeof useFamily>['addBadge']
  updateBadge: ReturnType<typeof useFamily>['updateBadge']
  removeBadge: ReturnType<typeof useFamily>['removeBadge']
  awardBadge: ReturnType<typeof useFamily>['awardBadge']
}) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Badge | null>(null)
  const [draft, setDraft] = useState<Omit<Badge, 'id' | 'familyId'>>({ name: '', icon: '🏅', description: '' })
  const [awardModal, setAwardModal] = useState<Badge | null>(null)
  const [awardKidId, setAwardKidId] = useState('')

  function openNew() {
    setEditing(null); setDraft({ name: '', icon: '🏅', description: '' }); setShowForm(true)
  }

  function openEdit(badge: Badge) {
    setEditing(badge); setDraft({ ...badge }); setShowForm(true)
  }

  function handleSave() {
    if (!draft.name.trim()) return
    if (editing) updateBadge({ ...editing, ...draft })
    else addBadge(draft)
    setShowForm(false)
  }

  function handleAward() {
    if (!awardModal || !awardKidId) return
    awardBadge(awardKidId, awardModal.id)
    setAwardModal(null); setAwardKidId('')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-brand uppercase tracking-wide">Badges</h2>
        <button onClick={openNew} className="px-3 py-1.5 rounded-xl bg-brand text-white font-bold text-xs">+ New</button>
      </div>

      {store.badges.length === 0 && !showForm && (
        <div className="text-center py-10">
          <div className="text-5xl mb-3">🏅</div>
          <p className="text-ink-secondary">No badges yet. Create one to award to kids!</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {store.badges.map(badge => (
          <div key={badge.id} className="bg-white rounded-2xl p-4 shadow-card text-center flex flex-col gap-2">
            <span className="text-4xl">{badge.icon}</span>
            <p className="font-bold text-ink-primary text-sm">{badge.name}</p>
            {badge.description && <p className="text-brand text-xs">{badge.description}</p>}
            <div className="flex gap-1 justify-center mt-1">
              <button onClick={() => { setAwardModal(badge); setAwardKidId('') }}
                className="text-xs px-2 py-1 rounded-lg bg-brand-light text-ink-secondary font-medium">Award</button>
              <button onClick={() => openEdit(badge)} className="text-xs text-ink-muted hover:text-ink-secondary">Edit</button>
              <button onClick={() => removeBadge(badge.id)} className="text-xs text-red-300 hover:text-red-500">✕</button>
            </div>
          </div>
        ))}
      </div>

      {/* New/edit form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-w-lg mx-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-ink-primary">{editing ? 'Edit badge' : 'New badge'}</h2>
            <div>
              <p className="text-sm font-medium text-ink-secondary mb-2">Icon</p>
              <div className="flex flex-wrap gap-2">
                {EMOJI_SUGGESTIONS.map(e => (
                  <button key={e} onClick={() => setDraft(d => ({ ...d, icon: e }))}
                    className={`text-2xl p-2 rounded-xl transition-all ${draft.icon === e ? 'bg-brand-light scale-110' : 'bg-page hover:bg-brand-light'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <input autoFocus placeholder="Badge name" value={draft.name}
              onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
              className="rounded-xl border-2 border-line px-3 py-2 text-ink-primary outline-none focus:border-brand" />
            <input placeholder="Description (optional)" value={draft.description}
              onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
              className="rounded-xl border-2 border-line px-3 py-2 text-ink-primary outline-none focus:border-brand" />
            <button onClick={handleSave} disabled={!draft.name.trim()}
              className="w-full py-3 rounded-2xl bg-brand hover:bg-brand-hover disabled:opacity-40 text-white font-bold">
              {editing ? 'Save changes' : 'Create badge'}
            </button>
          </div>
        </div>
      )}

      {/* Award modal */}
      {awardModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setAwardModal(null)}>
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-w-lg mx-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-ink-primary">Award {awardModal.icon} {awardModal.name}</h2>
            <select value={awardKidId} onChange={e => setAwardKidId(e.target.value)}
              className="rounded-xl border-2 border-line px-3 py-2 text-ink-primary bg-white outline-none focus:border-brand">
              <option value="">Pick a kid…</option>
              {store.kids.map(k => <option key={k.id} value={k.id}>{k.avatar} {k.name}</option>)}
            </select>
            <button onClick={handleAward} disabled={!awardKidId}
              className="w-full py-3 rounded-2xl bg-brand hover:bg-brand-hover disabled:opacity-40 text-white font-bold">
              Award badge 🏅
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 4: History
// ═══════════════════════════════════════════════════════════════════════════════

const TYPE_FILTERS: { label: string; value: TransactionType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Earned', value: 'earn' },
  { label: 'Deducted', value: 'deduct' },
  { label: 'Redeemed', value: 'redeem' },
]

const STATUS_LABEL: Record<string, string> = { approved: '✓', pending: '⏳', denied: '✕' }
const STATUS_COLOR: Record<string, string> = { approved: 'text-green-500', pending: 'text-ink-muted', denied: 'text-red-400' }

function HistoryTab({ store }: { store: ReturnType<typeof useFamily>['store'] }) {
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all')
  const [kidFilter, setKidFilter] = useState<string>('all')
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null)

  const filteredTxs = useMemo(() => {
    let txs = [...store.transactions]
    if (typeFilter !== 'all') txs = txs.filter(tx => tx.type === typeFilter)
    if (kidFilter !== 'all') txs = txs.filter(tx => tx.kidId === kidFilter)
    return txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [store.transactions, typeFilter, kidFilter])

  return (
    <div>
      {/* Type filter */}
      <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
        {TYPE_FILTERS.map(f => (
          <button key={f.value} onClick={() => setTypeFilter(f.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              typeFilter === f.value ? 'bg-brand text-white' : 'bg-white text-ink-secondary border border-line-subtle'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Kid filter */}
      {store.kids.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          <button onClick={() => setKidFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              kidFilter === 'all' ? 'bg-brand text-white' : 'bg-white text-ink-secondary border border-line-subtle'
            }`}>All Kids</button>
          {store.kids.map(kid => (
            <button key={kid.id} onClick={() => setKidFilter(kid.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${
                kidFilter === kid.id ? 'bg-brand text-white' : 'bg-white text-ink-secondary border border-line-subtle'
              }`}>
              <span>{kid.avatar}</span> {kid.name}
            </button>
          ))}
        </div>
      )}

      <p className="text-brand text-sm mb-3">{filteredTxs.length} events</p>

      {filteredTxs.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-ink-secondary font-medium">No activity yet.</p>
          <p className="text-brand text-sm mt-1">Log some actions to see history here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {filteredTxs.map((tx, i) => {
            const kid = store.kids.find(k => k.id === tx.kidId)
            const action = tx.actionId ? store.actions.find(a => a.id === tx.actionId) : null
            const reward = tx.rewardId ? store.rewards.find(r => r.id === tx.rewardId) : null
            const label = action?.name ?? reward?.name ?? tx.reason ?? tx.note ?? (
              tx.type === 'earn' ? 'Bonus stars' : tx.type === 'deduct' ? 'Deduction' : 'Redemption'
            )
            const isEarn = tx.type === 'earn'
            const isExpanded = expandedTxId === tx.id

            return (
              <div key={tx.id}
                className={`px-4 py-3 cursor-pointer hover:bg-page/50 transition-colors ${i < filteredTxs.length - 1 ? 'border-b border-line-subtle' : ''}`}
                onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl w-8 text-center">{kid?.avatar ?? '👦'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink-primary text-sm truncate">
                      <span className="text-brand">{kid?.name ?? '?'}</span>{' · '}{label}
                      {tx.photoUrl && <span className="ml-1">📷</span>}
                      {tx.voiceMemoUrl && <span className="ml-1">🎙</span>}
                    </p>
                    <p className="text-ink-muted text-xs">{formatTime(tx.timestamp)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className={`font-bold text-sm ${isEarn ? 'text-green-500' : 'text-red-400'}`}>
                      {isEarn ? '+' : '-'}{tx.amount}⭐
                    </span>
                    {tx.type === 'redeem' && (
                      <span className={`text-xs font-bold ${STATUS_COLOR[tx.status]}`}>{STATUS_LABEL[tx.status]}</span>
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-2 ml-11 text-xs text-ink-secondary flex flex-col gap-1">
                    {tx.reason && <p>Reason: {tx.reason}</p>}
                    {tx.note && <p>Note: {tx.note}</p>}
                    <p className="text-ink-muted">{new Date(tx.timestamp).toLocaleString()}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
