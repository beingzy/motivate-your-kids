'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFamily } from '@/context/FamilyContext'

export default function KidRewardsPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const { store, hydrated, getBalance } = useFamily()

  const kid = store.kids.find(k => k.id === id)
  useEffect(() => { if (hydrated && !kid) router.replace('/') }, [hydrated, kid, router])
  if (!hydrated || !kid) return null

  const balance = getBalance(id)
  const activeRewards = [...store.rewards.filter(r => r.isActive)]
    .sort((a, b) => a.pointsCost - b.pointsCost)

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
          <p className="text-amber-700">No rewards yet!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {activeRewards.map(reward => {
            const canAfford = balance >= reward.pointsCost
            return (
              <div
                key={reward.id}
                className={`bg-white rounded-2xl p-4 shadow-sm transition-all ${!canAfford ? 'opacity-55' : ''}`}
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

                {canAfford && (
                  <div
                    className="mt-3 w-full py-2.5 rounded-xl font-bold text-white text-center text-sm"
                    style={{ backgroundColor: kid.colorAccent }}
                  >
                    ✨ Ask a parent to redeem!
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
