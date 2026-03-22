'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFamily } from '@/context/FamilyContext'
import { AvatarPicker } from '@/components/AvatarPicker'
import { AvatarDisplay } from '@/components/AvatarDisplay'
import { SEED_REWARDS } from '@/lib/seeds'
import type { FamilyRole } from '@/types'

const KID_AVATARS = ['🐻', '🐼', '🦊', '🐸', '🦁', '🐯', '🐨', '🐹', '🐰', '🦋']
const KID_COLORS = [
  '#f59e0b', '#10b981', '#3b82f6', '#ec4899',
  '#8b5cf6', '#ef4444', '#06b6d4', '#f97316',
]

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

type Step = 'choice' | 'profile' | 'family' | 'join' | 'join-submitted' | 'kid' | 'reward'

export default function SetupPage() {
  const router = useRouter()
  const { store, createFamily, addKid, addReward, createJoinRequest } = useFamily()

  const [step, setStep] = useState<Step>(store.family ? 'kid' : 'choice')

  // Owner profile
  const [ownerName, setOwnerName] = useState('')
  const [ownerAvatar, setOwnerAvatar] = useState('👩')
  const [ownerRole, setOwnerRole] = useState<FamilyRole>('mother')
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  // Create family
  const [familyName, setFamilyName] = useState('')

  // Join family
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')

  // Add kid
  const [kidName, setKidName] = useState('')
  const [kidAvatar, setKidAvatar] = useState(KID_AVATARS[0])
  const [kidColor, setKidColor] = useState(KID_COLORS[0])

  // Which path: create or join
  const [mode, setMode] = useState<'create' | 'join' | null>(null)

  function handleChooseCreate() {
    setMode('create')
    setStep('profile')
  }

  function handleChooseJoin() {
    setMode('join')
    setStep('profile')
  }

  function handleProfileDone() {
    if (!ownerName.trim()) return
    if (mode === 'create') {
      setStep('family')
    } else {
      setStep('join')
    }
  }

  function handleCreateFamily() {
    if (!familyName.trim()) return
    createFamily(familyName.trim(), ownerName.trim(), ownerAvatar, ownerRole)
    setStep('kid')
  }

  function handleJoinFamily() {
    const code = joinCode.trim().toUpperCase()
    if (code.length < 5) {
      setJoinError('Please enter a valid family code.')
      return
    }
    // In localStorage mode, we simulate: create a join request
    // The owner of the family needs to approve it
    // For now, we store the request locally and show a confirmation
    createJoinRequest({
      requesterName: ownerName.trim(),
      requesterAvatar: ownerAvatar,
      requestedRole: ownerRole,
    })
    setStep('join-submitted')
  }

  function handleAddKid() {
    if (!kidName.trim()) return
    addKid({ name: kidName.trim(), avatar: kidAvatar, colorAccent: kidColor })
    setStep('reward')
  }

  function handleSkipKid() {
    setStep('reward')
  }

  function handleAddRewards() {
    SEED_REWARDS.forEach(r =>
      addReward({ name: r.name, description: r.description, pointsCost: r.pointsCost, isActive: true }),
    )
    router.replace('/parent')
  }

  function handleSkipRewards() {
    router.replace('/parent')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Step: Choice — Create or Join */}
        {step === 'choice' && (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <div className="text-6xl mb-3">⭐</div>
              <h1 className="text-2xl font-bold text-ink-primary">Welcome to Kids Rewards</h1>
              <p className="text-ink-secondary mt-2 text-sm">How would you like to get started?</p>
            </div>

            <button
              onClick={handleChooseCreate}
              className="w-full py-5 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold text-lg shadow-brand transition-colors flex flex-col items-center gap-1"
            >
              <span className="text-2xl">🏠</span>
              <span>Create a new family</span>
              <span className="text-xs font-normal opacity-80">Set up your family and start rewarding</span>
            </button>

            <button
              onClick={handleChooseJoin}
              className="w-full py-5 rounded-2xl bg-white hover:bg-page border-2 border-line text-ink-primary font-bold text-lg shadow-card transition-colors flex flex-col items-center gap-1"
            >
              <span className="text-2xl">🤝</span>
              <span>Join an existing family</span>
              <span className="text-xs font-normal text-ink-muted">Enter a family code to request access</span>
            </button>
          </div>
        )}

        {/* Step: Your Profile */}
        {step === 'profile' && (
          <div className="flex flex-col gap-5">
            <div className="text-center">
              <div className="text-6xl mb-3">👤</div>
              <h1 className="text-2xl font-bold text-ink-primary">Set up your profile</h1>
              <p className="text-ink-secondary mt-1 text-sm">Tell us about yourself.</p>
            </div>

            {/* Avatar */}
            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-2 uppercase tracking-wide">
                Avatar
              </label>
              {showAvatarPicker ? (
                <AvatarPicker value={ownerAvatar} onChange={(v) => { setOwnerAvatar(v); setShowAvatarPicker(false) }} />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(true)}
                  className="flex items-center gap-3 w-full p-3 rounded-xl border-2 border-line hover:border-brand transition-colors bg-white"
                >
                  <AvatarDisplay avatar={ownerAvatar} size={48} />
                  <span className="text-sm text-brand font-medium">Tap to change</span>
                </button>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-1.5 uppercase tracking-wide">
                Your name
              </label>
              <input
                autoFocus
                autoComplete="off"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                placeholder="e.g. Sarah"
                className="w-full rounded-xl border-2 border-line px-4 py-3 text-ink-primary outline-none focus:border-brand transition-colors bg-white"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-2 uppercase tracking-wide">
                Your relationship
              </label>
              <div className="grid grid-cols-4 gap-2">
                {ROLES.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setOwnerRole(r.value)}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 text-xs font-medium transition-all ${
                      ownerRole === r.value
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
              onClick={handleProfileDone}
              disabled={!ownerName.trim()}
              className="w-full py-4 rounded-2xl bg-brand hover:bg-brand-hover disabled:opacity-40 text-white font-bold text-lg transition-colors"
            >
              Continue →
            </button>
            <button onClick={() => setStep('choice')} className="text-center text-brand text-sm underline">
              Back
            </button>
          </div>
        )}

        {/* Step: Create family name */}
        {step === 'family' && (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <div className="text-6xl mb-3">🏠</div>
              <h1 className="text-2xl font-bold text-ink-primary">Name your family</h1>
              <p className="text-ink-secondary mt-1 text-sm">You&apos;ll be the owner/admin. You can change this later.</p>
            </div>
            <input
              autoFocus
              type="text"
              placeholder="e.g. The Smiths"
              value={familyName}
              onChange={e => setFamilyName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateFamily()}
              className="w-full rounded-2xl border-2 border-line bg-white px-4 py-3 text-lg text-ink-primary placeholder-ink-muted outline-none focus:border-brand"
            />
            <button
              onClick={handleCreateFamily}
              disabled={!familyName.trim()}
              className="w-full py-4 rounded-2xl bg-brand hover:bg-brand-hover disabled:opacity-40 text-white font-bold text-lg transition-colors"
            >
              Create Family →
            </button>
            <button onClick={() => setStep('profile')} className="text-center text-brand text-sm underline">
              Back
            </button>
          </div>
        )}

        {/* Step: Join family by code */}
        {step === 'join' && (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <div className="text-6xl mb-3">🔑</div>
              <h1 className="text-2xl font-bold text-ink-primary">Join a family</h1>
              <p className="text-ink-secondary mt-1 text-sm leading-relaxed">
                Ask the family owner for their <span className="font-bold text-ink-primary">Family Code</span>.
                <br />It looks like <span className="font-mono font-bold text-brand">ABC-123</span>.
              </p>
            </div>
            <input
              autoFocus
              type="text"
              placeholder="Enter family code"
              value={joinCode}
              onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError('') }}
              onKeyDown={e => e.key === 'Enter' && handleJoinFamily()}
              maxLength={7}
              className="w-full rounded-2xl border-2 border-line bg-white px-4 py-3 text-2xl text-center text-ink-primary placeholder-ink-muted outline-none focus:border-brand font-mono tracking-widest"
            />

            {joinError && (
              <p className="text-red-500 text-sm font-semibold bg-red-50 rounded-xl px-4 py-3">
                {joinError}
              </p>
            )}

            <button
              onClick={handleJoinFamily}
              disabled={joinCode.trim().length < 5}
              className="w-full py-4 rounded-2xl bg-brand hover:bg-brand-hover disabled:opacity-40 text-white font-bold text-lg transition-colors"
            >
              Request to Join →
            </button>
            <button onClick={() => setStep('profile')} className="text-center text-brand text-sm underline">
              Back
            </button>
          </div>
        )}

        {/* Step: Join request submitted */}
        {step === 'join-submitted' && (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <div className="text-6xl mb-3">✅</div>
              <h1 className="text-2xl font-bold text-ink-primary">Request sent!</h1>
              <p className="text-ink-secondary mt-2 text-sm leading-relaxed">
                The family owner will review your request.
                <br />You&apos;ll be notified once approved.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-card flex items-center gap-3">
              <AvatarDisplay avatar={ownerAvatar} size={48} />
              <div>
                <p className="font-bold text-ink-primary">{ownerName}</p>
                <p className="text-sm text-ink-secondary">{ROLES.find(r => r.value === ownerRole)?.emoji} {ROLES.find(r => r.value === ownerRole)?.label}</p>
              </div>
              <span className="ml-auto px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg">Pending</span>
            </div>

            <p className="text-ink-muted text-xs text-center">
              Want to create your own family instead?
            </p>
            <button
              onClick={() => { setMode('create'); setStep('family') }}
              className="w-full py-3 rounded-2xl bg-white border-2 border-line text-ink-primary font-bold transition-colors hover:bg-page"
            >
              Create a new family instead
            </button>
          </div>
        )}

        {/* Step: first kid */}
        {step === 'kid' && (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <div className="text-6xl mb-3">{kidAvatar}</div>
              <h1 className="text-2xl font-bold text-ink-primary">Add your first kid</h1>
              <p className="text-ink-secondary mt-1 text-sm">You can add more later.</p>
            </div>

            {/* Show family code */}
            {store.family?.displayCode && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
                <p className="text-xs text-amber-700 font-medium mb-1">Your family code</p>
                <p className="text-2xl font-mono font-black text-amber-800 tracking-widest">{store.family.displayCode}</p>
                <p className="text-xs text-amber-600 mt-1">Share this with family members to join</p>
              </div>
            )}

            <input
              autoFocus
              type="text"
              placeholder="Kid's name"
              value={kidName}
              onChange={e => setKidName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddKid()}
              className="w-full rounded-2xl border-2 border-line bg-white px-4 py-3 text-lg text-ink-primary placeholder-ink-muted outline-none focus:border-brand"
            />

            <div>
              <p className="text-sm font-medium text-ink-secondary mb-2">Pick an avatar</p>
              <div className="flex flex-wrap gap-2">
                {KID_AVATARS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setKidAvatar(emoji)}
                    className={`text-2xl p-2 rounded-xl transition-all ${kidAvatar === emoji ? 'bg-brand-light scale-110' : 'bg-white hover:bg-brand-light'}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-ink-secondary mb-2">Pick a color</p>
              <div className="flex gap-2">
                {KID_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setKidColor(color)}
                    className={`w-8 h-8 rounded-full transition-transform ${kidColor === color ? 'scale-125 ring-2 ring-offset-2 ring-brand' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleAddKid}
              disabled={!kidName.trim()}
              className="w-full py-4 rounded-2xl bg-brand hover:bg-brand-hover disabled:opacity-40 text-white font-bold text-lg transition-colors"
            >
              Add {kidName.trim() || 'kid'} →
            </button>
            <button onClick={handleSkipKid} className="text-center text-brand text-sm underline">
              Skip for now
            </button>
          </div>
        )}

        {/* Step: starter rewards */}
        {step === 'reward' && (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <div className="text-6xl mb-3">🎁</div>
              <h1 className="text-2xl font-bold text-ink-primary">Add starter rewards?</h1>
              <p className="text-ink-secondary mt-1 text-sm">We&apos;ll add a few popular ones. You can edit them anytime.</p>
            </div>
            <ul className="flex flex-col gap-2">
              {SEED_REWARDS.map(r => (
                <li key={r.name} className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 border border-line-subtle">
                  <span className="text-ink-primary font-medium">{r.name}</span>
                  <span className="text-brand font-bold">⭐ {r.pointsCost}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={handleAddRewards}
              className="w-full py-4 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold text-lg transition-colors"
            >
              Add these & finish 🎉
            </button>
            <button onClick={handleSkipRewards} className="text-center text-brand text-sm underline">
              Skip, I&apos;ll add my own
            </button>
          </div>
        )}

      </div>
    </main>
  )
}
