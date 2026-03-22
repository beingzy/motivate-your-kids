'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFamily } from '@/context/FamilyContext'
import { useLocale } from '@/context/LocaleContext'
import { clearStore } from '@/lib/store'
import { loadMeta, saveMeta } from '@/lib/meta'
import { AvatarPicker } from '@/components/AvatarPicker'
import { AvatarDisplay } from '@/components/AvatarDisplay'
import type { Category, FamilyRole, Gender } from '@/types'

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

export default function SettingsPage() {
  const router = useRouter()
  const {
    store, updateFamilyName, addCategory, removeCategory,
    requestProfileChange, approveProfileChange, denyProfileChange,
  } = useFamily()
  const { locale, setLocale, t } = useLocale()

  const [editingName, setEditingName] = useState(false)
  const [familyNameDraft, setFamilyNameDraft] = useState('')
  const [newCatEmoji, setNewCatEmoji] = useState('📚')
  const [newCatName, setNewCatName] = useState('')
  const [showAddCat, setShowAddCat] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(() => loadMeta().soundEnabled)

  // Account editing state
  const [showAccountEdit, setShowAccountEdit] = useState(false)
  const [acctAvatar, setAcctAvatar] = useState('')
  const [acctBirthday, setAcctBirthday] = useState('')
  const [acctGender, setAcctGender] = useState<Gender | ''>('')
  const [acctRole, setAcctRole] = useState<FamilyRole>('mother')
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [birthdayConfirmed, setBirthdayConfirmed] = useState(false)
  const [showBirthdayConfirm, setShowBirthdayConfirm] = useState(false)

  useEffect(() => {
    if (!store.family) router.replace('/')
  }, [store.family, router])

  if (!store.family) return null

  // Current user is the first owner member (in localStorage mode)
  const currentMember = store.familyMembers.find(m => m.isOwner) ?? store.familyMembers[0]
  const isCurrentOwner = currentMember?.isOwner ?? false

  // Check if birthday can be edited (once per year)
  function canEditBirthday(): boolean {
    if (!currentMember?.birthdayUpdatedAt) return true
    const lastUpdate = new Date(currentMember.birthdayUpdatedAt)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    return lastUpdate <= oneYearAgo
  }

  function openAccountEdit() {
    if (!currentMember) return
    setAcctAvatar(currentMember.avatar)
    setAcctBirthday(currentMember.birthday ?? '')
    setAcctGender((currentMember.gender as Gender) ?? '')
    setAcctRole(currentMember.role)
    setShowAccountEdit(true)
    setShowAvatarPicker(false)
    setBirthdayConfirmed(false)
    setShowBirthdayConfirm(false)
  }

  function handleAccountSave() {
    if (!currentMember) return
    const changes: Partial<Pick<typeof currentMember, 'avatar' | 'birthday' | 'gender' | 'role'>> = {}
    if (acctAvatar !== currentMember.avatar) changes.avatar = acctAvatar
    if (acctGender && acctGender !== currentMember.gender) changes.gender = acctGender as Gender
    if (acctRole !== currentMember.role) changes.role = acctRole

    // Birthday: only if changed and confirmed
    const birthdayChanged = acctBirthday !== (currentMember.birthday ?? '')
    if (birthdayChanged && acctBirthday) {
      if (!currentMember.birthday) {
        // First time setting birthday — need confirmation
        if (!birthdayConfirmed) {
          setShowBirthdayConfirm(true)
          return
        }
      }
      if (!canEditBirthday()) {
        alert('Birthday can only be updated once per year.')
        return
      }
      changes.birthday = acctBirthday
    }

    if (Object.keys(changes).length === 0) {
      setShowAccountEdit(false)
      return
    }

    requestProfileChange(currentMember.id, changes)
    setShowAccountEdit(false)
  }

  const pendingProfileChanges = store.profileChangeRequests.filter(r => r.status === 'pending')

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
      alert(`"${cat.name}" is used by one or more actions. Archive those actions first before removing this category.`)
      return
    }
    if (confirm(`Remove category "${cat.name}"?`)) {
      removeCategory(cat.id)
    }
  }

  function handleReset() {
    clearStore()
    window.location.href = '/setup'
  }

  return (
    <main className="p-5 max-w-lg mx-auto pb-28">
      <header className="pt-4 mb-6">
        <h1 className="text-2xl font-bold text-ink-primary">Settings</h1>
      </header>

      {/* Family UID */}
      {store.family.uid && (
        <section className="bg-page rounded-2xl p-4 mb-5 text-center border border-line-subtle">
          <p className="text-[10px] text-ink-muted uppercase tracking-widest font-bold">Family ID</p>
          <p className="text-lg font-mono font-black text-ink-primary tracking-wider">{store.family.uid}</p>
        </section>
      )}

      {/* My Account */}
      {currentMember && (
        <section className="bg-white rounded-2xl p-5 shadow-card mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-brand uppercase tracking-wide">My Account</h2>
            <button
              onClick={openAccountEdit}
              className="text-sm text-brand hover:text-ink-secondary font-medium transition-colors"
            >
              Edit
            </button>
          </div>
          <div className="flex items-center gap-4">
            <AvatarDisplay avatar={currentMember.avatar} size={56} />
            <div className="flex-1">
              <p className="font-bold text-ink-primary text-lg">{currentMember.name}</p>
              <div className="flex flex-wrap gap-2 mt-1 text-xs text-ink-secondary">
                <span>{ROLES.find(r => r.value === currentMember.role)?.emoji} {ROLES.find(r => r.value === currentMember.role)?.label}</span>
                {currentMember.gender && (
                  <span className="text-ink-muted">· {GENDERS.find(g => g.value === currentMember.gender)?.label}</span>
                )}
                {currentMember.birthday && (
                  <span className="text-ink-muted">· 🎂 {currentMember.birthday}</span>
                )}
              </div>
              {currentMember.isOwner && (
                <span className="inline-block mt-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md">
                  Owner
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Pending Profile Change Requests (owner only) */}
      {isCurrentOwner && pendingProfileChanges.length > 0 && (
        <section className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5">
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
                  <button
                    onClick={() => approveProfileChange(req.id)}
                    className="px-3 py-1 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => denyProfileChange(req.id)}
                    className="px-3 py-1 rounded-lg bg-red-100 text-red-500 text-xs font-bold hover:bg-red-200 transition-colors"
                  >
                    Deny
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Family name */}
      <section className="bg-white rounded-2xl p-5 shadow-card mb-5">
        <h2 className="text-sm font-semibold text-brand uppercase tracking-wide mb-3">Family</h2>
        {editingName ? (
          <div className="flex gap-2">
            <input
              autoFocus
              value={familyNameDraft}
              onChange={e => setFamilyNameDraft(e.target.value)}
              className="flex-1 rounded-xl border-2 border-line px-3 py-2 text-ink-primary outline-none focus:border-brand"
              onKeyDown={e => { if (e.key === 'Enter') saveFamilyName() }}
            />
            <button
              onClick={saveFamilyName}
              className="px-4 py-2 rounded-xl bg-brand text-white font-bold hover:bg-brand-hover transition-colors text-sm"
            >
              Save
            </button>
            <button
              onClick={() => setEditingName(false)}
              className="px-3 py-2 rounded-xl text-ink-muted text-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-ink-primary font-bold text-lg">{store.family.name}</p>
            <button
              onClick={startEditName}
              className="text-sm text-ink-muted hover:text-ink-secondary transition-colors"
            >
              Edit
            </button>
          </div>
        )}
      </section>

      {/* Language */}
      <section className="bg-white rounded-2xl p-5 shadow-card mb-5">
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

      {/* Sound Effects */}
      <section className="bg-white rounded-2xl p-5 shadow-card mb-5">
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
            className={`w-12 h-7 rounded-full transition-colors relative ${
              soundEnabled ? 'bg-brand' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                soundEnabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Manage Categories */}
      <section className="bg-white rounded-2xl p-5 shadow-card mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-brand uppercase tracking-wide">Categories</h2>
          <button
            onClick={() => setShowAddCat(v => !v)}
            className="text-sm text-brand hover:text-ink-secondary font-medium transition-colors"
          >
            {showAddCat ? 'Cancel' : '+ Add'}
          </button>
        </div>

        {showAddCat && (
          <div className="flex gap-2 mb-4">
            <input
              value={newCatEmoji}
              onChange={e => setNewCatEmoji(e.target.value)}
              maxLength={2}
              className="w-14 text-center rounded-xl border-2 border-line px-2 py-2 text-xl outline-none focus:border-brand"
            />
            <input
              autoFocus
              placeholder="Category name"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddCategory() }}
              className="flex-1 rounded-xl border-2 border-line px-3 py-2 text-ink-primary outline-none focus:border-brand"
            />
            <button
              onClick={handleAddCategory}
              disabled={!newCatName.trim()}
              className="px-4 py-2 rounded-xl bg-brand disabled:opacity-40 text-white font-bold hover:bg-brand-hover transition-colors text-sm"
            >
              Add
            </button>
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
                <button
                  onClick={() => handleDeleteCategory(cat)}
                  className="text-red-300 hover:text-red-500 text-sm transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Account Edit Modal */}
      {showAccountEdit && currentMember && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowAccountEdit(false)}>
          <div
            className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto max-w-lg mx-auto"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-ink-primary">Edit My Profile</h2>
            {!isCurrentOwner && (
              <p className="text-amber-600 text-xs bg-amber-50 rounded-xl px-3 py-2">
                Changes require approval from the family owner.
              </p>
            )}

            {/* Avatar */}
            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-2 uppercase tracking-wide">Avatar</label>
              {showAvatarPicker ? (
                <AvatarPicker value={acctAvatar} onChange={(v) => { setAcctAvatar(v); setShowAvatarPicker(false) }} />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(true)}
                  className="flex items-center gap-3 w-full p-3 rounded-xl border-2 border-line hover:border-brand transition-colors"
                >
                  <AvatarDisplay avatar={acctAvatar} size={48} />
                  <span className="text-sm text-brand font-medium">Tap to change</span>
                </button>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-2 uppercase tracking-wide">Gender</label>
              <div className="grid grid-cols-2 gap-2">
                {GENDERS.map(g => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setAcctGender(g.value)}
                    className={`py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      acctGender === g.value
                        ? 'border-brand bg-brand-light text-brand'
                        : 'border-line text-ink-secondary hover:border-line-subtle'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Birthday */}
            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-1.5 uppercase tracking-wide">
                Birthday
                {!canEditBirthday() && (
                  <span className="text-red-400 ml-2 normal-case">(locked — once per year)</span>
                )}
              </label>
              <input
                type="date"
                value={acctBirthday}
                onChange={e => { setAcctBirthday(e.target.value); setBirthdayConfirmed(false) }}
                disabled={!canEditBirthday()}
                className="w-full rounded-xl border-2 border-line px-4 py-3 text-ink-primary outline-none focus:border-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {currentMember.birthday && (
                <p className="text-[10px] text-ink-muted mt-1">
                  Last updated: {currentMember.birthdayUpdatedAt ? new Date(currentMember.birthdayUpdatedAt).toLocaleDateString() : 'Never'}
                </p>
              )}
            </div>

            {/* Birthday first-time confirmation */}
            {showBirthdayConfirm && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-amber-800 text-sm font-bold mb-2">Confirm your birthday</p>
                <p className="text-amber-700 text-xs mb-3">
                  You&apos;re setting your birthday for the first time. Once set, it can only be changed once per year. Is <strong>{acctBirthday}</strong> correct?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setBirthdayConfirmed(true); setShowBirthdayConfirm(false) }}
                    className="flex-1 py-2 rounded-lg bg-brand text-white font-bold text-sm"
                  >
                    Yes, confirm
                  </button>
                  <button
                    onClick={() => { setShowBirthdayConfirm(false); setAcctBirthday(currentMember.birthday ?? '') }}
                    className="flex-1 py-2 rounded-lg bg-white border border-line text-ink-secondary font-bold text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Relationship */}
            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-2 uppercase tracking-wide">Relationship to kids</label>
              <div className="grid grid-cols-4 gap-2">
                {ROLES.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setAcctRole(r.value)}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 text-xs font-medium transition-all ${
                      acctRole === r.value
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
              onClick={handleAccountSave}
              className="w-full py-3 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold transition-colors"
            >
              {isCurrentOwner ? 'Save Changes' : 'Submit for Approval'}
            </button>
            <button onClick={() => setShowAccountEdit(false)} className="text-center text-ink-muted text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Danger zone */}
      <section className="bg-red-50 rounded-2xl p-5 shadow-card border border-red-100">
        <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-3">Danger Zone</h2>
        <p className="text-red-600 text-sm mb-4">
          This will permanently delete all family data including kids, actions, rewards, and history. This cannot be undone.
        </p>
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full py-3 rounded-2xl bg-red-100 hover:bg-red-200 text-red-600 font-bold transition-colors"
          >
            Reset all data
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-red-700 font-bold text-center">Are you absolutely sure?</p>
            <button
              onClick={handleReset}
              className="w-full py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors"
            >
              Yes, delete everything
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="text-center text-red-400 text-sm"
            >
              Cancel
            </button>
          </div>
        )}
      </section>
    </main>
  )
}
