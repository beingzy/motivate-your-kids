'use client'

import { useState, useEffect, use, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useFamily } from '@/context/FamilyContext'
import { AvatarPicker } from '@/components/AvatarPicker'
import { AvatarDisplay } from '@/components/AvatarDisplay'
import type { FamilyRole } from '@/types'

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

function getRoleInfo(role: string) {
  return ROLES.find(r => r.value === role) ?? { value: role, label: role, emoji: '👤' }
}

type InviteStatus =
  | { type: 'loading' }
  | { type: 'valid'; familyName: string; inviteId: string }
  | { type: 'not_found' }
  | { type: 'expired' }

function InvitePage({ params, searchParams }: {
  params: Promise<{ familyCode: string; relationship: string }>
  searchParams: Promise<{ name?: string }>
}) {
  const router = useRouter()
  const resolvedParams = use(params)
  const resolvedSearch = use(searchParams)

  const familyCode = decodeURIComponent(resolvedParams.familyCode)
  const relationship = resolvedParams.relationship as FamilyRole
  const prefillName = resolvedSearch.name ?? ''

  const { store, hydrated, addFamilyMember, removeFamilyInvite } = useFamily()

  const [inviteStatus, setInviteStatus] = useState<InviteStatus>({ type: 'loading' })
  const [name, setName] = useState(prefillName)
  const [avatar, setAvatar] = useState('👩')
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [birthday, setBirthday] = useState('')
  const [joined, setJoined] = useState(false)
  const [activeInviteId, setActiveInviteId] = useState<string | null>(null)

  // Resolve invite once store is hydrated
  useEffect(() => {
    if (!hydrated) return

    const family = store.family
    if (!family) {
      setInviteStatus({ type: 'not_found' })
      return
    }

    // Match family by displayCode or uid
    const codeMatch =
      family.displayCode === familyCode ||
      family.uid === familyCode ||
      family.displayCode?.toUpperCase() === familyCode.toUpperCase()

    if (!codeMatch) {
      setInviteStatus({ type: 'not_found' })
      return
    }

    // Find a valid approved invite for this role
    const now = new Date()
    const invite = store.familyInvites.find(
      i => i.role === relationship && i.status === 'approved' && new Date(i.expiresAt) > now
    )

    if (!invite) {
      // Check if there's an expired one (to give better error message)
      const expired = store.familyInvites.find(i => i.role === relationship)
      setInviteStatus({ type: expired ? 'expired' : 'not_found' })
      return
    }

    setActiveInviteId(invite.id)
    setInviteStatus({ type: 'valid', familyName: family.name, inviteId: invite.id })
  }, [hydrated, store.family, store.familyInvites, familyCode, relationship])

  // Pre-fill name from URL param once
  useEffect(() => {
    if (prefillName && !name) setName(prefillName)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillName])

  function handleJoin() {
    if (!name.trim() || !activeInviteId) return
    addFamilyMember({
      name: name.trim(),
      avatar,
      role: relationship,
      birthday: birthday || undefined,
    })
    // Mark invite as used by removing it
    removeFamilyInvite(activeInviteId)
    setJoined(true)
    setTimeout(() => router.replace('/parent'), 1500)
  }

  const roleInfo = getRoleInfo(relationship)

  // ── Loading ────────────────────────────────────────────────────────────────
  if (inviteStatus.type === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-ink-muted text-sm">Loading invite…</div>
      </main>
    )
  }

  // ── Joined success ─────────────────────────────────────────────────────────
  if (joined) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-5 gap-4">
        <div className="text-6xl">🎉</div>
        <h1 className="text-2xl font-extrabold text-ink-primary">You&apos;re in the family!</h1>
        <p className="text-ink-secondary text-sm text-center">Redirecting to the dashboard…</p>
      </main>
    )
  }

  // ── Error states ───────────────────────────────────────────────────────────
  if (inviteStatus.type === 'not_found' || inviteStatus.type === 'expired') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-5 py-10 gap-6">
        <div className="text-6xl">{inviteStatus.type === 'expired' ? '⏰' : '🔗'}</div>
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-ink-primary mb-2">
            {inviteStatus.type === 'expired' ? 'Invite has expired' : 'Invite not found'}
          </h1>
          <p className="text-ink-secondary text-sm leading-relaxed max-w-xs">
            {inviteStatus.type === 'expired'
              ? 'This invite link has expired. Ask the family owner to create a new one.'
              : 'This invite link wasn\'t found on this device. Invite links currently only work on the same device as the family owner.'}
          </p>
        </div>
        <div className="w-full max-w-xs flex flex-col gap-3">
          <p className="text-xs text-ink-muted text-center">Don&apos;t have an account yet?</p>
          <Link href="/signup"
            className="w-full py-3 rounded-2xl bg-brand text-white font-bold text-center text-sm hover:bg-brand-hover transition-colors">
            Sign up independently →
          </Link>
          <Link href="/login"
            className="w-full py-3 rounded-2xl bg-white border-2 border-line text-ink-primary font-bold text-center text-sm hover:bg-page transition-colors">
            Sign in
          </Link>
        </div>
      </main>
    )
  }

  // ── Valid invite — show join form ──────────────────────────────────────────
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm flex flex-col gap-6">

        {/* Header */}
        <div className="text-center">
          <div className="text-5xl mb-3">👨‍👩‍👧</div>
          <h1 className="text-[26px] font-extrabold text-ink-primary leading-tight">
            Join {inviteStatus.familyName}
          </h1>
          <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-100 rounded-full">
            <span className="text-lg">{roleInfo.emoji}</span>
            <span className="text-amber-800 text-sm font-bold">{roleInfo.label}</span>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-[20px] shadow-card p-5 flex flex-col gap-5">

          {/* Avatar */}
          <div>
            <label className="block text-[11px] font-bold text-ink-muted mb-2 uppercase tracking-[1.5px]">
              Your Avatar
            </label>
            {showAvatarPicker ? (
              <AvatarPicker value={avatar} onChange={v => { setAvatar(v); setShowAvatarPicker(false) }} />
            ) : (
              <button type="button" onClick={() => setShowAvatarPicker(true)}
                className="flex items-center gap-3 w-full p-3 rounded-xl border-2 border-line hover:border-brand transition-colors">
                <AvatarDisplay avatar={avatar} size={48} />
                <span className="text-sm text-brand font-medium">Tap to choose an avatar</span>
              </button>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-[11px] font-bold text-ink-muted mb-1.5 uppercase tracking-[1.5px]">
              Your Name
            </label>
            <input
              type="text"
              autoFocus
              autoComplete="off"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Grandma Susan"
              className="w-full rounded-[14px] border-2 border-line px-4 py-3 text-ink-primary outline-none focus:border-brand transition-colors text-[15px] font-semibold"
            />
          </div>

          {/* Birthday (optional) */}
          <div>
            <label className="block text-[11px] font-bold text-ink-muted mb-1.5 uppercase tracking-[1.5px]">
              Birthday <span className="font-normal normal-case">(optional)</span>
            </label>
            <input
              type="date"
              value={birthday}
              onChange={e => setBirthday(e.target.value)}
              className="w-full rounded-[14px] border-2 border-line px-4 py-3 text-ink-primary outline-none focus:border-brand transition-colors text-[15px]"
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={!name.trim()}
            className="w-full h-12 rounded-[14px] bg-brand hover:bg-brand-hover disabled:opacity-50 text-white font-extrabold text-[15px] shadow-brand transition-colors"
          >
            Join {inviteStatus.familyName} →
          </button>
        </div>

        <p className="text-center text-xs text-ink-muted">
          Wrong family?{' '}
          <Link href="/signup" className="text-brand font-bold hover:underline">
            Sign up independently
          </Link>
        </p>
      </div>
    </main>
  )
}

export default function InvitePageWrapper({ params, searchParams }: {
  params: Promise<{ familyCode: string; relationship: string }>
  searchParams: Promise<{ name?: string }>
}) {
  return (
    <Suspense>
      <InvitePage params={params} searchParams={searchParams} />
    </Suspense>
  )
}
