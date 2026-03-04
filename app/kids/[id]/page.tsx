'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFamily } from '@/context/FamilyContext'

export default function KidDashboard({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const { store, hydrated, getBalance, getKidBadges, getTransactions } = useFamily()

  const kid = store.kids.find(k => k.id === id)
  useEffect(() => { if (hydrated && !kid) router.replace('/') }, [hydrated, kid, router])
  if (!hydrated || !kid) return null

  const balance = getBalance(id)
  const kidBadgeRecords = getKidBadges(id)
  const allTxs = getTransactions(id)
  const recentTxs = allTxs.slice(0, 10)

  function getCategoryIcon(actionId?: string): string {
    if (!actionId) return '⭐'
    const action = store.actions.find(a => a.id === actionId)
    if (!action) return '⭐'
    return store.categories.find(c => c.id === action.categoryId)?.icon ?? '⭐'
  }

  return (
    <main className="p-5 max-w-sm mx-auto pb-24">
      {/* Header */}
      <header className="flex items-center justify-between pt-6 mb-8">
        <div className="flex items-center gap-3">
          <span className="text-5xl">{kid.avatar}</span>
          <h1 className="text-2xl font-bold text-ink-primary">{kid.name}</h1>
        </div>
        <button onClick={() => router.push('/')} className="text-sm text-ink-muted underline">
          Switch
        </button>
      </header>

      {/* Points balance */}
      <div className="bg-white rounded-3xl shadow-card p-8 text-center mb-6" style={{ borderTop: `4px solid ${kid.colorAccent}` }}>
        <p className="text-brand font-medium text-sm mb-2">My Stars</p>
        <div key={balance} className="flex items-center justify-center gap-2 animate-star-pop">
          <span className="text-6xl font-black text-ink-primary">{balance}</span>
          <span className="text-5xl">⭐</span>
        </div>
      </div>

      {/* Badges preview */}
      {kidBadgeRecords.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold text-ink-secondary">My Badges</p>
            <button
              onClick={() => router.push(`/kids/${id}/badges`)}
              className="text-sm text-brand underline"
            >
              See all ({kidBadgeRecords.length})
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {kidBadgeRecords.slice(0, 8).map(kb => {
              const badge = store.badges.find(b => b.id === kb.badgeId)
              return badge ? (
                <div key={kb.badgeId} className="bg-white rounded-2xl px-3 py-2 shadow-card text-center flex flex-col items-center gap-0.5">
                  <span className="text-2xl">{badge.icon}</span>
                  <span className="text-[10px] text-ink-secondary font-medium leading-tight max-w-[52px] truncate">{badge.name}</span>
                </div>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="font-bold text-ink-secondary">Recent</p>
          {allTxs.length > 10 && (
            <button
              onClick={() => router.push(`/kids/${id}/history`)}
              className="text-sm text-brand underline"
            >
              See all ({allTxs.length})
            </button>
          )}
        </div>
        {recentTxs.length === 0 ? (
          <div className="text-center py-8 text-ink-muted text-sm">
            No activity yet — ask a parent to log your first action!
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentTxs.map(tx => {
              const action = tx.actionId ? store.actions.find(a => a.id === tx.actionId) : null
              const reward = tx.rewardId ? store.rewards.find(r => r.id === tx.rewardId) : null
              const isEarn = tx.type === 'earn'
              const icon = isEarn ? getCategoryIcon(tx.actionId) : '🎁'
              const label = action?.name ?? reward?.name ?? tx.reason ?? tx.note ?? (isEarn ? 'Bonus stars' : tx.type === 'deduct' ? 'Stars deducted' : 'Reward')
              return (
                <div key={tx.id} className="bg-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-card">
                  <span className="text-xl">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-primary truncate">{label}</p>
                    <p className="text-xs text-ink-muted">
                      {new Date(tx.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span className={`font-bold text-sm flex-shrink-0 ${isEarn ? 'text-green-500' : 'text-ink-muted'}`}>
                    {isEarn ? '+' : '-'}{tx.amount}⭐
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
