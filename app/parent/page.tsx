'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useFamily } from '@/context/FamilyContext'
import { GettingStarted } from '@/components/GettingStarted'
import { loadMeta, saveMeta } from '@/lib/meta'
import { APP_VERSION } from '@/lib/version'
import type { Transaction } from '@/types'

function timeLabel(ts: string): string {
  const d = new Date(ts)
  const diffMins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffMins < 1440) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function groupByDate(txs: Transaction[]): { label: string; txs: Transaction[] }[] {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  const map = new Map<number, Transaction[]>()
  txs.forEach(tx => {
    const d = new Date(tx.timestamp); d.setHours(0, 0, 0, 0)
    const k = d.getTime()
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(tx)
  })
  return Array.from(map.entries())
    .sort(([a], [b]) => b - a)
    .map(([k, group]) => {
      const d = new Date(k)
      let label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      if (k === today.getTime()) label = 'Today'
      else if (k === yesterday.getTime()) label = 'Yesterday'
      return { label, txs: group }
    })
}

export default function ParentDashboard() {
  const router = useRouter()
  const { store, hydrated, getBalance } = useFamily()
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    if (hydrated && !store.family) router.replace('/')
  }, [hydrated, store.family, router])

  // Version-gated guide: show on first visit or when a new version is deployed
  useEffect(() => {
    if (!hydrated || !store.family) return
    const meta = loadMeta()
    if (meta.lastSeenVersion !== APP_VERSION) {
      saveMeta({ lastSeenVersion: APP_VERSION, guideDismissed: false })
      setShowGuide(true)
    } else {
      setShowGuide(!meta.guideDismissed)
    }
  }, [hydrated, store.family])

  const handleDismissGuide = useCallback(() => {
    saveMeta({ guideDismissed: true })
    setShowGuide(false)
  }, [])

  const allTxs = useMemo(
    () => [...store.transactions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [store.transactions],
  )
  const groups = useMemo(() => groupByDate(allTxs), [allTxs])

  if (!hydrated || !store.family) return null

  function getCategoryEmoji(actionId: string): string {
    const action = store.actions.find(a => a.id === actionId)
    if (!action) return '✅'
    return store.categories.find(c => c.id === action.categoryId)?.icon ?? '✅'
  }

  function getTxLabel(tx: Transaction): string {
    if (tx.type === 'earn' || tx.type === 'deduct') {
      const action = tx.actionId ? store.actions.find(a => a.id === tx.actionId) : null
      return action?.name ?? tx.reason ?? tx.note ?? (tx.type === 'earn' ? 'Bonus stars' : 'Deduction')
    }
    const reward = tx.rewardId ? store.rewards.find(r => r.id === tx.rewardId) : null
    return reward ? reward.name : (tx.note ?? 'Reward redeemed')
  }

  return (
    <main className="max-w-lg mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-5 pb-3">
        <div>
          <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-widest">Family</p>
          <h1 className="text-lg font-black text-amber-900 leading-tight">{store.family.name}</h1>
        </div>
        <button
          onClick={() => router.push('/')}
          className="text-xs text-amber-400 hover:text-amber-600 transition-colors"
        >
          Switch
        </button>
      </header>

      {store.kids.length === 0 ? (
        <div className="text-center py-20 px-5">
          <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
          <p className="text-amber-700 font-medium mb-1">No kids yet</p>
          <p className="text-amber-500 text-sm mb-5">Go to More → Manage Kids to add your first child.</p>
          <button
            onClick={() => router.push('/parent/more')}
            className="px-5 py-2.5 rounded-2xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors text-sm"
          >
            Go to More
          </button>
        </div>
      ) : (
        <>
          {/* ── Kid balance chips ── */}
          <div className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar">
            {store.kids.map(kid => {
              const bal = getBalance(kid.id)
              return (
                <div
                  key={kid.id}
                  className="flex-shrink-0 bg-white rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm border-l-4"
                  style={{ borderColor: kid.colorAccent }}
                >
                  <span className="text-lg leading-none">{kid.avatar}</span>
                  <div>
                    <p className="text-xs font-bold text-amber-900 leading-none">{kid.name}</p>
                    <p className="text-xs text-amber-500 mt-0.5">{bal} ⭐</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Getting started guide ── */}
          {showGuide && (
            <div className="px-4">
              <GettingStarted store={store} onDismiss={handleDismissGuide} />
            </div>
          )}

          {/* ── Activity feed ── */}
          <div className="px-4 pb-6">
            {allTxs.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-amber-600 font-medium text-sm">No activity yet</p>
                <p className="text-amber-400 text-xs mt-1">Log actions from the Actions tab to see them here.</p>
              </div>
            ) : (
              groups.map(group => (
                <div key={group.label} className="mb-4">
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1.5 px-1">
                    {group.label}
                  </p>
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    {group.txs.map((tx, i) => {
                      const kid = store.kids.find(k => k.id === tx.kidId)
                      const isEarn = tx.type === 'earn'
                      const icon = tx.type === 'redeem' ? '🎁' : (tx.actionId ? getCategoryEmoji(tx.actionId) : '⭐')
                      return (
                        <div
                          key={tx.id}
                          className={`flex items-center gap-3 px-3 py-2.5 ${i < group.txs.length - 1 ? 'border-b border-amber-50' : ''}`}
                        >
                          {/* Kid avatar */}
                          <span className="text-base flex-shrink-0 w-6 text-center">{kid?.avatar ?? '👦'}</span>
                          {/* Type icon */}
                          <span className="text-base flex-shrink-0">{icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-amber-900 truncate">{getTxLabel(tx)}</p>
                            <p className="text-[10px] text-amber-400 leading-none mt-0.5">
                              {kid?.name} · {timeLabel(tx.timestamp)}
                            </p>
                          </div>
                          <span className={`text-sm font-bold flex-shrink-0 ${isEarn ? 'text-green-500' : 'text-red-400'}`}>
                            {isEarn ? '+' : '−'}{tx.amount}⭐
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </main>
  )
}
