'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { useFamily } from '@/context/FamilyContext'
import { AvatarDisplay } from '@/components/AvatarDisplay'

function AnimatedNumber({ from, to }: { from: number; to: number }) {
  const [current, setCurrent] = useState(from)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const duration = 800
    const start = performance.now()
    const diff = to - from

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(Math.round(from + diff * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [from, to])

  return <>{current}</>
}

type Phase = 'confirm' | 'animating' | 'done'

export default function CancelConfirmPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { store, cancelTransaction, getBalance } = useFamily()
  const [phase, setPhase] = useState<Phase>('confirm')

  // Snapshot balance at the moment of confirmation so re-renders don't collapse the animation
  const [snapshotFrom, setSnapshotFrom] = useState(0)
  const [snapshotTo, setSnapshotTo] = useState(0)
  const [snapshotDelta, setSnapshotDelta] = useState(0)

  const tx = store.transactions.find(t => t.id === id)
  const isCancelled = store.transactions.some(t => t.cancelledTxId === id)
  const isCancelEntry = !!tx?.cancelledTxId

  if (!tx || isCancelled || isCancelEntry) {
    // Guard: tx not found, already cancelled, or is itself a cancel entry
    if (phase !== 'animating' && phase !== 'done') {
      return (
        <main className="p-5 max-w-lg mx-auto">
          <div className="text-center py-16">
            <p className="text-ink-secondary">
              {!tx ? 'Transaction not found.' : 'This action has already been cancelled.'}
            </p>
            <button type="button" onClick={() => router.push('/parent/history')} className="mt-4 text-brand font-bold text-sm">
              ← Back to History
            </button>
          </div>
        </main>
      )
    }
  }

  const kid = tx ? store.kids.find(k => k.id === tx.kidId) : null
  const action = tx?.actionId ? store.actions.find(a => a.id === tx.actionId) : null
  const reward = tx?.rewardId ? store.rewards.find(r => r.id === tx.rewardId) : null
  const label = action?.name ?? reward?.name ?? tx?.note ?? tx?.reason ?? (tx?.type === 'earn' ? 'Bonus stars' : tx?.type === 'deduct' ? 'Deduction' : 'Redemption')
  const isEarn = tx?.type === 'earn'

  const currentBalance = tx ? getBalance(tx.kidId) : 0
  const pointsDelta = isEarn ? -(tx?.amount ?? 0) : +(tx?.amount ?? 0)
  const balanceAfter = currentBalance + pointsDelta

  function handleConfirm() {
    if (!tx) return
    // Snapshot values before dispatching so re-render doesn't collapse animation
    setSnapshotFrom(currentBalance)
    setSnapshotTo(balanceAfter)
    setSnapshotDelta(pointsDelta)
    cancelTransaction(tx.id)
    setPhase('animating')
    setTimeout(() => setPhase('done'), 1200)
  }

  if (phase === 'animating' || phase === 'done') {
    return (
      <main className="p-5 max-w-lg mx-auto">
        <div className="flex flex-col items-center justify-center py-16">
          {/* Animated star balance */}
          <div className="text-6xl mb-3">⭐</div>
          <p className="text-ink-muted text-sm mb-1">{kid?.name ?? 'Unknown'}</p>
          <p className="text-4xl font-black text-ink-primary tabular-nums">
            <AnimatedNumber from={snapshotFrom} to={snapshotTo} />
          </p>

          {/* Delta indicator */}
          <div
            className={`mt-3 text-lg font-bold transition-all duration-500 ${
              phase === 'animating' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
            } ${snapshotDelta > 0 ? 'text-green-500' : 'text-red-400'}`}
          >
            {snapshotDelta > 0 ? '+' : ''}{snapshotDelta} stars
          </div>

          {/* Success message */}
          <div
            className={`mt-6 transition-all duration-500 ${
              phase === 'done' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="text-3xl mb-2 text-center">✓</div>
            <p className="text-ink-primary font-bold text-center">Action cancelled</p>
            <p className="text-ink-muted text-sm text-center mt-1">A reverse entry has been created</p>
            <button
              type="button"
              onClick={() => router.push('/parent/history')}
              className="mt-6 w-full py-2.5 rounded-xl bg-brand text-white font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Back to History
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="p-5 max-w-lg mx-auto">
      <button
        type="button"
        onClick={() => router.back()}
        className="text-brand font-bold text-sm mb-4 inline-block"
      >
        ← Back
      </button>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        {/* Header */}
        <div className="px-5 py-5 text-center border-b border-line-subtle">
          <div className="text-4xl mb-2">⚠️</div>
          <h1 className="text-xl font-bold text-ink-primary">Cancel this action?</h1>
          <p className="text-ink-muted text-sm mt-1">This will create a reverse entry to undo the points.</p>
        </div>

        {/* Original transaction */}
        <div className="px-5 py-4 border-b border-line-subtle">
          <p className="text-ink-muted text-xs font-bold uppercase mb-2">Original Action</p>
          <div className="flex items-center gap-3">
            <AvatarDisplay avatar={kid?.avatar ?? '👦'} size={32} frame={kid?.avatarFrame} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-ink-primary text-sm">{label}</p>
              <p className="text-brand text-xs">{kid?.name ?? 'Unknown'}</p>
            </div>
            <span className={`font-bold text-sm ${isEarn ? 'text-green-500' : 'text-red-400'}`}>
              {isEarn ? '+' : '-'}{tx?.amount ?? 0}⭐
            </span>
          </div>
        </div>

        {/* Points impact */}
        <div className="px-5 py-4 border-b border-line-subtle">
          <p className="text-ink-muted text-xs font-bold uppercase mb-3">Impact on {kid?.name ?? 'Kid'}&apos;s Stars</p>
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-ink-muted text-xs">Current</p>
              <p className="text-2xl font-black text-ink-primary">{currentBalance}⭐</p>
            </div>
            <div className="text-center px-3">
              <span className={`text-lg font-bold ${pointsDelta > 0 ? 'text-green-500' : 'text-red-400'}`}>
                →
              </span>
              <p className={`text-xs font-bold ${pointsDelta > 0 ? 'text-green-500' : 'text-red-400'}`}>
                {pointsDelta > 0 ? '+' : ''}{pointsDelta}
              </p>
            </div>
            <div className="text-center flex-1">
              <p className="text-ink-muted text-xs">After</p>
              <p className={`text-2xl font-black ${balanceAfter < 0 ? 'text-red-400' : 'text-ink-primary'}`}>{balanceAfter}⭐</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-5 py-4 space-y-2">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors"
          >
            Confirm Cancel
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full py-2.5 rounded-xl bg-page text-ink-secondary font-bold text-sm border-2 border-line hover:border-brand transition-colors"
          >
            Keep Action
          </button>
        </div>
      </div>
    </main>
  )
}
