'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFamily } from '@/context/FamilyContext'

export default function KidRewardsPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const { store, hydrated, getBalance, addToWishlist, removeFromWishlist } = useFamily()

  const kid = store.kids.find(k => k.id === id)
  useEffect(() => { if (hydrated && !kid) router.replace('/') }, [hydrated, kid, router])
  if (!hydrated || !kid) return null

  const balance = getBalance(id)
  const wishlist = kid.wishlist ?? []
  const activeRewards = [...store.rewards.filter(r => r.isActive)]
    .sort((a, b) => a.pointsCost - b.pointsCost)

  const wishlisted = activeRewards.filter(r => wishlist.includes(r.id))
  const notWishlisted = activeRewards.filter(r => !wishlist.includes(r.id))

  return (
    <main className="p-5 max-w-sm mx-auto">
      <header className="pt-6 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{kid.avatar}</span>
          <h1 className="text-2xl font-bold text-ink-primary">Rewards</h1>
        </div>
        <div className="inline-flex items-center gap-1 bg-white rounded-xl px-3 py-1.5 shadow-card">
          <span className="font-black text-ink-primary text-lg">{balance}</span>
          <span className="text-lg">⭐</span>
          <span className="text-brand text-sm ml-1">available</span>
        </div>
      </header>

      {/* Wishlist section */}
      {wishlisted.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold text-ink-muted uppercase tracking-wide mb-2">
            ✨ My Wishlist ({wishlisted.length}/3)
          </h2>
          <div className="flex flex-col gap-2">
            {wishlisted.map(reward => {
              const canAfford = balance >= reward.pointsCost
              const progress = Math.min(1, balance / reward.pointsCost)
              return (
                <div key={reward.id} className={`bg-white rounded-2xl p-4 shadow-card border-2 ${canAfford ? 'border-green-300' : 'border-line'}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🎁</span>
                    <div className="flex-1">
                      <p className="font-bold text-ink-primary">{reward.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-sm font-bold ${canAfford ? 'text-green-600' : 'text-brand'}`}>
                          ⭐ {reward.pointsCost}
                          {!canAfford && <span className="font-normal text-ink-muted"> · need {reward.pointsCost - balance} more</span>}
                        </p>
                        {canAfford && <span className="text-green-600 text-xs font-bold">✓ Can redeem!</span>}
                      </div>
                      {/* Progress bar */}
                      {!canAfford && (
                        <div className="mt-2">
                          <div className="h-2 bg-brand-light rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand rounded-full transition-all"
                              style={{ width: `${progress * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-ink-muted mt-0.5">{balance} / {reward.pointsCost} stars</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromWishlist(id, reward.id)}
                      className="text-ink-muted hover:text-brand text-xs mt-0.5"
                      title="Remove from wishlist"
                    >
                      ✕
                    </button>
                  </div>
                  {canAfford && (
                    <div
                      className="mt-3 w-full py-2 rounded-xl font-bold text-white text-center text-sm"
                      style={{ backgroundColor: kid.colorAccent }}
                    >
                      ✨ Ask a parent to redeem!
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* All rewards */}
      {activeRewards.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-3">🎁</div>
          <p className="text-ink-secondary">No rewards yet!</p>
        </div>
      ) : (
        <section>
          {wishlisted.length > 0 && (
            <h2 className="text-xs font-bold text-ink-muted uppercase tracking-wide mb-2">All Rewards</h2>
          )}
          <div className="flex flex-col gap-3">
            {notWishlisted.map(reward => {
              const canAfford = balance >= reward.pointsCost
              return (
                <div
                  key={reward.id}
                  className={`bg-white rounded-2xl p-4 shadow-card border-2 transition-all ${
                    canAfford ? 'border-green-300' : 'border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">🎁</span>
                    <div className="flex-1">
                      <p className={`font-bold text-lg ${canAfford ? 'text-ink-primary' : 'text-ink-muted'}`}>
                        {reward.name}
                      </p>
                      {reward.description && (
                        <p className="text-brand text-sm">{reward.description}</p>
                      )}
                      <p className={`text-sm font-bold mt-1 ${canAfford ? 'text-green-600' : 'text-ink-muted'}`}>
                        ⭐ {reward.pointsCost} stars
                        {!canAfford && (
                          <span className="font-normal"> · need {reward.pointsCost - balance} more</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {canAfford ? (
                    <div
                      className="mt-3 w-full py-2.5 rounded-xl font-bold text-white text-center text-sm"
                      style={{ backgroundColor: kid.colorAccent }}
                    >
                      ✨ Ask a parent to redeem!
                    </div>
                  ) : (
                    <button
                      onClick={() => addToWishlist(id, reward.id)}
                      disabled={wishlist.length >= 3}
                      className="mt-3 w-full py-2 rounded-xl border-2 border-line text-brand text-sm font-medium hover:border-brand disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {wishlist.length >= 3 ? 'Wishlist full (max 3)' : '+ Add to wishlist'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}
    </main>
  )
}
