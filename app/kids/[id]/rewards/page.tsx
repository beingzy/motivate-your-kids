'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFamily } from '@/context/FamilyContext'

export default function KidRewardsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { store, getBalance, requestRedemption } = useFamily()

  const [confirming, setConfirming] = useState<string | null>(null)
  const [sent, setSent] = useState<string | null>(null)

  const kid = store.kids.find(k => k.id === id)
  useEffect(() => { if (!kid) router.replace('/') }, [kid, router])
  if (!kid) return null

  const balance = getBalance(id)
  const activeRewards = store.rewards.filter(r => r.isActive)

  // Rewards this kid already has pending
  const pendingRewardIds = new Set(
    store.transactions
      .filter(t => t.kidId === id && t.type === 'redeem' && t.status === 'pending' && t.rewardId)
      .map(t => t.rewardId!)
  )

  function handleConfirm(rewardId: string) {
    requestRedemption(id, rewardId)
    setSent(rewardId)
    setConfirming(null)
  }

  return (
    <main className="p-5 max-w-sm mx-auto">
      <header className="pt-6 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{kid.avatar}</span>
          <h1 className="text-2xl font-bold text-amber-900">Rewards</h1>
        </div>
        <div className="inline-flex items-center gap-1 bg-white rounded-xl px-3 py-1.5 shadow-sm">
          <span className="font-black text-amber-900 text-lg">{balance}</span>
          <span className="text-lg">⭐</span>
          <span className="text-amber-500 text-sm ml-1">available</span>
        </div>
      </header>

      {activeRewards.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-3">🎁</div>
          <p className="text-amber-700">No rewards yet — ask your parent to add some!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {activeRewards.map(reward => {
            const canAfford = balance >= reward.pointsCost
            const isPending = pendingRewardIds.has(reward.id)
            const justSent = sent === reward.id

            return (
              <div
                key={reward.id}
                className={`bg-white rounded-2xl p-4 shadow-sm border-2 transition-all ${canAfford ? 'border-transparent' : 'border-transparent opacity-60'}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🎁</span>
                  <div className="flex-1">
                    <p className={`font-bold text-lg ${canAfford ? 'text-amber-900' : 'text-amber-400'}`}>
                      {reward.name}
                    </p>
                    {reward.description && (
                      <p className="text-amber-500 text-sm">{reward.description}</p>
                    )}
                    <p className={`text-sm font-bold mt-1 ${canAfford ? 'text-amber-500' : 'text-amber-300'}`}>
                      ⭐ {reward.pointsCost} stars
                      {!canAfford && (
                        <span className="font-normal"> · need {reward.pointsCost - balance} more</span>
                      )}
                    </p>
                  </div>
                </div>

                {canAfford && !isPending && !justSent && (
                  <button
                    onClick={() => setConfirming(reward.id)}
                    className="mt-3 w-full py-2.5 rounded-xl font-bold text-white transition-colors"
                    style={{ backgroundColor: kid.colorAccent }}
                  >
                    I want this! 🎉
                  </button>
                )}

                {(isPending || justSent) && (
                  <div className="mt-3 w-full py-2.5 rounded-xl bg-amber-100 text-amber-600 font-bold text-center text-sm">
                    ✓ Request sent — ask Mom/Dad!
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Confirm dialog */}
      {confirming && (() => {
        const reward = store.rewards.find(r => r.id === confirming)
        if (!reward) return null
        return (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setConfirming(null)}>
            <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
              <div className="text-center">
                <div className="text-5xl mb-2">🎁</div>
                <h2 className="text-xl font-bold text-amber-900">Spend {reward.pointsCost} ⭐?</h2>
                <p className="text-amber-600 mt-1">on <strong>{reward.name}</strong></p>
              </div>
              <button
                onClick={() => handleConfirm(reward.id)}
                className="w-full py-3 rounded-2xl text-white font-bold text-lg transition-colors"
                style={{ backgroundColor: kid.colorAccent }}
              >
                Yes, I want it! 🎉
              </button>
              <button onClick={() => setConfirming(null)} className="text-center text-amber-400 text-sm">
                Cancel
              </button>
            </div>
          </div>
        )
      })()}
    </main>
  )
}
