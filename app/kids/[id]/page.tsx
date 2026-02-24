'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFamily } from '@/context/FamilyContext'

export default function KidDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { store, getBalance, getKidBadges, getTransactions } = useFamily()

  const kid = store.kids.find(k => k.id === id)
  useEffect(() => { if (!kid) router.replace('/') }, [kid, router])
  if (!kid) return null

  const balance = getBalance(id)
  const kidBadgeRecords = getKidBadges(id)
  const recentTxs = getTransactions(id).slice(0, 5)

  return (
    <main className="p-5 max-w-sm mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between pt-6 mb-8">
        <div className="flex items-center gap-3">
          <span className="text-5xl">{kid.avatar}</span>
          <h1 className="text-2xl font-bold text-amber-900">{kid.name}</h1>
        </div>
        <button onClick={() => router.push('/')} className="text-sm text-amber-400 underline">
          Switch
        </button>
      </header>

      {/* Points balance */}
      <div className="bg-white rounded-3xl shadow-sm p-8 text-center mb-6" style={{ borderTop: `4px solid ${kid.colorAccent}` }}>
        <p className="text-amber-500 font-medium text-sm mb-2">My Stars</p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-6xl font-black text-amber-900">{balance}</span>
          <span className="text-5xl">⭐</span>
        </div>
      </div>

      {/* Badges preview */}
      {kidBadgeRecords.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold text-amber-800">My Badges</p>
            <button
              onClick={() => router.push(`/kids/${id}/badges`)}
              className="text-sm text-amber-500 underline"
            >
              See all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {kidBadgeRecords.slice(0, 6).map(kb => {
              const badge = store.badges.find(b => b.id === kb.badgeId)
              return badge ? (
                <span key={kb.badgeId} className="text-3xl" title={badge.name}>
                  {badge.icon}
                </span>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {recentTxs.length > 0 && (
        <div>
          <p className="font-bold text-amber-800 mb-2">Recent</p>
          <div className="flex flex-col gap-2">
            {recentTxs.map(tx => {
              const action = tx.actionId ? store.actions.find(a => a.id === tx.actionId) : null
              const reward = tx.rewardId ? store.rewards.find(r => r.id === tx.rewardId) : null
              const isEarn = tx.type === 'earn'
              return (
                <div key={tx.id} className="bg-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
                  <span className="text-xl">{isEarn ? '⭐' : '🎁'}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900">
                      {action?.name ?? reward?.name ?? tx.note ?? 'Bonus'}
                    </p>
                    <p className="text-xs text-amber-400">
                      {new Date(tx.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span className={`font-bold text-sm ${isEarn ? 'text-green-500' : 'text-amber-400'}`}>
                    {isEarn ? '+' : '-'}{tx.amount}⭐
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </main>
  )
}
