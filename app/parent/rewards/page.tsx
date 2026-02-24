'use client'

import { useState } from 'react'
import { useFamily } from '@/context/FamilyContext'
import type { Reward } from '@/types'

const EMPTY: Omit<Reward, 'id' | 'familyId'> = {
  name: '',
  description: '',
  pointsCost: 25,
  isActive: true,
}

export default function RewardsPage() {
  const { store, addReward, updateReward, removeReward } = useFamily()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Reward | null>(null)
  const [draft, setDraft] = useState(EMPTY)

  const active = store.rewards.filter(r => r.isActive)
  const inactive = store.rewards.filter(r => !r.isActive)

  function openNew() {
    setEditing(null)
    setDraft(EMPTY)
    setShowForm(true)
  }

  function openEdit(reward: Reward) {
    setEditing(reward)
    setDraft({ ...reward })
    setShowForm(true)
  }

  function handleSave() {
    if (!draft.name.trim()) return
    if (editing) {
      updateReward({ ...editing, ...draft })
    } else {
      addReward(draft)
    }
    setShowForm(false)
  }

  return (
    <main className="p-5 max-w-lg mx-auto">
      <header className="flex items-center justify-between mb-6 pt-4">
        <h1 className="text-2xl font-bold text-amber-900">Rewards</h1>
        <button
          onClick={openNew}
          className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors text-sm"
        >
          + New
        </button>
      </header>

      {active.length === 0 && !showForm && (
        <div className="text-center py-10">
          <div className="text-5xl mb-3">🎁</div>
          <p className="text-amber-700">No rewards yet. Add something kids can work toward!</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {active.map(reward => (
          <div key={reward.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3">
            <span className="text-2xl">🎁</span>
            <div className="flex-1">
              <p className="font-bold text-amber-900">{reward.name}</p>
              {reward.description && (
                <p className="text-amber-600 text-sm mt-0.5">{reward.description}</p>
              )}
              <p className="text-amber-500 text-sm mt-1">⭐ {reward.pointsCost} stars</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(reward)} className="text-amber-400 hover:text-amber-600 text-sm">Edit</button>
              <button
                onClick={() => updateReward({ ...reward, isActive: false })}
                className="text-red-300 hover:text-red-500 text-sm"
              >
                Hide
              </button>
            </div>
          </div>
        ))}
      </div>

      {inactive.length > 0 && (
        <details className="mt-6">
          <summary className="text-sm text-amber-500 cursor-pointer">Hidden ({inactive.length})</summary>
          <div className="flex flex-col gap-2 mt-2">
            {inactive.map(r => (
              <div key={r.id} className="bg-white/50 rounded-xl p-3 flex items-center gap-3 opacity-60">
                <span className="text-amber-700 text-sm flex-1">{r.name}</span>
                <button onClick={() => updateReward({ ...r, isActive: true })} className="text-amber-500 text-xs underline">Show</button>
                <button onClick={() => removeReward(r.id)} className="text-red-400 text-xs underline">Delete</button>
              </div>
            ))}
          </div>
        </details>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-amber-900">{editing ? 'Edit reward' : 'New reward'}</h2>
            <input
              autoFocus
              placeholder="Reward name"
              value={draft.name}
              onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
              className="rounded-xl border-2 border-amber-200 px-3 py-2 text-amber-900 outline-none focus:border-amber-400"
            />
            <input
              placeholder="Description (optional)"
              value={draft.description}
              onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
              className="rounded-xl border-2 border-amber-200 px-3 py-2 text-amber-900 outline-none focus:border-amber-400"
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-amber-700">Cost: {draft.pointsCost} ⭐</label>
              <input
                type="range" min={5} max={100} step={5}
                value={draft.pointsCost}
                onChange={e => setDraft(d => ({ ...d, pointsCost: Number(e.target.value) }))}
                className="accent-amber-500"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={!draft.name.trim()}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold transition-colors"
            >
              {editing ? 'Save changes' : 'Add reward'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
