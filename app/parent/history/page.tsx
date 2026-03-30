'use client'

import { useFamily } from '@/context/FamilyContext'
import { AvatarDisplay } from '@/components/AvatarDisplay'
import Link from 'next/link'

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
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const STATUS_LABEL: Record<string, string> = {
  approved: '✓',
  pending: '⏳',
  denied: '✕',
}

const STATUS_COLOR: Record<string, string> = {
  approved: 'text-green-500',
  pending: 'text-ink-muted',
  denied: 'text-red-400',
}

export default function HistoryPage() {
  const { store } = useFamily()

  const cancelledTxIds = new Set(
    store.transactions.filter(tx => tx.cancelledTxId).map(tx => tx.cancelledTxId),
  )

  const allTxs = [...store.transactions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )

  return (
    <main className="p-5 max-w-lg mx-auto">
      <header className="pt-4 mb-6">
        <h1 className="text-2xl font-bold text-ink-primary">Activity History</h1>
        <p className="text-brand text-sm mt-1">{allTxs.length} total events</p>
      </header>

      {allTxs.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-ink-secondary font-medium">No activity yet.</p>
          <p className="text-brand text-sm mt-1">Log some actions to see history here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {allTxs.map((tx, i) => {
            const kid = store.kids.find(k => k.id === tx.kidId)
            const action = tx.actionId ? store.actions.find(a => a.id === tx.actionId) : null
            const reward = tx.rewardId ? store.rewards.find(r => r.id === tx.rewardId) : null
            const label = action?.name ?? reward?.name ?? tx.reason ?? tx.note ?? (tx.type === 'earn' ? 'Bonus stars' : tx.type === 'deduct' ? 'Deduction' : 'Redemption')
            const isEarn = tx.type === 'earn'
            const isCancelled = cancelledTxIds.has(tx.id)
            const isCancelEntry = !!tx.cancelledTxId
            const hasPhoto = !!tx.photoUrl
            const hasVoice = !!tx.voiceMemoUrl

            return (
              <div
                key={tx.id}
                className={`flex items-center gap-3 px-4 py-3 ${i < allTxs.length - 1 ? 'border-b border-line-subtle' : ''} ${isCancelled ? 'opacity-50' : ''}`}
              >
                <AvatarDisplay avatar={kid?.avatar ?? '👦'} size={32} frame={kid?.avatarFrame} />
                <Link href={`/parent/history/${tx.id}`} className="flex-1 min-w-0">
                  <p className="font-medium text-ink-primary text-sm truncate">
                    <span className="text-brand">{kid?.name ?? '?'}</span>
                    {' · '}
                    {isCancelEntry && <span className="text-ink-muted">↩ </span>}
                    {label}
                    {isCancelled && <span className="text-ink-muted text-xs ml-1">(cancelled)</span>}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-ink-muted text-xs">{formatTime(tx.timestamp)}</span>
                    {hasPhoto && <span className="text-xs" title="Has photo">📷</span>}
                    {hasVoice && <span className="text-xs" title="Has voice memo">🎤</span>}
                  </div>
                </Link>
                <div className="flex flex-col items-end gap-0.5">
                  <span className={`font-bold text-sm ${isEarn ? 'text-green-500' : 'text-red-400'} ${isCancelled ? 'line-through' : ''}`}>
                    {isEarn ? '+' : '-'}{tx.amount}⭐
                  </span>
                  {tx.type === 'redeem' && (
                    <span className={`text-xs font-bold ${STATUS_COLOR[tx.status]}`}>
                      {STATUS_LABEL[tx.status]}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
