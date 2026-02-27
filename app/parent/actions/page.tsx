'use client'

import { useState, useMemo } from 'react'
import { useFamily } from '@/context/FamilyContext'
import type { Action } from '@/types'

const POINT_PRESETS = [1, 3, 5, 10, 25, 50, 100]

const EMPTY: Omit<Action, 'id' | 'familyId'> = {
  name: '',
  description: '',
  categoryId: '',
  pointsValue: 3,
  isTemplate: false,
  isActive: true,
}

type SortKey = 'default' | 'most-used' | 'category' | 'stars'

export default function ActionsPage() {
  const { store, addAction, updateAction, archiveAction } = useFamily()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Action | null>(null)
  const [draft, setDraft] = useState(EMPTY)
  const [sort, setSort] = useState<SortKey>('default')

  // Count completions per action
  const completionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    store.transactions.forEach(t => {
      if (t.type === 'earn' && t.actionId) {
        counts[t.actionId] = (counts[t.actionId] ?? 0) + 1
      }
    })
    return counts
  }, [store.transactions])

  const active = store.actions.filter(a => a.isActive)
  const archived = store.actions.filter(a => !a.isActive)

  const sorted = useMemo(() => {
    const list = [...active]
    if (sort === 'most-used') {
      list.sort((a, b) => (completionCounts[b.id] ?? 0) - (completionCounts[a.id] ?? 0))
    } else if (sort === 'category') {
      list.sort((a, b) => {
        const ca = store.categories.find(c => c.id === a.categoryId)?.name ?? ''
        const cb = store.categories.find(c => c.id === b.categoryId)?.name ?? ''
        return ca.localeCompare(cb)
      })
    } else if (sort === 'stars') {
      list.sort((a, b) => b.pointsValue - a.pointsValue)
    }
    return list
  }, [active, sort, completionCounts, store.categories])

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

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'default', label: 'Default' },
    { key: 'most-used', label: 'Most used' },
    { key: 'category', label: 'Category' },
    { key: 'stars', label: 'Stars ↓' },
  ]

  return (
    <main className="p-5 max-w-lg mx-auto">
      <header className="flex items-center justify-between mb-4 pt-4">
        <h1 className="text-2xl font-bold text-amber-900">Actions</h1>
        <button
          onClick={openNew}
          className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors text-sm"
        >
          + New
        </button>
      </header>

      {/* Sort controls */}
      {active.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setSort(opt.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 whitespace-nowrap transition-colors ${
                sort === opt.key
                  ? 'border-amber-500 bg-amber-500 text-white'
                  : 'border-amber-200 text-amber-600 hover:border-amber-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {active.length === 0 && !showForm && (
        <div className="text-center py-10">
          <div className="text-5xl mb-3">✅</div>
          <p className="text-amber-700 mb-1">No actions yet.</p>
          <p className="text-amber-500 text-sm mb-4">Actions are things kids can do to earn stars — chores, reading, being kind, etc.</p>
          <button
            onClick={openNew}
            className="px-5 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors text-sm"
          >
            Create your first action
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {sorted.map(action => {
          const cat = store.categories.find(c => c.id === action.categoryId)
          const count = completionCounts[action.id] ?? 0
          return (
            <div key={action.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3">
              <span className="text-2xl">{cat?.icon ?? '📋'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-amber-900">{action.name}</p>
                {action.description && (
                  <p className="text-amber-600 text-sm mt-0.5">{action.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-amber-500 text-sm">⭐ {action.pointsValue}</span>
                  <span className="text-amber-300 text-xs">·</span>
                  <span className="text-amber-400 text-xs">{cat?.name}</span>
                  {count > 0 && (
                    <>
                      <span className="text-amber-300 text-xs">·</span>
                      <span className="text-green-500 text-xs font-medium">✓ {count}×</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
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
                <span className="text-amber-700 text-sm flex-1">{action.name}</span>
                <button
                  onClick={() => updateAction({ ...action, isActive: true })}
                  className="text-amber-500 text-xs underline"
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
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <label className="text-sm font-medium text-amber-700">Stars: {draft.pointsValue} ⭐</label>
                <span className="text-xs text-amber-400">Tip: daily tasks 1–10, achievements 25–100</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {POINT_PRESETS.map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setDraft(d => ({ ...d, pointsValue: v }))}
                    className={`px-3 py-1.5 rounded-xl text-sm font-bold border-2 transition-colors ${
                      draft.pointsValue === v
                        ? 'border-amber-500 bg-amber-500 text-white'
                        : 'border-amber-200 text-amber-600 hover:border-amber-400'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-amber-500">Custom:</span>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={draft.pointsValue}
                  onChange={e => setDraft(d => ({ ...d, pointsValue: Math.max(1, Number(e.target.value)) }))}
                  className="w-24 rounded-xl border-2 border-amber-200 px-3 py-1.5 text-amber-900 outline-none focus:border-amber-400 text-center font-bold"
                />
                <span className="text-amber-500 text-sm">⭐</span>
              </div>
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
