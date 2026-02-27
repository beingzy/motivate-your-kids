'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFamily } from '@/context/FamilyContext'
import type { Transaction } from '@/types'

function formatTimestamp(ts: string): string {
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return timeStr
  if (diffDays === 1) return `Yesterday ${timeStr}`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ` ${timeStr}`
}

export default function ParentKidPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const { store, hydrated, getBalance, logCompletion, awardBonus, redeemReward, getTransactions } = useFamily()

  const [flash, setFlash] = useState<string | null>(null)
  const [showBonus, setShowBonus] = useState(false)
  const [bonusAmount, setBonusAmount] = useState(5)
  const [bonusNote, setBonusNote] = useState('')
  const [confirmReward, setConfirmReward] = useState<string | null>(null)
  const [showAllActivity, setShowAllActivity] = useState(false)

  const kid = store.kids.find(k => k.id === id)
  useEffect(() => { if (hydrated && !kid) router.replace('/parent') }, [hydrated, kid, router])
  if (!hydrated || !kid) return null

  const balance = getBalance(id)
  const activeActions = store.actions.filter(a => a.isActive)
  const activeRewards = store.rewards.filter(r => r.isActive)
  const allTxs: Transaction[] = getTransactions(id)
  const visibleTxs = showAllActivity ? allTxs : allTxs.slice(0, 15)

  function showFlash(msg: string) {
    setFlash(msg)
    setTimeout(() => setFlash(null), 2500)
  }

  function handleLogAction(actionId: string, actionName: string) {
    logCompletion(id, actionId)
    showFlash(`+stars! ${actionName}`)
  }

  function handleAwardBonus() {
    if (bonusAmount < 1) return
    awardBonus(id, bonusAmount, bonusNote.trim() || 'Bonus stars')
    setShowBonus(false)
    setBonusNote('')
    setBonusAmount(5)
    showFlash(`Awarded ${bonusAmount} bonus stars!`)
  }

  function handleRedeemConfirm(rewardId: string) {
    const reward = store.rewards.find(r => r.id === rewardId)
    if (!reward) return
    redeemReward(id, rewardId)
    setConfirmReward(null)
    showFlash(`🎁 Redeemed: ${reward.name}!`)
  }

  function getTxLabel(tx: Transaction): string {
    if (tx.type === 'earn') {
      if (tx.actionId) {
        const action = store.actions.find(a => a.id === tx.actionId)
        return action ? action.name : 'Action completed'
      }
      return tx.note || 'Bonus stars'
    }
    if (tx.rewardId) {
      const reward = store.rewards.find(r => r.id === tx.rewardId)
      return reward ? `Redeemed: ${reward.name}` : 'Reward redeemed'
    }
    return tx.note || 'Redemption'
  }

  function getCategoryEmoji(actionId: string): string {
    const action = store.actions.find(a => a.id === actionId)
    if (!action) return '✅'
    const cat = store.categories.find(c => c.id === action.categoryId)
    return cat ? cat.icon : '✅'
  }

  const confirmingReward = confirmReward ? store.rewards.find(r => r.id === confirmReward) : null

  return (
    <main className="p-5 max-w-lg mx-auto pb-28">
      {flash && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-white font-bold rounded-2xl px-5 py-3 shadow-lg text-sm whitespace-nowrap">
          {flash}
        </div>
      )}

      {/* Header */}
      <header className="pt-4 mb-6">
        <button
          onClick={() => router.back()}
          className="text-amber-400 text-sm mb-3 flex items-center gap-1 hover:text-amber-600 transition-colors"
        >
          ← Back
        </button>
        <div className="flex items-center gap-4">
          <span className="text-5xl">{kid.avatar}</span>
          <div>
            <h1 className="text-2xl font-bold text-amber-900">{kid.name}</h1>
            <div className="inline-flex items-center gap-1 bg-white rounded-xl px-3 py-1 shadow-sm mt-1">
              <span className="font-black text-amber-900">{balance}</span>
              <span>⭐</span>
              <span className="text-amber-500 text-sm ml-1">stars</span>
            </div>
          </div>
          <button
            onClick={() => setShowBonus(true)}
            className="ml-auto flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl bg-amber-100 hover:bg-amber-200 transition-colors"
          >
            <span className="text-xl">⭐</span>
            <span className="text-xs font-bold text-amber-700">Bonus</span>
          </button>
        </div>
      </header>

      {/* Log an action */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-amber-500 uppercase tracking-wide mb-3">Log an action</h2>
        {activeActions.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 text-center text-amber-400 text-sm">
            No active actions. Add some in the Actions tab.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {activeActions.map(action => (
              <button
                key={action.id}
                onClick={() => handleLogAction(action.id, action.name)}
                className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 text-left hover:bg-amber-50 active:scale-95 transition-all border-2 border-transparent hover:border-amber-200"
              >
                <span className="text-2xl w-10 text-center">{getCategoryEmoji(action.id)}</span>
                <div className="flex-1">
                  <p className="font-bold text-amber-900">{action.name}</p>
                  {action.description && (
                    <p className="text-amber-500 text-xs">{action.description}</p>
                  )}
                </div>
                <span className="font-black text-amber-500 text-sm whitespace-nowrap">+{action.pointsValue} ⭐</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Redeem a reward */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-amber-500 uppercase tracking-wide mb-3">Redeem a reward</h2>
        {activeRewards.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 text-center text-amber-400 text-sm">
            No rewards yet. Add some in the Rewards tab.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {[...activeRewards]
              .sort((a, b) => a.pointsCost - b.pointsCost)
              .map(reward => {
                const canAfford = balance >= reward.pointsCost
                return (
                  <button
                    key={reward.id}
                    onClick={() => canAfford && setConfirmReward(reward.id)}
                    disabled={!canAfford}
                    className={`bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 text-left transition-all border-2 border-transparent ${
                      canAfford
                        ? 'hover:bg-amber-50 hover:border-amber-200 active:scale-95'
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-2xl">🎁</span>
                    <div className="flex-1">
                      <p className="font-bold text-amber-900">{reward.name}</p>
                      {reward.description && (
                        <p className="text-amber-500 text-xs">{reward.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-black text-amber-500 text-sm whitespace-nowrap">{reward.pointsCost} ⭐</p>
                      {!canAfford && (
                        <p className="text-amber-300 text-xs whitespace-nowrap">need {reward.pointsCost - balance} more</p>
                      )}
                    </div>
                  </button>
                )
              })}
          </div>
        )}
      </section>

      {/* Activity log */}
      <section>
        <h2 className="text-sm font-semibold text-amber-500 uppercase tracking-wide mb-3">Activity</h2>
        {allTxs.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 text-center text-amber-400 text-sm">
            No activity yet. Log an action above!
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {visibleTxs.map((tx, i) => (
                <div
                  key={tx.id}
                  className={`flex items-center gap-3 px-4 py-3 ${i < visibleTxs.length - 1 ? 'border-b border-amber-50' : ''}`}
                >
                  <span className="text-xl flex-shrink-0">
                    {tx.type === 'earn'
                      ? (tx.actionId ? getCategoryEmoji(tx.actionId) : '⭐')
                      : '🎁'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-amber-900 text-sm truncate">{getTxLabel(tx)}</p>
                    <p className="text-amber-400 text-xs">{formatTimestamp(tx.timestamp)}</p>
                  </div>
                  <span className={`font-bold text-sm flex-shrink-0 ${tx.type === 'earn' ? 'text-green-500' : 'text-red-400'}`}>
                    {tx.type === 'earn' ? '+' : '-'}{tx.amount} ⭐
                  </span>
                </div>
              ))}
            </div>
            {allTxs.length > 15 && (
              <button
                onClick={() => setShowAllActivity(v => !v)}
                className="w-full mt-2 py-2 text-amber-500 text-sm hover:text-amber-700 transition-colors"
              >
                {showAllActivity ? 'Show less' : `Show all ${allTxs.length} entries`}
              </button>
            )}
          </>
        )}
      </section>

      {/* Redeem confirm modal */}
      {confirmingReward && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setConfirmReward(null)}>
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-w-lg mx-auto" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="text-5xl mb-2">🎁</div>
              <h2 className="text-xl font-bold text-amber-900">Redeem for {kid.name}?</h2>
              <p className="text-amber-600 mt-1 font-medium">{confirmingReward.name}</p>
              <p className="text-amber-500 text-sm mt-1">
                Costs {confirmingReward.pointsCost} ⭐ · Balance after: {balance - confirmingReward.pointsCost} ⭐
              </p>
            </div>
            <button
              onClick={() => handleRedeemConfirm(confirmingReward.id)}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg transition-colors"
            >
              Confirm redemption
            </button>
            <button onClick={() => setConfirmReward(null)} className="text-center text-amber-400 text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Award Bonus Modal */}
      {showBonus && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowBonus(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-w-lg mx-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-amber-900 text-center">Award Bonus Stars ⭐</h2>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-amber-700">Stars</label>
              <input
                type="number"
                min={1}
                value={bonusAmount}
                onChange={e => setBonusAmount(Number(e.target.value))}
                className="rounded-xl border-2 border-amber-200 px-3 py-2 text-amber-900 outline-none focus:border-amber-400 text-center text-2xl font-bold"
              />
              <div className="flex gap-2 flex-wrap mt-1">
                {[1, 5, 10, 25, 50].map(v => (
                  <button
                    key={v}
                    onClick={() => setBonusAmount(v)}
                    className={`px-3 py-1 rounded-lg text-sm font-bold border-2 transition-colors ${bonusAmount === v ? 'border-amber-500 bg-amber-500 text-white' : 'border-amber-200 text-amber-600 hover:border-amber-400'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-amber-700">Note (optional)</label>
              <input
                placeholder="e.g. Being extra helpful today"
                value={bonusNote}
                onChange={e => setBonusNote(e.target.value)}
                className="rounded-xl border-2 border-amber-200 px-3 py-2 text-amber-900 outline-none focus:border-amber-400"
              />
            </div>
            <button
              onClick={handleAwardBonus}
              disabled={bonusAmount < 1}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold transition-colors text-lg"
            >
              Award {bonusAmount} ⭐
            </button>
            <button onClick={() => setShowBonus(false)} className="text-center text-amber-400 text-sm">Cancel</button>
          </div>
        </div>
      )}
    </main>
  )
}
