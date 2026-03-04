'use client'

import { useState } from 'react'
import { useFamily } from '@/context/FamilyContext'
import type { Badge } from '@/types'

const EMPTY: Omit<Badge, 'id' | 'familyId'> = {
  name: '',
  icon: '🏅',
  description: '',
}

const EMOJI_SUGGESTIONS = ['🏅', '🌟', '🔥', '💎', '🚀', '🦸', '🎯', '🏆', '🌈', '⚡']

export default function BadgesPage() {
  const { store, addBadge, updateBadge, removeBadge, awardBadge } = useFamily()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Badge | null>(null)
  const [draft, setDraft] = useState(EMPTY)
  const [awardModal, setAwardModal] = useState<Badge | null>(null)
  const [awardKidId, setAwardKidId] = useState('')

  function openNew() {
    setEditing(null)
    setDraft(EMPTY)
    setShowForm(true)
  }

  function openEdit(badge: Badge) {
    setEditing(badge)
    setDraft({ ...badge })
    setShowForm(true)
  }

  function handleSave() {
    if (!draft.name.trim()) return
    if (editing) {
      updateBadge({ ...editing, ...draft })
    } else {
      addBadge(draft)
    }
    setShowForm(false)
  }

  function handleAward() {
    if (!awardModal || !awardKidId) return
    awardBadge(awardKidId, awardModal.id)
    setAwardModal(null)
    setAwardKidId('')
  }

  return (
    <main className="p-5 max-w-lg mx-auto">
      <header className="flex items-center justify-between mb-6 pt-4">
        <h1 className="text-2xl font-bold text-ink-primary">Badges</h1>
        <button
          onClick={openNew}
          className="px-4 py-2 rounded-xl bg-brand text-white font-bold hover:bg-brand-hover transition-colors text-sm"
        >
          + New
        </button>
      </header>

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
              <button
                onClick={() => { setAwardModal(badge); setAwardKidId('') }}
                className="text-xs px-2 py-1 rounded-lg bg-brand-light hover:bg-brand-light text-ink-secondary font-medium"
              >
                Award
              </button>
              <button onClick={() => openEdit(badge)} className="text-xs text-ink-muted hover:text-ink-secondary">Edit</button>
              <button onClick={() => removeBadge(badge.id)} className="text-xs text-red-300 hover:text-red-500">✕</button>
            </div>
          </div>
        ))}
      </div>

      {/* New/edit form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-ink-primary">{editing ? 'Edit badge' : 'New badge'}</h2>
            <div>
              <p className="text-sm font-medium text-ink-secondary mb-2">Icon</p>
              <div className="flex flex-wrap gap-2">
                {EMOJI_SUGGESTIONS.map(e => (
                  <button
                    key={e}
                    onClick={() => setDraft(d => ({ ...d, icon: e }))}
                    className={`text-2xl p-2 rounded-xl transition-all ${draft.icon === e ? 'bg-brand-light scale-110' : 'bg-page hover:bg-brand-light'}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <input
              autoFocus
              placeholder="Badge name"
              value={draft.name}
              onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
              className="rounded-xl border-2 border-line px-3 py-2 text-ink-primary outline-none focus:border-brand"
            />
            <input
              placeholder="Description (optional)"
              value={draft.description}
              onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
              className="rounded-xl border-2 border-line px-3 py-2 text-ink-primary outline-none focus:border-brand"
            />
            <button
              onClick={handleSave}
              disabled={!draft.name.trim()}
              className="w-full py-3 rounded-2xl bg-brand hover:bg-brand-hover disabled:opacity-40 text-white font-bold transition-colors"
            >
              {editing ? 'Save changes' : 'Create badge'}
            </button>
          </div>
        </div>
      )}

      {/* Award modal */}
      {awardModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setAwardModal(null)}>
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-ink-primary">Award {awardModal.icon} {awardModal.name}</h2>
            <select
              value={awardKidId}
              onChange={e => setAwardKidId(e.target.value)}
              className="rounded-xl border-2 border-line px-3 py-2 text-ink-primary bg-white outline-none focus:border-brand"
            >
              <option value="">Pick a kid…</option>
              {store.kids.map(k => (
                <option key={k.id} value={k.id}>{k.avatar} {k.name}</option>
              ))}
            </select>
            <button
              onClick={handleAward}
              disabled={!awardKidId}
              className="w-full py-3 rounded-2xl bg-brand hover:bg-brand-hover disabled:opacity-40 text-white font-bold transition-colors"
            >
              Award badge 🏅
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
