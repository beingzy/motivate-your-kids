'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFamily } from '@/context/FamilyContext'
import type { Kid } from '@/types'

const AVATARS = ['🐻', '🐼', '🦊', '🐸', '🦁', '🐯', '🐨', '🐹', '🐰', '🦋']
const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316']
const EMPTY = { name: '', avatar: AVATARS[0], colorAccent: COLORS[0] }
const TIPS_KEY = 'myk_tips_dismissed'

export default function ParentDashboard() {
  const router = useRouter()
  const { store, hydrated, getBalance, getKidBadges, addKid, updateKid, removeKid } = useFamily()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Kid | null>(null)
  const [draft, setDraft] = useState(EMPTY)
  const [tipsDismissed, setTipsDismissed] = useState(true) // optimistic: hidden until hydrated

  useEffect(() => {
    if (hydrated && !store.family) router.replace('/')
  }, [hydrated, store.family, router])

  // Show tips banner on first visit after setup (only when family + kids exist but no actions logged yet)
  useEffect(() => {
    if (!hydrated) return
    const dismissed = localStorage.getItem(TIPS_KEY)
    const hasActivity = store.transactions.length > 0
    setTipsDismissed(!!dismissed || hasActivity)
  }, [hydrated, store.transactions.length])

  if (!hydrated || !store.family) return null

  function dismissTips() {
    localStorage.setItem(TIPS_KEY, '1')
    setTipsDismissed(true)
  }

  function openNew() {
    setEditing(null)
    setDraft(EMPTY)
    setShowForm(true)
  }

  function openEdit(kid: Kid) {
    setEditing(kid)
    setDraft({ name: kid.name, avatar: kid.avatar, colorAccent: kid.colorAccent })
    setShowForm(true)
  }

  function handleSave() {
    if (!draft.name.trim()) return
    if (editing) {
      updateKid({ ...editing, ...draft })
    } else {
      addKid(draft)
    }
    setShowForm(false)
  }

  return (
    <main className="p-5 max-w-lg mx-auto">
      <header className="flex items-center justify-between mb-5 pt-4">
        <div>
          <p className="text-sm text-amber-600 font-medium">Welcome back 👋</p>
          <h1 className="text-2xl font-bold text-amber-900">{store.family.name}</h1>
        </div>
        <button
          onClick={() => router.push('/')}
          className="text-sm text-amber-400 hover:text-amber-600 transition-colors"
        >
          Switch
        </button>
      </header>

      {/* First-launch tips banner */}
      {!tipsDismissed && store.kids.length > 0 && (
        <div className="bg-white border border-amber-200 rounded-2xl p-4 mb-5 relative">
          <button onClick={dismissTips} className="absolute top-3 right-3 text-amber-300 hover:text-amber-500 text-lg leading-none">×</button>
          <p className="font-bold text-amber-900 text-sm mb-3">🚀 Getting started</p>
          <ol className="flex flex-col gap-2 text-sm text-amber-700">
            <li className="flex items-start gap-2">
              <span className="font-bold text-amber-500 flex-shrink-0">1.</span>
              <span>Tap a kid&apos;s name below to open their profile</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-amber-500 flex-shrink-0">2.</span>
              <span>Tap an action to log it and award stars ⭐</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-amber-500 flex-shrink-0">3.</span>
              <span>When they earn enough, tap <strong>Redeem a reward</strong> on their profile</span>
            </li>
          </ol>
          <button
            onClick={dismissTips}
            className="mt-3 text-xs text-amber-400 underline"
          >
            Got it, hide this
          </button>
        </div>
      )}

      {store.kids.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
          <p className="text-amber-700 font-medium text-lg mb-2">No kids yet</p>
          <p className="text-amber-500 text-sm mb-6">Add your first kid to get started</p>
          <button
            onClick={openNew}
            className="px-6 py-3 rounded-2xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors"
          >
            Add a kid
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {store.kids.map(kid => {
            const balance = getBalance(kid.id)
            const badges = getKidBadges(kid.id)
            return (
              <div
                key={kid.id}
                className="bg-white rounded-2xl shadow-sm border-l-4 flex items-center overflow-hidden"
                style={{ borderColor: kid.colorAccent }}
              >
                <button
                  onClick={() => router.push(`/parent/kids/${kid.id}`)}
                  className="flex-1 flex items-center gap-4 p-4 text-left hover:bg-amber-50 transition-colors"
                >
                  <span className="text-4xl">{kid.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-amber-900 text-lg">{kid.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-amber-500 text-sm">⭐ {balance}</span>
                      {badges.length > 0 && (
                        <span className="text-amber-400 text-xs">🏅 {badges.length}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-amber-300 text-lg">›</span>
                </button>
                <div className="flex items-center gap-1 pr-3">
                  <button
                    onClick={() => openEdit(kid)}
                    className="p-2 rounded-xl text-amber-300 hover:text-amber-500 hover:bg-amber-50 transition-colors text-sm"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${kid.name}? Their history will remain.`)) removeKid(kid.id)
                    }}
                    className="p-2 rounded-xl text-red-200 hover:text-red-400 hover:bg-red-50 transition-colors text-sm"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )
          })}
          <button
            onClick={openNew}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-amber-200 text-amber-400 hover:border-amber-400 hover:text-amber-600 transition-colors text-sm font-medium"
          >
            + Add another kid
          </button>
        </div>
      )}

      {/* Add / Edit kid modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-amber-900">{editing ? 'Edit kid' : 'Add a kid'}</h2>
            <div className="text-center text-5xl">{draft.avatar}</div>
            <input
              autoFocus
              placeholder="Kid's name"
              value={draft.name}
              onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
              className="rounded-xl border-2 border-amber-200 px-3 py-2 text-amber-900 outline-none focus:border-amber-400"
            />
            <div>
              <p className="text-sm font-medium text-amber-700 mb-2">Avatar</p>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map(a => (
                  <button
                    key={a}
                    onClick={() => setDraft(d => ({ ...d, avatar: a }))}
                    className={`text-2xl p-2 rounded-xl transition-all ${draft.avatar === a ? 'bg-amber-200 scale-110' : 'bg-amber-50 hover:bg-amber-100'}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-amber-700 mb-2">Color</p>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setDraft(d => ({ ...d, colorAccent: c }))}
                    className={`w-8 h-8 rounded-full transition-transform ${draft.colorAccent === c ? 'scale-125 ring-2 ring-offset-2 ring-amber-400' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={!draft.name.trim()}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold transition-colors"
            >
              {editing ? 'Save changes' : 'Add kid'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
