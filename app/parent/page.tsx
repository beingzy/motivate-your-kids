'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFamily } from '@/context/FamilyContext'

export default function ParentDashboard() {
  const router = useRouter()
  const { store, getBalance, getPendingCount } = useFamily()

  useEffect(() => {
    if (!store.family) router.replace('/')
  }, [store.family, router])

  if (!store.family) return null

  return (
    <main className="p-5 max-w-lg mx-auto">
      <header className="flex items-center justify-between mb-6 pt-4">
        <div>
          <p className="text-sm text-amber-600 font-medium">Welcome back 👋</p>
          <h1 className="text-2xl font-bold text-amber-900">{store.family.name}</h1>
        </div>
        <button
          onClick={() => router.push('/')}
          className="text-sm text-amber-500 underline"
        >
          Switch
        </button>
      </header>

      {/* Pending approvals banner */}
      {getPendingCount() > 0 && (
        <button
          onClick={() => router.push('/parent/approvals')}
          className="w-full mb-5 bg-amber-400 hover:bg-amber-500 text-white rounded-2xl px-4 py-3 flex items-center justify-between font-bold transition-colors"
        >
          <span>🎁 {getPendingCount()} reward request{getPendingCount() !== 1 ? 's' : ''} pending</span>
          <span>→</span>
        </button>
      )}

      {/* Kid cards */}
      {store.kids.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">👦</div>
          <p className="text-amber-700 font-medium">No kids yet.</p>
          <button
            onClick={() => router.push('/parent/kids')}
            className="mt-4 px-5 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors"
          >
            Add a kid
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {store.kids.map(kid => {
            const balance = getBalance(kid.id)
            const pendingCount = getPendingCount(kid.id)
            return (
              <button
                key={kid.id}
                onClick={() => router.push(`/parent/kids/${kid.id}`)}
                className="bg-white rounded-2xl p-4 shadow-sm border-l-4 flex items-center gap-4 text-left hover:bg-amber-50 transition-colors"
                style={{ borderColor: kid.colorAccent }}
              >
                <span className="text-4xl">{kid.avatar}</span>
                <div className="flex-1">
                  <p className="font-bold text-amber-900 text-lg">{kid.name}</p>
                  <p className="text-amber-600 text-sm">⭐ {balance} star{balance !== 1 ? 's' : ''}</p>
                </div>
                {pendingCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[22px] h-5 flex items-center justify-center px-1">
                    {pendingCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </main>
  )
}
