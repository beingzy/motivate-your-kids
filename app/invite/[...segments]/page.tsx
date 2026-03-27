'use client'

import { useState, useEffect, use, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AvatarPicker } from '@/components/AvatarPicker'
import { AvatarDisplay } from '@/components/AvatarDisplay'
import { generateId } from '@/lib/ids'
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
  | { type: 'valid'; familyName: string; inviteId: string; role: string }
  | { type: 'not_found' }
  | { type: 'expired' }
  | { type: 'already_used' }

function InvitePage({ params, searchParams }: {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ name?: string }>
}) {
  const router = useRouter()
  const resolvedParams = use(params)
  const resolvedSearch = use(searchParams)

  // Support both new (/invite/<token>) and old (/invite/<code>/<role>) URL formats
  // For old format, the first segment is a short code — treat it as an invalid token
  // which will resolve to "not_found" via the RPC
  const segments = resolvedParams.segments
  const token = segments[0]
  const prefillName = resolvedSearch.name ?? ''

  const [inviteStatus, setInviteStatus] = useState<InviteStatus>({ type: 'loading' })
  const [name, setName] = useState(prefillName)
  const [avatar, setAvatar] = useState('👩')
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [birthday, setBirthday] = useState('')
  const [selectedRole, setSelectedRole] = useState<FamilyRole | null>(null)
  const [joined, setJoined] = useState(false)
  const [joining, setJoining] = useState(false)

  // Validate invite via Supabase RPC (token-based, no auth needed)
  useEffect(() => {
    const supabase = createClient()

    async function validate() {
      const { data, error } = await supabase.rpc('validate_invite_by_token', {
        p_token: token,
      })

      if (error || !data) {
        setInviteStatus({ type: 'not_found' })
        return
      }

      if (data.error === 'expired') {
        setInviteStatus({ type: 'expired' })
      } else if (data.error === 'already_used') {
        setInviteStatus({ type: 'already_used' })
      } else if (data.error) {
        setInviteStatus({ type: 'not_found' })
      } else {
        setSelectedRole(data.role as FamilyRole)
        setInviteStatus({
          type: 'valid',
          familyName: data.familyName,
          inviteId: data.inviteId,
          role: data.role,
        })
      }
    }

    validate()
  }, [token])

  // Pre-fill name from URL param once
  useEffect(() => {
    if (prefillName && !name) setName(prefillName)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillName])

  async function handleJoin() {
    if (!name.trim() || !selectedRole || joining) return
    setJoining(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('accept_invite_by_token', {
        p_token: token,
        p_member_id: generateId(),
        p_name: name.trim(),
        p_avatar: avatar,
        p_role: selectedRole,
        p_birthday: birthday || null,
      })

      if (error || !data || data.error) {
        const errType = data?.error
        if (errType === 'expired') {
          setInviteStatus({ type: 'expired' })
        } else {
          setInviteStatus({ type: 'not_found' })
        }
        setJoining(false)
        return
      }

      setJoined(true)
      setTimeout(() => router.replace('/parent'), 1500)
    } catch {
      setJoining(false)
    }
  }

  const roleInfo = selectedRole ? getRoleInfo(selectedRole) : null

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
  if (inviteStatus.type === 'not_found' || inviteStatus.type === 'expired' || inviteStatus.type === 'already_used') {
    const messages = {
      expired: { icon: '⏰', title: 'Invite has expired', desc: 'This invite link has expired. Ask the family owner to create a new one.' },
      already_used: { icon: '✅', title: 'Invite already used', desc: 'This invite link has already been used. Ask the family owner to create a new one if needed.' },
      not_found: { icon: '🔗', title: 'Invite not found', desc: 'This invite link is invalid. Ask the family owner to send a new invite.' },
    }
    const msg = messages[inviteStatus.type]

    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-5 py-10 gap-6">
        <div className="text-6xl">{msg.icon}</div>
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-ink-primary mb-2">{msg.title}</h1>
          <p className="text-ink-secondary text-sm leading-relaxed max-w-xs">{msg.desc}</p>
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
          {roleInfo && (
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-100 rounded-full">
              <span className="text-lg">{roleInfo.emoji}</span>
              <span className="text-amber-800 text-sm font-bold">{roleInfo.label}</span>
            </div>
          )}
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

          {/* Role selector */}
          <div>
            <label className="block text-[11px] font-bold text-ink-muted mb-1.5 uppercase tracking-[1.5px]">
              Your Role
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setSelectedRole(r.value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-colors text-xs font-medium ${
                    selectedRole === r.value
                      ? 'border-brand bg-orange-50 text-brand'
                      : 'border-line text-ink-secondary hover:border-brand/50'
                  }`}
                >
                  <span className="text-lg">{r.emoji}</span>
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
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
            disabled={!name.trim() || !selectedRole || joining}
            className="w-full h-12 rounded-[14px] bg-brand hover:bg-brand-hover disabled:opacity-50 text-white font-extrabold text-[15px] shadow-brand transition-colors"
          >
            {joining ? 'Joining…' : `Join ${inviteStatus.familyName} →`}
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
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ name?: string }>
}) {
  return (
    <Suspense>
      <InvitePage params={params} searchParams={searchParams} />
    </Suspense>
  )
}
