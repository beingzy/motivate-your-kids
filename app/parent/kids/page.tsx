'use client'

import { useState } from 'react'
import { useFamily } from '@/context/FamilyContext'
import type { Kid } from '@/types'

const AVATARS = ['🐻', '🐼', '🦊', '🐸', '🦁', '🐯', '🐨', '🐹', '🐰', '🦋']
const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316']
const EMPTY = { name: '', avatar: AVATARS[0], colorAccent: COLORS[0] }

export default function KidsPage() {
  const { store, addKid, updateKid, removeKid, getBalance } = useFamily()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Kid | null>(null)
  const [draft, setDraft] = useState(EMPTY)

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
      <header className="flex items-center justify-between mb-6 pt-4">
        <h1 className="text-2xl font-bold text-ink-primary">Kids</h1>
        <button
          onClick={openNew}
          className="px-4 py-2 rounded-xl bg-brand text-white font-bold hover:bg-brand-hover transition-colors text-sm"
        >
          + Add kid
        </button>
      </header>

      {store.kids.length === 0 && (
        <div className="text-center py-10">
          <div className="text-5xl mb-3">👦</div>
          <p className="text-ink-secondary">No kids added yet.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {store.kids.map(kid => (
          <div
            key={kid.id}
            className="bg-white rounded-2xl p-4 shadow-card border-l-4 flex items-center gap-4"
            style={{ borderColor: kid.colorAccent }}
          >
            <span className="text-4xl">{kid.avatar}</span>
            <div className="flex-1">
              <p className="font-bold text-ink-primary">{kid.name}</p>
              <p className="text-brand text-sm">⭐ {getBalance(kid.id)} stars</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(kid)} className="text-ink-muted hover:text-ink-secondary text-sm">Edit</button>
              <button
                onClick={() => {
                  if (confirm(`Remove ${kid.name}? Their history will remain.`)) removeKid(kid.id)
                }}
                className="text-red-300 hover:text-red-500 text-sm"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-ink-primary">{editing ? 'Edit kid' : 'Add a kid'}</h2>
            <div className="text-center text-5xl">{draft.avatar}</div>
            <input
              autoFocus
              placeholder="Kid's name"
              value={draft.name}
              onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
              className="rounded-xl border-2 border-line px-3 py-2 text-ink-primary outline-none focus:border-brand"
            />
            <div>
              <p className="text-sm font-medium text-ink-secondary mb-2">Avatar</p>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map(a => (
                  <button
                    key={a}
                    onClick={() => setDraft(d => ({ ...d, avatar: a }))}
                    className={`text-2xl p-2 rounded-xl ${draft.avatar === a ? 'bg-brand-light scale-110' : 'bg-page hover:bg-brand-light'}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-ink-secondary mb-2">Color</p>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setDraft(d => ({ ...d, colorAccent: c }))}
                    className={`w-8 h-8 rounded-full transition-transform ${draft.colorAccent === c ? 'scale-125 ring-2 ring-offset-2 ring-brand' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={!draft.name.trim()}
              className="w-full py-3 rounded-2xl bg-brand hover:bg-brand-hover disabled:opacity-40 text-white font-bold transition-colors"
            >
              {editing ? 'Save changes' : 'Add kid'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
