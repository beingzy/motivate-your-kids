'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFamily } from '@/context/FamilyContext'
import type { Transaction } from '@/types'

function formatTime(ts: string): string {
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'yesterday'
  return `${diffDays}d ago`
}

export default function ParentKidPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { store, getBalance, logCompletion, awardBonus, getTransactions } = useFamily()

  const [flash, setFlash] = useState<string | null>(null)
  const [showBonus, setShowBonus] = useState(false)
  const [bonusAmount, setBonusAmount] = useState(5)
  const [bonusNote, setBonusNote] = useState('')

  const kid = store.kids.find(k => k.id === id)
  useEffect(() => { if (!kid) router.replace('/parent') }, [kid, router])
  if (!kid) return null

  const balance = getBalance(id)
  const activeActions = store.actions.filter(a => a.isActive)
  const recentTxs: Transaction[] = getTransactions(id).slice(0, 10)

  function handleLogAction(actionId: string, actionName: string) {
    logCompletion(id, actionId)
    setFlash(`Logged: ${actionName}!`)
    setTimeout(() => setFlash(null), 2500)
  }

  function handleAwardBonus() {
    if (bonusAmount < 1 || bonusAmount > 50) return
    awardBonus(id, bonusAmount, bonusNote.trim() || 'Bonus stars')
    setShowBonus(false)
    setBonusNote('')
    setBonusAmount(5)
    setFlash(`Awarded ${bonusAmount} bonus stars!`)
    setTimeout(() => setFlash(null), 2500)
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

  return (
    <main className="p-5 max-w-lg mx-auto pb-28">
      {/* Flash toast */}
      {flash && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-white font-bold rounded-2xl px-5 py-3 shadow-lg text-sm">
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
          <div className="ml-auto">
            <button
              onClick={() => setShowBonus(true)}
              className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl bg-amber-100 hover:bg-amber-200 transition-colors"
            >
              <span className="text-xl">⭐</span>
              <span className="text-xs font-bold text-amber-700">Bonus</span>
            </button>
          </div>
        </div>
      </header>

      {/* Log an action */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-amber-500 uppercase tracking-wide mb-3">Log an action</h2>
        {activeActions.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 text-center text-amber-400">
            No active actions. Add some in the Actions tab.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {activeActions.map(action => {
              const catEmoji = getCategoryEmoji(action.id)
              return (
                <button
                  key={action.id}
                  onClick={() => handleLogAction(action.id, action.name)}
                  className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 text-left hover:bg-amber-50 active:scale-95 transition-all border-2 border-transparent hover:border-amber-200"
                >
                  <span className="text-2xl w-10 text-center">{catEmoji}</span>
                  <div className="flex-1">
                    <p className="font-bold text-amber-900">{action.name}</p>
                    {action.description && (
                      <p className="text-amber-500 text-xs">{action.description}</p>
                    )}
                  </div>
                  <span className="font-black text-amber-500 text-sm">+{action.pointsValue} ⭐</span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* Recent activity */}
      <section>
        <h2 className="text-sm font-semibold text-amber-500 uppercase tracking-wide mb-3">Recent activity</h2>
        {recentTxs.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 text-center text-amber-400">
            No activity yet. Log an action above!
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {recentTxs.map((tx, i) => (
              <div
                key={tx.id}
                className={`flex items-center gap-3 px-4 py-3 ${i < recentTxs.length - 1 ? 'border-b border-amber-50' : ''}`}
              >
                <span className="text-xl">
                  {tx.type === 'earn' ? '✅' : '🎁'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-amber-900 text-sm truncate">{getTxLabel(tx)}</p>
                  <p className="text-amber-400 text-xs">{formatTime(tx.timestamp)}</p>
                </div>
                <span className={`font-bold text-sm ${tx.type === 'earn' ? 'text-green-500' : 'text-red-400'}`}>
                  {tx.type === 'earn' ? '+' : '-'}{tx.amount} ⭐
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Award Bonus Modal */}
      {showBonus && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowBonus(false)}>
          <div
            className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-w-lg mx-auto"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-amber-900 text-center">Award Bonus Stars ⭐</h2>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-amber-700">Stars (1–50)</label>
              <input
                type="number"
                min={1}
                max={50}
                value={bonusAmount}
                onChange={e => setBonusAmount(Number(e.target.value))}
                className="rounded-xl border-2 border-amber-200 px-3 py-2 text-amber-900 outline-none focus:border-amber-400 text-center text-2xl font-bold"
              />
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
              disabled={bonusAmount < 1 || bonusAmount > 50}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold transition-colors text-lg"
            >
              Award {bonusAmount} ⭐
            </button>
            <button onClick={() => setShowBonus(false)} className="text-center text-amber-400 text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
