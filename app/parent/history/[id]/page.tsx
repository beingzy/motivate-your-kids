'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useFamily } from '@/context/FamilyContext'
import { AvatarDisplay } from '@/components/AvatarDisplay'
import Link from 'next/link'

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { store } = useFamily()
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const tx = store.transactions.find(t => t.id === id)

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  if (!tx) {
    return (
      <main className="p-5 max-w-lg mx-auto">
        <div className="text-center py-16">
          <p className="text-ink-secondary">Transaction not found.</p>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-4 text-brand font-bold text-sm"
          >
            ← Back
          </button>
        </div>
      </main>
    )
  }

  const kid = store.kids.find(k => k.id === tx.kidId)
  const action = tx.actionId ? store.actions.find(a => a.id === tx.actionId) : null
  const reward = tx.rewardId ? store.rewards.find(r => r.id === tx.rewardId) : null
  const label = action?.name ?? reward?.name ?? tx.note ?? tx.reason ?? (tx.type === 'earn' ? 'Bonus stars' : tx.type === 'deduct' ? 'Deduction' : 'Redemption')
  const isEarn = tx.type === 'earn'
  const isCancelEntry = !!tx.cancelledTxId
  const isCancelled = store.transactions.some(t => t.cancelledTxId === tx.id)
  const canCancel = tx.status === 'approved' && !isCancelled && !isCancelEntry

  function togglePlay() {
    if (!tx?.voiceMemoUrl) return
    if (playing && audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlaying(false)
      return
    }
    const audio = new Audio(tx.voiceMemoUrl)
    audioRef.current = audio
    audio.onended = () => setPlaying(false)
    audio.play()
    setPlaying(true)
  }

  const timestamp = new Date(tx.timestamp)

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
        <div className={`px-5 py-4 flex items-center gap-3 ${isCancelled ? 'opacity-50' : ''}`}>
          <AvatarDisplay avatar={kid?.avatar ?? '👦'} size={40} frame={kid?.avatarFrame} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-ink-primary text-lg">
              {isCancelEntry && <span className="text-ink-muted">↩ </span>}
              {label}
              {isCancelled && <span className="text-ink-muted text-sm ml-1">(cancelled)</span>}
            </p>
            <p className="text-brand text-sm">{kid?.name ?? 'Unknown'}</p>
          </div>
          <span className={`font-bold text-lg ${isEarn ? 'text-green-500' : 'text-red-400'} ${isCancelled ? 'line-through' : ''}`}>
            {isEarn ? '+' : '-'}{tx.amount}⭐
          </span>
        </div>

        {/* Details */}
        <div className="px-5 py-3 border-t border-line-subtle space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">Type</span>
            <span className="text-ink-primary font-medium capitalize">{tx.type}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">Status</span>
            <span className="text-ink-primary font-medium capitalize">{tx.status}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">Date</span>
            <span className="text-ink-primary font-medium">
              {timestamp.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">Time</span>
            <span className="text-ink-primary font-medium">
              {timestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {tx.reason && (
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">Reason</span>
              <span className="text-ink-primary font-medium">{tx.reason}</span>
            </div>
          )}
          {tx.note && (
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">Note</span>
              <span className="text-ink-primary font-medium">{tx.note}</span>
            </div>
          )}
        </div>

        {/* Photo */}
        {tx.photoUrl && (
          <div className="px-5 py-3 border-t border-line-subtle">
            <p className="text-ink-muted text-xs font-bold uppercase mb-2">Photo</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tx.photoUrl}
              alt="Attached photo"
              className="rounded-xl w-full max-h-64 object-cover"
            />
          </div>
        )}

        {/* Voice Memo */}
        {tx.voiceMemoUrl && (
          <div className="px-5 py-3 border-t border-line-subtle">
            <p className="text-ink-muted text-xs font-bold uppercase mb-2">Voice Memo</p>
            <button
              type="button"
              onClick={togglePlay}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 text-green-700 text-sm font-bold border-2 border-green-200 hover:bg-green-100 transition-colors"
            >
              {playing ? '⏸ Pause' : '▶️ Play Voice Memo'}
            </button>
          </div>
        )}

        {/* Cancel Action */}
        {canCancel && (
          <div className="px-5 py-3 border-t border-line-subtle">
            <Link
              href={`/parent/history/${tx.id}/cancel`}
              className="block w-full py-2.5 rounded-xl text-sm font-bold text-center bg-red-50 text-red-500 border-2 border-red-200 hover:bg-red-100 transition-colors"
            >
              Cancel This Action
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
