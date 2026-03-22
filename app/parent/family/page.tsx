'use client'

import { useState } from 'react'
import { useFamily } from '@/context/FamilyContext'
import { AvatarPicker } from '@/components/AvatarPicker'
import { AvatarDisplay } from '@/components/AvatarDisplay'
import type { FamilyMember, FamilyRole, FamilyInvite } from '@/types'

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

function getRoleLabel(role: FamilyRole): string {
  return ROLES.find(r => r.value === role)?.label ?? role
}

function getRoleEmoji(role: FamilyRole): string {
  return ROLES.find(r => r.value === role)?.emoji ?? '👤'
}

export default function FamilyMembersPage() {
  const {
    store,
    addFamilyMember,
    updateFamilyMember,
    removeFamilyMember,
    createFamilyInvite,
    approveInvite,
    removeFamilyInvite,
    transferOwnership,
    approveJoinRequest,
    denyJoinRequest,
  } = useFamily()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<FamilyMember | null>(null)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('👩')
  const [role, setRole] = useState<FamilyRole>('mother')
  const [birthday, setBirthday] = useState('')
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  // Invite state
  const [showInvite, setShowInvite] = useState(false)
  const [inviteRole, setInviteRole] = useState<FamilyRole>('mother')
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)

  // Transfer ownership state
  const [showTransfer, setShowTransfer] = useState(false)
  const [transferTargetId, setTransferTargetId] = useState<string | null>(null)
  const [confirmTransfer, setConfirmTransfer] = useState(false)

  const currentUserIsOwner = true // In localStorage mode, the current user is always the owner

  // Determine which roles are already taken (single-occupancy)
  const takenRoles = new Set(store.familyMembers.map(m => m.role))

  function getAvailableRoles(currentRole?: FamilyRole) {
    const singleOccupancy: FamilyRole[] = ['mother', 'father']
    return ROLES.filter(r => {
      if (singleOccupancy.includes(r.value) && takenRoles.has(r.value) && r.value !== currentRole) {
        return false
      }
      return true
    })
  }

  function openNew() {
    setEditing(null)
    setName('')
    setAvatar('👩')
    setRole('mother')
    setBirthday('')
    setShowForm(true)
    setShowAvatarPicker(false)
  }

  function openEdit(member: FamilyMember) {
    setEditing(member)
    setName(member.name)
    setAvatar(member.avatar)
    setRole(member.role)
    setBirthday(member.birthday ?? '')
    setShowForm(true)
    setShowAvatarPicker(false)
  }

  function handleSave() {
    if (!name.trim()) return
    if (editing) {
      updateFamilyMember({
        ...editing,
        name: name.trim(),
        avatar,
        role,
        birthday: birthday || undefined,
      })
    } else {
      addFamilyMember({
        name: name.trim(),
        avatar,
        role,
        birthday: birthday || undefined,
      })
    }
    setShowForm(false)
  }

  function handleRemove(member: FamilyMember) {
    if (member.isOwner) {
      alert('Cannot remove the family owner. Transfer ownership first.')
      return
    }
    if (confirm(`Remove ${member.name} from the family?`)) {
      removeFamilyMember(member.id)
    }
  }

  function handleCreateInvite() {
    const invite = createFamilyInvite(inviteRole)
    const url = `${window.location.origin}/invite?token=${invite.token}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedInviteId(invite.id)
      setTimeout(() => setCopiedInviteId(null), 3000)
    }).catch(() => {})
    setShowInvite(false)
  }

  function copyInviteLink(invite: FamilyInvite) {
    const url = `${window.location.origin}/invite?token=${invite.token}`
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
    setShowTransfer(false)
    setConfirmTransfer(false)
    setTransferTargetId(null)
  }

  const activeInvites = store.familyInvites.filter(
    i => new Date(i.expiresAt) > new Date(),
  )
  const pendingInvites = activeInvites.filter(i => i.status === 'pending_approval')
  const approvedInvites = activeInvites.filter(i => i.status === 'approved')
  const pendingJoinRequests = store.joinRequests.filter(r => r.status === 'pending')

  // Non-kid members eligible for ownership transfer
  const transferCandidates = store.familyMembers.filter(
    m => !m.isOwner && m.role !== 'other',
  )

  return (
    <main className="p-5 max-w-lg mx-auto pb-28">
      <header className="flex items-center justify-between mb-4 pt-4">
        <h1 className="text-2xl font-bold text-ink-primary">Family Members</h1>
        <button
          onClick={openNew}
          className="px-4 py-2 rounded-xl bg-brand text-white font-bold hover:bg-brand-hover transition-colors text-sm"
        >
          + Add
        </button>
      </header>

      {/* Family Code Card */}
      {store.family?.displayCode && (
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 text-center">
          <p className="text-xs text-amber-700 font-bold uppercase tracking-wide mb-1">Family Code</p>
          <p className="text-3xl font-mono font-black text-amber-800 tracking-widest mb-1">
            {store.family.displayCode}
          </p>
          <p className="text-xs text-amber-600 mb-3">Share this code with family members to join</p>
          <button
            onClick={copyFamilyCode}
            className="px-4 py-1.5 rounded-lg bg-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-300 transition-colors"
          >
            {copiedCode ? 'Copied!' : 'Copy Code'}
          </button>
        </section>
      )}

      {/* Pending Join Requests (owner only) */}
      {currentUserIsOwner && pendingJoinRequests.length > 0 && (
        <section className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5">
          <h2 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-3">
            Join Requests ({pendingJoinRequests.length})
          </h2>
          <div className="flex flex-col gap-2">
            {pendingJoinRequests.map(req => (
              <div key={req.id} className="bg-white rounded-xl p-3 flex items-center gap-3">
                <AvatarDisplay avatar={req.requesterAvatar} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink-primary text-sm">{req.requesterName}</p>
                  <p className="text-xs text-ink-secondary">
                    {getRoleEmoji(req.requestedRole)} {getRoleLabel(req.requestedRole)}
                  </p>
                </div>
                <button
                  onClick={() => approveJoinRequest(req.id)}
                  className="px-3 py-1 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => denyJoinRequest(req.id)}
                  className="px-3 py-1 rounded-lg bg-red-100 text-red-500 text-xs font-bold hover:bg-red-200 transition-colors"
                >
                  Deny
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pending Invite Approvals (owner only) */}
      {currentUserIsOwner && pendingInvites.length > 0 && (
        <section className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-5">
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
                <button
                  onClick={() => approveInvite(invite.id)}
                  className="px-3 py-1 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => removeFamilyInvite(invite.id)}
                  className="text-red-300 hover:text-red-500 text-xs"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Members list */}
      {store.familyMembers.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-5xl mb-3">👨‍👩‍👧</div>
          <p className="text-ink-secondary mb-1">No family members yet.</p>
          <p className="text-brand text-sm mb-4">Add parents, grandparents, and other caregivers.</p>
          <button
            onClick={openNew}
            className="px-5 py-2 rounded-xl bg-brand text-white font-bold hover:bg-brand-hover transition-colors text-sm"
          >
            Add first member
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-6">
          {store.familyMembers.map(member => (
            <div
              key={member.id}
              className="bg-white rounded-2xl p-4 shadow-card flex items-center gap-3"
            >
              <AvatarDisplay avatar={member.avatar} size={48} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-ink-primary">{member.name}</p>
                  {member.isOwner && (
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md">
                      Owner
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-ink-secondary">
                  <span>{getRoleEmoji(member.role)} {getRoleLabel(member.role)}</span>
                  {member.birthday && (
                    <>
                      <span className="text-ink-muted">·</span>
                      <span>🎂 {member.birthday}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {currentUserIsOwner && (
                  <button
                    onClick={() => openEdit(member)}
                    className="text-ink-muted hover:text-ink-secondary text-sm"
                  >
                    Edit
                  </button>
                )}
                {currentUserIsOwner && !member.isOwner && (
                  <button
                    onClick={() => handleRemove(member)}
                    className="text-red-300 hover:text-red-500 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transfer Ownership */}
      {currentUserIsOwner && transferCandidates.length > 0 && (
        <section className="bg-white rounded-2xl p-5 shadow-card mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-brand uppercase tracking-wide">Ownership</h2>
            <button
              onClick={() => setShowTransfer(true)}
              className="text-sm text-ink-muted hover:text-ink-secondary font-medium transition-colors"
            >
              Transfer
            </button>
          </div>
          <p className="text-ink-muted text-xs">
            As the owner, you can manage members, approve join requests, and control invite links.
            Transfer ownership to another parent if needed.
          </p>
        </section>
      )}

      {/* Invite section */}
      <section className="bg-white rounded-2xl p-5 shadow-card mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-brand uppercase tracking-wide">Invite Links</h2>
          <button
            onClick={() => setShowInvite(true)}
            className="text-sm text-brand hover:text-ink-secondary font-medium transition-colors"
          >
            + Create
          </button>
        </div>
        <p className="text-ink-muted text-xs mb-3">
          Create invite links for family members. {!currentUserIsOwner && 'Owner must approve before links become active.'}
        </p>

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
                  <button
                    onClick={() => copyInviteLink(invite)}
                    className="px-3 py-1 rounded-lg bg-brand-light text-brand text-xs font-bold hover:bg-brand hover:text-white transition-colors"
                  >
                    {copiedInviteId === invite.id ? 'Copied!' : 'Copy Link'}
                  </button>
                  <button
                    onClick={() => removeFamilyInvite(invite.id)}
                    className="text-red-300 hover:text-red-500 text-xs"
                  >
                    Delete
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Transfer Ownership Modal */}
      {showTransfer && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => { setShowTransfer(false); setConfirmTransfer(false) }}>
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-w-lg mx-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-ink-primary">Transfer Ownership</h2>
            <p className="text-sm text-ink-secondary">
              Choose a family member to become the new owner. You will lose admin privileges.
            </p>

            <div className="flex flex-col gap-2">
              {transferCandidates.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setTransferTargetId(m.id); setConfirmTransfer(false) }}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    transferTargetId === m.id
                      ? 'border-brand bg-brand-light'
                      : 'border-line hover:border-line-subtle'
                  }`}
                >
                  <AvatarDisplay avatar={m.avatar} size={36} />
                  <div className="text-left">
                    <p className="font-bold text-ink-primary text-sm">{m.name}</p>
                    <p className="text-xs text-ink-secondary">{getRoleEmoji(m.role)} {getRoleLabel(m.role)}</p>
                  </div>
                </button>
              ))}
            </div>

            {transferTargetId && !confirmTransfer && (
              <button
                onClick={() => setConfirmTransfer(true)}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-colors"
              >
                Transfer to {transferCandidates.find(m => m.id === transferTargetId)?.name}
              </button>
            )}

            {confirmTransfer && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-red-700 text-sm font-bold text-center mb-3">
                  Are you sure? This cannot be easily undone.
                </p>
                <button
                  onClick={handleTransfer}
                  className="w-full py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors"
                >
                  Yes, transfer ownership
                </button>
              </div>
            )}

            <button onClick={() => { setShowTransfer(false); setConfirmTransfer(false) }} className="text-center text-ink-muted text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Create Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowInvite(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-w-lg mx-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-ink-primary">Create Invite Link</h2>
            {!currentUserIsOwner && (
              <p className="text-amber-600 text-xs bg-amber-50 rounded-xl px-3 py-2">
                The family owner will need to approve this invite before it becomes active.
              </p>
            )}

            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-2 uppercase tracking-wide">
                Role for invitee
              </label>
              <div className="grid grid-cols-4 gap-2">
                {ROLES.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setInviteRole(r.value)}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 text-xs font-medium transition-all ${
                      inviteRole === r.value
                        ? 'border-brand bg-brand-light text-brand'
                        : 'border-line text-ink-secondary hover:border-line-subtle'
                    }`}
                  >
                    <span className="text-lg">{r.emoji}</span>
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreateInvite}
              className="w-full py-3 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold transition-colors"
            >
              Create & Copy Link
            </button>
            <button onClick={() => setShowInvite(false)} className="text-center text-ink-muted text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit member modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowForm(false)}>
          <div
            className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto max-w-lg mx-auto"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-ink-primary">
              {editing ? 'Edit Member' : 'Add Family Member'}
            </h2>

            {/* Avatar */}
            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-2 uppercase tracking-wide">
                Avatar
              </label>
              {showAvatarPicker ? (
                <AvatarPicker value={avatar} onChange={(v) => { setAvatar(v); setShowAvatarPicker(false) }} />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(true)}
                  className="flex items-center gap-3 w-full p-3 rounded-xl border-2 border-line hover:border-brand transition-colors"
                >
                  <AvatarDisplay avatar={avatar} size={48} />
                  <span className="text-sm text-brand font-medium">Tap to change avatar</span>
                </button>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-1.5 uppercase tracking-wide">
                Name
              </label>
              <input
                autoFocus
                autoComplete="off"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Sarah"
                className="w-full rounded-xl border-2 border-line px-4 py-3 text-ink-primary outline-none focus:border-brand transition-colors"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-2 uppercase tracking-wide">
                Relationship to kids
              </label>
              <div className="grid grid-cols-4 gap-2">
                {getAvailableRoles(editing?.role).map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 text-xs font-medium transition-all ${
                      role === r.value
                        ? 'border-brand bg-brand-light text-brand'
                        : 'border-line text-ink-secondary hover:border-line-subtle'
                    }`}
                  >
                    <span className="text-lg">{r.emoji}</span>
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Birthday */}
            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-1.5 uppercase tracking-wide">
                Birthday (optional)
              </label>
              <input
                type="date"
                value={birthday}
                onChange={e => setBirthday(e.target.value)}
                className="w-full rounded-xl border-2 border-line px-4 py-3 text-ink-primary outline-none focus:border-brand transition-colors"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="w-full py-3 rounded-2xl bg-brand hover:bg-brand-hover disabled:opacity-40 text-white font-bold transition-colors"
            >
              {editing ? 'Save Changes' : 'Add Member'}
            </button>
            <button onClick={() => setShowForm(false)} className="text-center text-ink-muted text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
