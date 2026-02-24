'use client'

import { useState } from 'react'
import { useFamily } from '@/context/FamilyContext'
import type { Action } from '@/types'

const EMPTY: Omit<Action, 'id' | 'familyId'> = {
  name: '',
  description: '',
  categoryId: '',
  pointsValue: 3,
  isTemplate: false,
  isActive: true,
}

export default function ActionsPage() {
  const { store, addAction, updateAction, archiveAction } = useFamily()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Action | null>(null)
  const [draft, setDraft] = useState(EMPTY)

  const active = store.actions.filter(a => a.isActive)
  const archived = store.actions.filter(a => !a.isActive)

  function openNew() {
    setEditing(null)
    setDraft(EMPTY)
    setShowForm(true)
  }

  function openEdit(action: Action) {
    setEditing(action)
    setDraft({ ...action })
    setShowForm(true)
  }

  function handleSave() {
    if (!draft.name.trim() || !draft.categoryId) return
    if (editing) {
      updateAction({ ...editing, ...draft })
    } else {
      addAction(draft)
    }
    setShowForm(false)
  }

  return (
    <main className="p-5 max-w-lg mx-auto">
      <header className="flex items-center justify-between mb-6 pt-4">
        <h1 className="text-2xl font-bold text-amber-900">Actions</h1>
        <button
          onClick={openNew}
          className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors text-sm"
        >
          + New
        </button>
      </header>

      {active.length === 0 && !showForm && (
        <div className="text-center py-10">
          <div className="text-5xl mb-3">✅</div>
          <p className="text-amber-700">No actions yet. Add one!</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {active.map(action => {
          const cat = store.categories.find(c => c.id === action.categoryId)
          return (
            <div key={action.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3">
              <span className="text-2xl">{cat?.icon ?? '📋'}</span>
              <div className="flex-1">
                <p className="font-bold text-amber-900">{action.name}</p>
                {action.description && (
                  <p className="text-amber-600 text-sm mt-0.5">{action.description}</p>
                )}
                <p className="text-amber-500 text-sm mt-1">⭐ {action.pointsValue} pts · {cat?.name}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(action)} className="text-amber-400 hover:text-amber-600 text-sm">Edit</button>
                <button onClick={() => archiveAction(action.id)} className="text-red-300 hover:text-red-500 text-sm">Archive</button>
              </div>
            </div>
          )
        })}
      </div>

      {archived.length > 0 && (
        <details className="mt-6">
          <summary className="text-sm text-amber-500 cursor-pointer">Archived ({archived.length})</summary>
          <div className="flex flex-col gap-2 mt-2">
            {archived.map(action => (
              <div key={action.id} className="bg-white/50 rounded-xl p-3 flex items-center gap-3 opacity-60">
                <span className="text-lg">{store.categories.find(c => c.id === action.categoryId)?.icon ?? '📋'}</span>
                <span className="text-amber-700 text-sm">{action.name}</span>
                <button
                  onClick={() => updateAction({ ...action, isActive: true })}
                  className="ml-auto text-amber-500 text-xs underline"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Slide-up form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-amber-900">{editing ? 'Edit action' : 'New action'}</h2>

            <input
              autoFocus
              placeholder="Action name"
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
            <select
              value={draft.categoryId}
              onChange={e => setDraft(d => ({ ...d, categoryId: e.target.value }))}
              className="rounded-xl border-2 border-amber-200 px-3 py-2 text-amber-900 bg-white outline-none focus:border-amber-400"
            >
              <option value="">Select category…</option>
              {store.categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-amber-700">Points: {draft.pointsValue} ⭐</label>
              <input
                type="range" min={1} max={10}
                value={draft.pointsValue}
                onChange={e => setDraft(d => ({ ...d, pointsValue: Number(e.target.value) }))}
                className="accent-amber-500"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={!draft.name.trim() || !draft.categoryId}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold transition-colors"
            >
              {editing ? 'Save changes' : 'Add action'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
