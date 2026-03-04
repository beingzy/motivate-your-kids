'use client'

import { useState, useMemo } from 'react'
import { useFamily } from '@/context/FamilyContext'
import type { Action } from '@/types'
import { fireStarConfetti } from '@/lib/confetti'
import { randomEarnPhrase, randomDeductPhrase } from '@/lib/messages'

const POINT_PRESETS = [1, 3, 5, 10, 25, 50, 100]

const EMPTY: Omit<Action, 'id' | 'familyId'> = {
  name: '',
  description: '',
  categoryId: '',
  pointsValue: 3,
  isDeduction: false,
  isTemplate: false,
  isActive: true,
}

type SortKey = 'default' | 'most-used' | 'category' | 'stars'

export default function ActionsPage() {
  const { store, addAction, updateAction, archiveAction, logCompletion, getBalance } = useFamily()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Action | null>(null)
  const [draft, setDraft] = useState(EMPTY)
  const [sort, setSort] = useState<SortKey>('default')

  // Quick-log modal state
  const [logAction, setLogAction] = useState<Action | null>(null)
  const [logKidId, setLogKidId] = useState<string | null>(null)
  const [logAmount, setLogAmount] = useState(0)
  const [logReason, setLogReason] = useState('')
  const [flash, setFlash] = useState<string | null>(null)

  // Count completions per action
  const completionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    store.transactions.forEach(t => {
      if ((t.type === 'earn' || t.type === 'deduct') && t.actionId) {
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
    if (!draft.name.trim()) return
    if (editing) {
      updateAction({ ...editing, ...draft })
    } else {
      addAction(draft)
    }
    setShowForm(false)
  }

  function openLog(action: Action) {
    setLogAction(action)
    setLogAmount(action.pointsValue)
    setLogReason('')
    setLogKidId(store.kids.length === 1 ? store.kids[0].id : null)
  }

  function handleLogConfirm() {
    if (!logAction || !logKidId) return
    const isAdjusted = logAmount !== logAction.pointsValue
    logCompletion(logKidId, logAction.id, logAmount, isAdjusted ? logReason || undefined : undefined)
    const kidName = store.kids.find(k => k.id === logKidId)?.name ?? ''
    if (logAction.isDeduction) {
      setFlash(`−${logAmount}⭐ for ${kidName}. ${randomDeductPhrase()}`)
    } else {
      setFlash(`+${logAmount}⭐ for ${kidName}! ${randomEarnPhrase()}`)
      fireStarConfetti()
    }
    setTimeout(() => setFlash(null), 3000)
    setLogAction(null)
    setLogKidId(null)
  }

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'default', label: 'Default' },
    { key: 'most-used', label: 'Most used' },
    { key: 'category', label: 'Category' },
    { key: 'stars', label: 'Stars ↓' },
  ]

  const isAdjusted = logAction ? logAmount !== logAction.pointsValue : false

  return (
    <main className="p-5 max-w-lg mx-auto">
      {flash && (
        <div className="fixed top-6 left-1/2 z-50 bg-brand text-white font-bold rounded-2xl px-5 py-3 shadow-lg text-sm whitespace-nowrap animate-slide-down">
          {flash}
        </div>
      )}

      <header className="flex items-center justify-between mb-4 pt-4">
        <h1 className="text-2xl font-bold text-ink-primary">Actions</h1>
        <button
          onClick={openNew}
          className="px-4 py-2 rounded-xl bg-brand text-white font-bold hover:bg-brand-hover transition-colors text-sm"
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
                  ? 'border-brand bg-brand text-white'
                  : 'border-line text-ink-secondary hover:border-brand'
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
          <p className="text-ink-secondary mb-1">No actions yet.</p>
          <p className="text-brand text-sm mb-4">Actions are things kids can do to earn stars — chores, reading, being kind, etc.</p>
          <button
            onClick={openNew}
            className="px-5 py-2 rounded-xl bg-brand text-white font-bold hover:bg-brand-hover transition-colors text-sm"
          >
            Create your first action
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {sorted.map(action => {
          const cat = store.categories.find(c => c.id === action.categoryId)
          const count = completionCounts[action.id] ?? 0
          const isDeduction = action.isDeduction
          return (
            <div
              key={action.id}
              className={`rounded-2xl p-4 shadow-card flex items-start gap-3 ${
                isDeduction ? 'bg-red-50' : 'bg-white'
              }`}
            >
              <span className="text-2xl">{cat?.icon ?? '📋'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-bold ${isDeduction ? 'text-red-700' : 'text-ink-primary'}`}>{action.name}</p>
                  {isDeduction && (
                    <span className="text-xs font-bold text-red-500 bg-red-100 px-1.5 py-0.5 rounded-md">−pts</span>
                  )}
                </div>
                {action.description && (
                  <p className={`text-sm mt-0.5 ${isDeduction ? 'text-red-400' : 'text-ink-secondary'}`}>{action.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className={`text-sm font-bold ${isDeduction ? 'text-red-500' : 'text-brand'}`}>
                    {isDeduction ? '−' : '+'}{action.pointsValue}⭐
                  </span>
                  <span className="text-ink-muted text-xs">·</span>
                  <span className="text-ink-muted text-xs">{cat?.name}</span>
                  {count > 0 && (
                    <>
                      <span className="text-ink-muted text-xs">·</span>
                      <span className="text-green-500 text-xs font-medium">✓ {count}×</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0 items-start">
                {store.kids.length > 0 && (
                  <button
                    onClick={() => openLog(action)}
                    className={`px-2.5 py-1 rounded-lg text-white text-xs font-bold transition-colors ${
                      isDeduction
                        ? 'bg-red-400 hover:bg-red-500'
                        : 'bg-brand hover:bg-brand-hover'
                    }`}
                  >
                    Log
                  </button>
                )}
                <button onClick={() => openEdit(action)} className="text-ink-muted hover:text-ink-secondary text-sm">Edit</button>
                <button onClick={() => archiveAction(action.id)} className="text-red-300 hover:text-red-500 text-sm">Archive</button>
              </div>
            </div>
          )
        })}
      </div>

      {archived.length > 0 && (
        <details className="mt-6">
          <summary className="text-sm text-brand cursor-pointer">Archived ({archived.length})</summary>
          <div className="flex flex-col gap-2 mt-2">
            {archived.map(action => (
              <div key={action.id} className="bg-white/50 rounded-xl p-3 flex items-center gap-3 opacity-60">
                <span className="text-lg">{store.categories.find(c => c.id === action.categoryId)?.icon ?? '📋'}</span>
                <span className="text-ink-secondary text-sm flex-1">{action.name}</span>
                <button
                  onClick={() => updateAction({ ...action, isActive: true })}
                  className="text-brand text-xs underline"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* ── Quick Log modal ── */}
      {logAction && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setLogAction(null)}>
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-w-lg mx-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className={`text-center py-2 rounded-2xl ${logAction.isDeduction ? 'bg-red-50' : 'bg-page'}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${logAction.isDeduction ? 'text-red-400' : 'text-brand'}`}>
                {logAction.isDeduction ? '⚠️ Deduct stars' : 'Log action'}
              </p>
              <h2 className={`text-xl font-bold ${logAction.isDeduction ? 'text-red-800' : 'text-ink-primary'}`}>{logAction.name}</h2>
            </div>

            {/* Amount adjuster */}
            <div className="flex flex-col items-center gap-1">
              <p className="text-xs text-brand font-medium">Stars {logAction.isDeduction ? 'to deduct' : 'to award'}</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setLogAmount(v => Math.max(1, v - 1))}
                  className="w-10 h-10 rounded-full bg-brand-light hover:bg-brand-light text-ink-secondary font-black text-xl transition-colors flex items-center justify-center"
                >
                  −
                </button>
                <span className={`text-4xl font-black w-16 text-center ${logAction.isDeduction ? 'text-red-600' : 'text-ink-primary'}`}>
                  {logAmount}
                </span>
                <button
                  onClick={() => setLogAmount(v => v + 1)}
                  className="w-10 h-10 rounded-full bg-brand-light hover:bg-brand-light text-ink-secondary font-black text-xl transition-colors flex items-center justify-center"
                >
                  +
                </button>
              </div>
              {isAdjusted && (
                <p className="text-xs text-ink-muted">Default: {logAction.pointsValue} · adjusted to {logAmount}</p>
              )}
            </div>

            {/* Reason (only if adjusted) */}
            {isAdjusted && (
              <div>
                <input
                  placeholder="Reason for adjustment (optional)"
                  value={logReason}
                  onChange={e => setLogReason(e.target.value)}
                  className="w-full rounded-xl border-2 border-line px-3 py-2 text-ink-primary outline-none focus:border-brand text-sm"
                />
              </div>
            )}

            {/* Kid picker — only shown if multiple kids */}
            {store.kids.length > 1 && (
              <div>
                <p className="text-sm font-medium text-ink-secondary mb-2 text-center">For which kid?</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  {store.kids.map(kid => {
                    const bal = getBalance(kid.id)
                    const isChosen = kid.id === logKidId
                    return (
                      <button
                        key={kid.id}
                        onClick={() => setLogKidId(kid.id)}
                        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl border-2 transition-all ${
                          isChosen ? 'border-brand bg-page' : 'border-line-subtle hover:border-line'
                        }`}
                      >
                        <span className="text-2xl">{kid.avatar}</span>
                        <span className="text-xs font-bold text-ink-primary">{kid.name}</span>
                        <span className="text-xs text-ink-muted">{bal}⭐</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Single-kid: show who */}
            {store.kids.length === 1 && (
              <div className="flex items-center justify-center gap-2 bg-page rounded-2xl py-3">
                <span className="text-2xl">{store.kids[0].avatar}</span>
                <span className="font-bold text-ink-primary">{store.kids[0].name}</span>
              </div>
            )}

            <button
              onClick={handleLogConfirm}
              disabled={!logKidId}
              className={`w-full py-3 rounded-2xl disabled:opacity-40 text-white font-bold text-lg transition-colors ${
                logAction.isDeduction
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-brand hover:bg-brand-hover'
              }`}
            >
              {logAction.isDeduction ? `Deduct ${logAmount} ⭐` : `Award ${logAmount} ⭐`}
            </button>
            <button onClick={() => setLogAction(null)} className="text-center text-ink-muted text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Create / Edit action form ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-ink-primary">{editing ? 'Edit action' : 'New action'}</h2>

            {/* Reward / Punishment toggle */}
            <div className="flex rounded-xl overflow-hidden border-2 border-line">
              <button
                type="button"
                onClick={() => setDraft(d => ({ ...d, isDeduction: false }))}
                className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
                  !draft.isDeduction ? 'bg-brand text-white' : 'text-brand hover:bg-page'
                }`}
              >
                ⭐ Reward
              </button>
              <button
                type="button"
                onClick={() => setDraft(d => ({ ...d, isDeduction: true }))}
                className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
                  draft.isDeduction ? 'bg-red-500 text-white' : 'text-red-400 hover:bg-red-50'
                }`}
              >
                ⚠️ Punishment
              </button>
            </div>

            <input
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              placeholder="Action name"
              value={draft.name}
              onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
              className="rounded-xl border-2 border-line px-3 py-2 text-ink-primary outline-none focus:border-brand"
            />
            <input
              autoComplete="off"
              placeholder="Description (optional)"
              value={draft.description}
              onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
              className="rounded-xl border-2 border-line px-3 py-2 text-ink-primary outline-none focus:border-brand"
            />
            <div>
              <label className="text-xs text-ink-muted font-medium ml-1 mb-1 block">Category (optional)</label>
              <select
                value={draft.categoryId}
                onChange={e => setDraft(d => ({ ...d, categoryId: e.target.value }))}
                className="w-full rounded-xl border-2 border-line-subtle px-3 py-2 text-ink-secondary bg-white outline-none focus:border-line"
              >
                <option value="">No category</option>
                {store.categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <label className="text-sm font-medium text-ink-secondary">
                  {draft.isDeduction ? 'Points to deduct' : 'Stars'}: {draft.pointsValue} {draft.isDeduction ? '' : '⭐'}
                </label>
                <span className="text-xs text-ink-muted">Tip: daily tasks 1–10, achievements 25–100</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {POINT_PRESETS.map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setDraft(d => ({ ...d, pointsValue: v }))}
                    className={`px-3 py-1.5 rounded-xl text-sm font-bold border-2 transition-colors ${
                      draft.pointsValue === v
                        ? 'border-brand bg-brand text-white'
                        : 'border-line text-ink-secondary hover:border-brand'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-brand">Custom:</span>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={draft.pointsValue}
                  onChange={e => setDraft(d => ({ ...d, pointsValue: Math.max(1, Number(e.target.value)) }))}
                  className="w-24 rounded-xl border-2 border-line px-3 py-1.5 text-ink-primary outline-none focus:border-brand text-center font-bold"
                />
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={!draft.name.trim()}
              className="w-full py-3 rounded-2xl bg-brand hover:bg-brand-hover disabled:opacity-40 text-white font-bold transition-colors"
            >
              {editing ? 'Save changes' : 'Add action'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
