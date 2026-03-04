'use client'

import { useFamily } from '@/context/FamilyContext'

export default function ApprovalsPage() {
  const { store, approveRedemption, denyRedemption } = useFamily()

  const pending = store.transactions
    .filter(t => t.type === 'redeem' && t.status === 'pending')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <main className="p-5 max-w-lg mx-auto">
      <header className="mb-6 pt-4">
        <h1 className="text-2xl font-bold text-ink-primary">Approvals</h1>
        <p className="text-ink-secondary text-sm mt-1">
          {pending.length === 0 ? 'Nothing pending.' : `${pending.length} request${pending.length !== 1 ? 's' : ''} waiting`}
        </p>
      </header>

      {pending.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🎉</div>
          <p className="text-ink-secondary font-medium">All caught up!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {pending.map(tx => {
            const kid = store.kids.find(k => k.id === tx.kidId)
            const reward = store.rewards.find(r => r.id === tx.rewardId)
            return (
              <div key={tx.id} className="bg-white rounded-2xl p-4 shadow-card">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{kid?.avatar ?? '👦'}</span>
                  <div>
                    <p className="font-bold text-ink-primary">{kid?.name ?? 'Unknown'}</p>
                    <p className="text-brand text-sm">
                      {new Date(tx.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="bg-page rounded-xl p-3 mb-3 flex items-center gap-2">
                  <span className="text-xl">🎁</span>
                  <div>
                    <p className="font-medium text-ink-primary">{reward?.name ?? 'Unknown reward'}</p>
                    <p className="text-brand text-sm">⭐ {tx.amount} stars</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approveRedemption(tx.id)}
                    className="flex-1 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold transition-colors"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => denyRedemption(tx.id)}
                    className="flex-1 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-600 font-bold transition-colors"
                  >
                    ✕ Deny
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
