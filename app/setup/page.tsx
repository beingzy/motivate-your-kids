'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFamily } from '@/context/FamilyContext'
import { SEED_REWARDS } from '@/lib/seeds'

const KID_AVATARS = ['🐻', '🐼', '🦊', '🐸', '🦁', '🐯', '🐨', '🐹', '🐰', '🦋']
const KID_COLORS = [
  '#f59e0b', '#10b981', '#3b82f6', '#ec4899',
  '#8b5cf6', '#ef4444', '#06b6d4', '#f97316',
]

type Step = 'family' | 'kid' | 'reward' | 'done'

export default function SetupPage() {
  const router = useRouter()
  const { store, createFamily, addKid, addReward } = useFamily()

  const [step, setStep] = useState<Step>(store.family ? 'kid' : 'family')
  const [familyName, setFamilyName] = useState('')
  const [kidName, setKidName] = useState('')
  const [kidAvatar, setKidAvatar] = useState(KID_AVATARS[0])
  const [kidColor, setKidColor] = useState(KID_COLORS[0])

  function handleCreateFamily() {
    if (!familyName.trim()) return
    createFamily(familyName.trim())
    setStep('kid')
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

        {/* Step: family name */}
        {step === 'family' && (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <div className="text-6xl mb-3">🏠</div>
              <h1 className="text-2xl font-bold text-ink-primary">Name your family</h1>
              <p className="text-ink-secondary mt-1 text-sm">You can change this later.</p>
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
              Continue →
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
