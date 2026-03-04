'use client'

import { useState, useMemo } from 'react'
import { useFamily } from '@/context/FamilyContext'
import type { Reward } from '@/types'

const COST_PRESETS = [10, 20, 30, 50, 75, 100]

const EMPTY: Omit<Reward, 'id' | 'familyId'> = {
  name: '',
  description: '',
  pointsCost: 25,
  isActive: true,
}

export default function RewardsPage() {
  const { store, addReward, updateReward, removeReward, redeemReward, getBalance } = useFamily()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Reward | null>(null)
  const [draft, setDraft] = useState(EMPTY)
  const [redeemFor, setRedeemFor] = useState<Reward | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const active = store.rewards.filter(r => r.isActive)
  const inactive = store.rewards.filter(r => !r.isActive)

  // Redemption count per reward (approved only)
  const redemptionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    store.transactions.forEach(t => {
      if (t.type === 'redeem' && t.rewardId && t.status === 'approved') {
        counts[t.rewardId] = (counts[t.rewardId] ?? 0) + 1
      }
    })
    return counts
  }, [store.transactions])

  // Per-kid balances
  const kidBalances = useMemo(() => {
    const map: Record<string, number> = {}
    store.kids.forEach(kid => { map[kid.id] = getBalance(kid.id) })
    return map
  }, [store.kids, getBalance])

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

  function handleRedeem(kidId: string) {
    if (!redeemFor) return
    if (kidBalances[kidId] < redeemFor.pointsCost) return
    redeemReward(kidId, redeemFor.id)
    const kid = store.kids.find(k => k.id === kidId)
    setFlash(`🎁 Redeemed "${redeemFor.name}" for ${kid?.name}!`)
    setRedeemFor(null)
    setTimeout(() => setFlash(null), 2500)
  }

  return (
    <main className="p-5 max-w-lg mx-auto">
      <header className="flex items-center justify-between mb-4 pt-4">
        <h1 className="text-2xl font-bold text-ink-primary">Rewards</h1>
        <button
          onClick={openNew}
          className="px-4 py-2 rounded-xl bg-brand text-white font-bold hover:bg-brand-hover transition-colors text-sm"
        >
          + New
        </button>
      </header>

      {/* Flash */}
      {flash && (
        <div className="fixed top-4 left-1/2 z-50 bg-green-500 text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-lg animate-slide-down">
          {flash}
        </div>
      )}

      {active.length === 0 && !showForm && (
        <div className="text-center py-10">
          <div className="text-5xl mb-3">🎁</div>
          <p className="text-ink-secondary">No rewards yet. Add something kids can work toward!</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {active.map(reward => {
          const count = redemptionCounts[reward.id] ?? 0
          const affordingKids = store.kids.filter(k => kidBalances[k.id] >= reward.pointsCost)
          return (
            <div key={reward.id} className="bg-white rounded-2xl p-4 shadow-card">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎁</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink-primary">{reward.name}</p>
                  {reward.description && (
                    <p className="text-ink-secondary text-sm mt-0.5">{reward.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <p className="text-brand text-sm">⭐ {reward.pointsCost} stars</p>
                    {count > 0 && (
                      <>
                        <span className="text-ink-muted text-xs">·</span>
                        <span className="text-green-500 text-xs font-medium">🎉 Redeemed {count}×</span>
                      </>
                    )}
                  </div>

                  {/* Who can afford it */}
                  {store.kids.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {store.kids.map(kid => {
                        const canAfford = kidBalances[kid.id] >= reward.pointsCost
                        return (
                          <span
                            key={kid.id}
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              canAfford
                                ? 'bg-green-100 text-green-700'
                                : 'bg-brand-light text-ink-muted'
                            }`}
                          >
                            {kid.avatar} {kid.name}
                            {canAfford ? ' ✓' : ` (${kidBalances[kid.id]})`}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button onClick={() => openEdit(reward)} className="text-ink-muted hover:text-ink-secondary text-xs">Edit</button>
                  <button
                    onClick={() => updateReward({ ...reward, isActive: false })}
                    className="text-red-300 hover:text-red-500 text-xs"
                  >
                    Hide
                  </button>
                </div>
              </div>

              {/* Redeem button */}
              {store.kids.length > 0 && (
                <button
                  onClick={() => setRedeemFor(reward)}
                  disabled={affordingKids.length === 0}
                  className={`mt-3 w-full py-2 rounded-xl text-sm font-bold transition-colors ${
                    affordingKids.length > 0
                      ? 'bg-brand hover:bg-brand-hover text-white'
                      : 'bg-brand-light text-ink-muted cursor-not-allowed'
                  }`}
                >
                  {affordingKids.length > 0 ? '🎁 Redeem for a kid' : 'No kid can afford this yet'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {inactive.length > 0 && (
        <details className="mt-6">
          <summary className="text-sm text-brand cursor-pointer">Hidden ({inactive.length})</summary>
          <div className="flex flex-col gap-2 mt-2">
            {inactive.map(r => (
              <div key={r.id} className="bg-white/50 rounded-xl p-3 flex items-center gap-3 opacity-60">
                <span className="text-ink-secondary text-sm flex-1">{r.name}</span>
                <button onClick={() => updateReward({ ...r, isActive: true })} className="text-brand text-xs underline">Show</button>
                <button onClick={() => removeReward(r.id)} className="text-red-400 text-xs underline">Delete</button>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Redeem kid-picker modal */}
      {redeemFor && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setRedeemFor(null)}>
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div>
              <h2 className="text-lg font-bold text-ink-primary">Redeem &ldquo;{redeemFor.name}&rdquo;</h2>
              <p className="text-brand text-sm mt-0.5">⭐ {redeemFor.pointsCost} stars · Select a kid to redeem for</p>
            </div>
            <div className="flex flex-col gap-2">
              {store.kids.map(kid => {
                const bal = kidBalances[kid.id]
                const canAfford = bal >= redeemFor.pointsCost
                return (
                  <button
                    key={kid.id}
                    onClick={() => canAfford && handleRedeem(kid.id)}
                    disabled={!canAfford}
                    className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-colors text-left ${
                      canAfford
                        ? 'border-green-300 hover:bg-green-50'
                        : 'border-line-subtle opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-2xl">{kid.avatar}</span>
                    <div className="flex-1">
                      <p className="font-bold text-ink-primary text-sm">{kid.name}</p>
                      <p className={`text-xs ${canAfford ? 'text-green-600' : 'text-ink-muted'}`}>
                        {bal} ⭐ {canAfford ? '· can afford' : `· needs ${redeemFor.pointsCost - bal} more`}
                      </p>
                    </div>
                    {canAfford && <span className="text-green-500 font-bold text-sm">Redeem →</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-ink-primary">{editing ? 'Edit reward' : 'New reward'}</h2>
            <input
              autoFocus
              placeholder="Reward name"
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
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <label className="text-sm font-medium text-ink-secondary">Cost: {draft.pointsCost} ⭐</label>
                <span className="text-xs text-ink-muted">Tip: small treats 10–30, big rewards 50–100+</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {COST_PRESETS.map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setDraft(d => ({ ...d, pointsCost: v }))}
                    className={`px-3 py-1.5 rounded-xl text-sm font-bold border-2 transition-colors ${
                      draft.pointsCost === v
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
                  value={draft.pointsCost}
                  onChange={e => setDraft(d => ({ ...d, pointsCost: Math.max(1, Number(e.target.value)) }))}
                  className="w-24 rounded-xl border-2 border-line px-3 py-1.5 text-ink-primary outline-none focus:border-brand text-center font-bold"
                />
                <span className="text-brand text-sm">⭐</span>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={!draft.name.trim()}
              className="w-full py-3 rounded-2xl bg-brand hover:bg-brand-hover disabled:opacity-40 text-white font-bold transition-colors"
            >
              {editing ? 'Save changes' : 'Add reward'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
