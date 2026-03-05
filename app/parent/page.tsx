'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useFamily } from '@/context/FamilyContext'
import { useLocale } from '@/context/LocaleContext'
import { GettingStarted } from '@/components/GettingStarted'
import { loadMeta, saveMeta } from '@/lib/meta'
import { APP_VERSION } from '@/lib/version'
import { fireStarConfetti } from '@/lib/confetti'
import { randomEarnPhrase, randomDeductPhrase } from '@/lib/messages'
import type { Transaction } from '@/types'

type QuickType = 'earn' | 'deduct' | 'redeem'

function groupByDate(
  txs: Transaction[],
  today: (key: string) => string,
  yesterday: (key: string) => string,
): { label: string; txs: Transaction[] }[] {
  const todayD = new Date(); todayD.setHours(0, 0, 0, 0)
  const yestD = new Date(todayD); yestD.setDate(yestD.getDate() - 1)
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
      if (k === todayD.getTime()) label = today('home.today')
      else if (k === yestD.getTime()) label = yesterday('home.yesterday')
      return { label, txs: group }
    })
}

function timeLabel(ts: string): string {
  const d = new Date(ts)
  const diffMins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffMins < 1440) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function ParentDashboard() {
  const router = useRouter()
  const {
    store, hydrated, getBalance, getTransactions,
    awardBonus, awardDeduction, removeTransaction,
    logCompletion, redeemReward, addAction,
  } = useFamily()
  const { t } = useLocale()

  const [showGuide, setShowGuide] = useState(false)

  // Quick action sheet
  const [quickType, setQuickType] = useState<QuickType | null>(null)
  const [quickKidId, setQuickKidId] = useState<string | null>(null)
  const [quickActionId, setQuickActionId] = useState<string | null>(null)
  const [quickAmount, setQuickAmount] = useState(5)
  const [quickReason, setQuickReason] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createPoints, setCreatePoints] = useState(5)
  const [pendingSelectName, setPendingSelectName] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  // Redeem confirm state
  const [redeemRewardId, setRedeemRewardId] = useState<string | null>(null)
  const [redeemCost, setRedeemCost] = useState(0)

  // View more / search in sheet
  const [showAllActions, setShowAllActions] = useState(false)
  const [showAllRewards, setShowAllRewards] = useState(false)
  const [quickSearch, setQuickSearch] = useState('')

  // Undo delete
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const pendingDeleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingDeleteTxRef = useRef<Transaction | null>(null)

  useEffect(() => {
    if (hydrated && !store.family) router.replace('/')
  }, [hydrated, store.family, router])

  // Version-gated guide
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

  // Auto-select newly created action by name
  useEffect(() => {
    if (!pendingSelectName || !quickType || quickType === 'redeem') return
    const isDeduction = quickType === 'deduct'
    const newAction = store.actions.find(
      a => a.isActive && a.isDeduction === isDeduction && a.name.trim() === pendingSelectName
    )
    if (newAction) {
      setQuickActionId(newAction.id)
      setQuickAmount(newAction.pointsValue)
      setPendingSelectName(null)
      setShowCreateForm(false)
    }
  }, [store.actions, pendingSelectName, quickType])

  const handleDismissGuide = useCallback(() => {
    saveMeta({ guideDismissed: true })
    setShowGuide(false)
  }, [])

  const allTxs = useMemo(
    () => [...store.transactions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [store.transactions],
  )

  const displayedTxs = useMemo(
    () => allTxs.filter(tx => tx.id !== pendingDeleteId),
    [allTxs, pendingDeleteId],
  )

  const groups = useMemo(() => groupByDate(displayedTxs, t, t), [displayedTxs, t])

  const actionLastUsed = useMemo(() => {
    const map: Record<string, number> = {}
    store.transactions.forEach(tx => {
      if ((tx.type === 'earn' || tx.type === 'deduct') && tx.actionId) {
        const ts = new Date(tx.timestamp).getTime()
        if (!map[tx.actionId] || ts > map[tx.actionId]) map[tx.actionId] = ts
      }
    })
    return map
  }, [store.transactions])

  const rewardLastUsed = useMemo(() => {
    const map: Record<string, number> = {}
    store.transactions.forEach(tx => {
      if (tx.type === 'redeem' && tx.rewardId) {
        const ts = new Date(tx.timestamp).getTime()
        if (!map[tx.rewardId] || ts > map[tx.rewardId]) map[tx.rewardId] = ts
      }
    })
    return map
  }, [store.transactions])

  if (!hydrated || !store.family) return null

  function showFlash(msg: string) {
    setFlash(msg)
    setTimeout(() => setFlash(null), 3000)
  }

  function getCategoryEmoji(actionId: string): string {
    const action = store.actions.find(a => a.id === actionId)
    if (!action) return '✅'
    return store.categories.find(c => c.id === action.categoryId)?.icon ?? '✅'
  }

  function getTxLabel(tx: Transaction): string {
    if (tx.type === 'earn' || tx.type === 'deduct') {
      const action = tx.actionId ? store.actions.find(a => a.id === tx.actionId) : null
      return action?.name ?? tx.reason ?? tx.note ?? t(tx.type === 'earn' ? 'home.bonus-stars' : 'home.deduction')
    }
    const reward = tx.rewardId ? store.rewards.find(r => r.id === tx.rewardId) : null
    return reward ? reward.name : (tx.note ?? t('home.reward-redeemed'))
  }

  function openQuick(type: QuickType, kidId: string) {
    setQuickType(type)
    setQuickKidId(kidId)
    setQuickAmount(5)
    setQuickReason('')
    setQuickActionId(null)
    setShowCreateForm(false)
    setCreateName('')
    setCreatePoints(5)
    setRedeemRewardId(null)
    setShowAllActions(false)
    setShowAllRewards(false)
    setQuickSearch('')
  }

  function handleSelectAction(actionId: string) {
    const action = store.actions.find(a => a.id === actionId)
    setQuickActionId(actionId)
    if (action) setQuickAmount(action.pointsValue)
  }

  function handleCreateAndSelect() {
    if (!createName.trim() || !quickType || quickType === 'redeem') return
    addAction({
      name: createName.trim(),
      description: '',
      categoryId: '',
      pointsValue: createPoints,
      isDeduction: quickType === 'deduct',
      isTemplate: false,
      isActive: true,
    })
    setPendingSelectName(createName.trim())
  }

  function handleQuickConfirm() {
    if (!quickKidId || !quickType || quickType === 'redeem') return
    const kidName = store.kids.find(k => k.id === quickKidId)?.name ?? ''

    if (quickActionId) {
      logCompletion(quickKidId, quickActionId, quickAmount)
    } else if (quickType === 'earn') {
      awardBonus(quickKidId, quickAmount, quickReason.trim() || 'Bonus stars')
    } else {
      awardDeduction(quickKidId, quickAmount, quickReason.trim() || undefined)
    }

    if (quickType === 'earn') {
      showFlash(`+${quickAmount}⭐ for ${kidName}! ${randomEarnPhrase()}`)
      fireStarConfetti()
    } else {
      showFlash(`−${quickAmount}⭐ for ${kidName}. ${randomDeductPhrase()}`)
    }
    setQuickType(null)
  }

  function handleRedeemTap(rewardId: string) {
    const reward = store.rewards.find(r => r.id === rewardId)
    if (!reward) return
    setRedeemRewardId(rewardId)
    setRedeemCost(reward.pointsCost)
  }

  function handleConfirmRedeem() {
    if (!quickKidId || !redeemRewardId) return
    const reward = store.rewards.find(r => r.id === redeemRewardId)
    if (!reward) return
    redeemReward(quickKidId, redeemRewardId, redeemCost)
    const kidName = store.kids.find(k => k.id === quickKidId)?.name ?? ''
    showFlash(`🎁 ${reward.name} → ${kidName}!`)
    setQuickType(null)
  }

  function handleDeleteTx(tx: Transaction) {
    if (pendingDeleteTimer.current) {
      clearTimeout(pendingDeleteTimer.current)
      if (pendingDeleteTxRef.current) removeTransaction(pendingDeleteTxRef.current.id)
    }
    pendingDeleteTxRef.current = tx
    setPendingDeleteId(tx.id)
    pendingDeleteTimer.current = setTimeout(() => {
      removeTransaction(tx.id)
      setPendingDeleteId(null)
      pendingDeleteTxRef.current = null
      pendingDeleteTimer.current = null
    }, 60_000)
  }

  function handleUndoDelete() {
    if (pendingDeleteTimer.current) {
      clearTimeout(pendingDeleteTimer.current)
      pendingDeleteTimer.current = null
    }
    pendingDeleteTxRef.current = null
    setPendingDeleteId(null)
  }

  const earnActions = store.actions.filter(a => a.isActive && !a.isDeduction)
  const deductActions = store.actions.filter(a => a.isActive && a.isDeduction)
  const activeRewards = store.rewards.filter(r => r.isActive !== false)

  const sortedRewards = [...activeRewards].sort(
    (a, b) => (rewardLastUsed[b.id] ?? 0) - (rewardLastUsed[a.id] ?? 0)
  )
  const filteredRewards = quickSearch
    ? sortedRewards.filter(r => r.name.toLowerCase().includes(quickSearch.toLowerCase()))
    : sortedRewards
  const displayedRewards = quickSearch
    ? filteredRewards
    : (showAllRewards ? sortedRewards : sortedRewards.slice(0, 3))
  const hasMoreRewards = !quickSearch && sortedRewards.length > 3

  const quickKid = quickKidId ? store.kids.find(k => k.id === quickKidId) : null
  const isEarnOrDeduct = quickType === 'earn' || quickType === 'deduct'
  const relevantActions = quickType === 'earn' ? earnActions : deductActions
  const sortedRelevantActions = [...relevantActions].sort(
    (a, b) => (actionLastUsed[b.id] ?? 0) - (actionLastUsed[a.id] ?? 0)
  )
  const filteredActions = quickSearch
    ? sortedRelevantActions.filter(a => a.name.toLowerCase().includes(quickSearch.toLowerCase()))
    : sortedRelevantActions
  const displayedActions = quickSearch
    ? filteredActions
    : (showAllActions ? sortedRelevantActions : sortedRelevantActions.slice(0, 3))
  const hasMoreActions = !quickSearch && sortedRelevantActions.length > 3
  const kidBalance = quickKidId ? getBalance(quickKidId) : 0
  const kidTxs = quickKidId
    ? getTransactions(quickKidId)
        .filter(tx => tx.id !== pendingDeleteId)
        .slice(0, 8)
    : []

  return (
    <main className="max-w-lg mx-auto pb-6">
      {/* Flash toast */}
      {flash && (
        <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2 bg-brand text-white font-bold rounded-2xl px-5 py-3 shadow-lg text-sm whitespace-nowrap animate-slide-down">
          {flash}
        </div>
      )}

      {/* Undo delete toast */}
      {pendingDeleteId && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg whitespace-nowrap">
          <span className="text-sm">{t('home.tx-deleted')}</span>
          <button onClick={handleUndoDelete} className="text-brand-light font-bold text-sm underline">
            {t('undo')}
          </button>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-5 pb-4">
        <div>
          <p className="text-[10px] text-ink-muted font-semibold uppercase tracking-widest">{t('home.family')}</p>
          <h1 className="text-lg font-black text-ink-primary leading-tight">{store.family.name}</h1>
        </div>
        <button onClick={() => router.push('/')} className="text-xs text-ink-muted hover:text-ink-secondary transition-colors">
          {t('home.switch')}
        </button>
      </header>

      {store.kids.length === 0 ? (
        <div className="text-center py-20 px-5">
          <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
          <p className="text-ink-secondary font-medium mb-1">{t('home.no-kids')}</p>
          <p className="text-brand text-sm mb-5">{t('home.no-kids-hint')}</p>
          <button
            onClick={() => router.push('/parent/kids')}
            className="px-5 py-2.5 rounded-2xl bg-brand text-white font-bold hover:bg-brand-hover transition-colors text-sm"
          >
            {t('home.add-kid')}
          </button>
        </div>
      ) : (
        <>
          {/* Getting started guide */}
          {showGuide && (
            <div className="px-4 mb-2">
              <GettingStarted store={store} onDismiss={handleDismissGuide} />
            </div>
          )}

          {/* Per-kid cards */}
          <div className="px-4 flex flex-col gap-3 mb-5">
            {store.kids.map(kid => {
              const bal = getBalance(kid.id)
              return (
                <div
                  key={kid.id}
                  className="bg-white rounded-2xl shadow-card px-4 py-4 border-t-2"
                  style={{ borderColor: kid.colorAccent }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl leading-none">{kid.avatar}</span>
                    <div className="flex-1">
                      <p className="font-bold text-ink-primary leading-tight">{kid.name}</p>
                      <p className="text-sm font-bold" style={{ color: kid.colorAccent }}>{bal} ⭐</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openQuick('earn', kid.id)}
                      className="flex-1 py-2 rounded-xl bg-brand text-white font-bold text-xs hover:bg-brand-hover transition-colors shadow-brand"
                    >
                      {t('home.add-stars')}
                    </button>
                    <button
                      onClick={() => openQuick('deduct', kid.id)}
                      className="flex-1 py-2 rounded-xl bg-red-50 text-red-500 font-bold text-xs hover:bg-red-100 transition-colors border border-red-200"
                    >
                      {t('home.deduct-stars')}
                    </button>
                    <button
                      onClick={() => openQuick('redeem', kid.id)}
                      className="flex-1 py-2 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-xs hover:bg-emerald-100 transition-colors border border-emerald-200"
                    >
                      {t('home.redeem')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Activity feed */}
          <div className="px-4">
            <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2 px-1">
              {t('quick.recent')}
            </p>
            {displayedTxs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-ink-secondary font-medium text-sm">{t('home.no-activity')}</p>
                <p className="text-ink-muted text-xs mt-1">{t('home.no-activity-hint')}</p>
              </div>
            ) : (
              groups.map(group => (
                <div key={group.label} className="mb-4">
                  <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-1.5 px-1">
                    {group.label}
                  </p>
                  <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                    {group.txs.map((tx, i) => {
                      const kid = store.kids.find(k => k.id === tx.kidId)
                      const isEarn = tx.type === 'earn'
                      const icon = tx.type === 'redeem' ? '🎁' : (tx.actionId ? getCategoryEmoji(tx.actionId) : '⭐')
                      return (
                        <div
                          key={tx.id}
                          className={`flex items-center gap-3 px-3 py-2.5 ${i < group.txs.length - 1 ? 'border-b border-line-subtle' : ''}`}
                        >
                          <span className="text-base flex-shrink-0 w-6 text-center">{kid?.avatar ?? '👦'}</span>
                          <span className="text-base flex-shrink-0">{icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink-primary truncate">{getTxLabel(tx)}</p>
                            <p className="text-[10px] text-ink-muted leading-none mt-0.5">
                              {kid?.name} · {timeLabel(tx.timestamp)}
                            </p>
                          </div>
                          <span className={`text-sm font-bold flex-shrink-0 ${isEarn ? 'text-green-500' : 'text-red-400'}`}>
                            {isEarn ? '+' : '−'}{tx.amount}⭐
                          </span>
                          <button
                            onClick={() => handleDeleteTx(tx)}
                            className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 text-xs p-1"
                            aria-label="Delete"
                          >
                            ✕
                          </button>
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

      {/* Per-kid bottom sheet */}
      {quickType && quickKidId && quickKid && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end"
          onClick={() => setQuickType(null)}
        >
          <div
            className="bg-white w-full rounded-t-3xl flex flex-col max-w-lg mx-auto"
            style={{ maxHeight: '88vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet header — fixed */}
            <div className="flex-shrink-0 px-5 pt-5 pb-3 border-b border-line-subtle">
              <div className="flex items-center gap-3">
                <span className="text-3xl leading-none">{quickKid.avatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink-primary leading-tight">{quickKid.name}</p>
                  <p className="text-xs text-ink-muted">{t('quick.balance', { n: kidBalance })}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                  quickType === 'earn' ? 'bg-brand-light text-brand' :
                  quickType === 'deduct' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {t(quickType === 'earn' ? 'quick.award-stars' : quickType === 'deduct' ? 'quick.deduct-stars' : 'quick.redeem-reward')}
                </span>
                <button
                  onClick={() => setQuickType(null)}
                  className="text-ink-muted hover:text-ink-secondary transition-colors p-1 flex-shrink-0"
                >
                  ✕
                </button>
              </div>

              {/* Amount input row — earn/deduct only (FB-8) */}
              {isEarnOrDeduct && (
                <div className="mt-4">
                  <p className="text-[11px] text-ink-muted font-medium text-center mb-2">
                    {t(quickType === 'earn' ? 'quick.stars-to-award' : 'quick.stars-to-deduct')}
                  </p>
                  <div className="flex items-center gap-4 justify-center">
                    <button
                      onClick={() => setQuickAmount(v => Math.max(1, v - 1))}
                      className="w-10 h-10 rounded-full bg-brand-light text-ink-secondary font-black text-xl flex items-center justify-center active:scale-95 transition-transform"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={quickAmount}
                      onChange={e => {
                        const v = parseInt(e.target.value, 10)
                        setQuickAmount(isNaN(v) || v < 1 ? 1 : v)
                      }}
                      className={`text-5xl font-black w-24 text-center bg-transparent outline-none border-b-2 pb-1 ${
                        quickType === 'earn' ? 'text-ink-primary border-brand' : 'text-red-600 border-red-400'
                      }`}
                    />
                    <button
                      onClick={() => setQuickAmount(v => v + 1)}
                      className="w-10 h-10 rounded-full bg-brand-light text-ink-secondary font-black text-xl flex items-center justify-center active:scale-95 transition-transform"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">

              {/* EARN / DEDUCT */}
              {isEarnOrDeduct && (
                <div className="px-5 py-4 flex flex-col gap-3">
                  <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                    {t('quick.select-action')}
                  </p>

                  {/* Search actions */}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-sm pointer-events-none">🔍</span>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={quickSearch}
                      onChange={e => setQuickSearch(e.target.value)}
                      className="w-full rounded-xl border-2 border-line pl-9 pr-8 py-2 text-sm text-ink-primary outline-none focus:border-brand"
                    />
                    {quickSearch && (
                      <button
                        onClick={() => setQuickSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-secondary text-sm"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Action list */}
                  <div className="flex flex-col gap-1.5">
                    {sortedRelevantActions.length === 0 && !quickSearch && (
                      <p className="text-ink-muted text-sm text-center py-2">{t('quick.no-actions')}</p>
                    )}
                    {quickSearch && filteredActions.length === 0 && (
                      <p className="text-ink-muted text-sm text-center py-2">No results for &ldquo;{quickSearch}&rdquo;</p>
                    )}
                    {displayedActions.map(action => {
                      const icon = store.categories.find(c => c.id === action.categoryId)?.icon ?? (action.isDeduction ? '⚠️' : '⭐')
                      const chosen = quickActionId === action.id
                      return (
                        <button
                          key={action.id}
                          onClick={() => handleSelectAction(action.id)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${
                            chosen
                              ? (quickType === 'earn' ? 'border-brand bg-brand-light' : 'border-red-400 bg-red-50')
                              : 'border-line-subtle hover:border-line bg-white'
                          }`}
                        >
                          <span className="text-xl flex-shrink-0">{icon}</span>
                          <span className="flex-1 text-sm font-medium text-ink-primary">{action.name}</span>
                          <span className={`text-sm font-bold flex-shrink-0 ${quickType === 'earn' ? 'text-brand' : 'text-red-500'}`}>
                            {quickType === 'earn' ? '+' : '−'}{action.pointsValue}⭐
                          </span>
                          {chosen && <span className={`font-bold flex-shrink-0 text-sm ${quickType === 'earn' ? 'text-brand' : 'text-red-500'}`}>✓</span>}
                        </button>
                      )
                    })}
                    {!showAllActions && hasMoreActions && (
                      <button
                        onClick={() => setShowAllActions(true)}
                        className="text-center text-brand text-sm font-medium py-1.5 hover:text-brand-hover transition-colors"
                      >
                        View {sortedRelevantActions.length - 3} more →
                      </button>
                    )}

                    {/* No action (custom) */}
                    <button
                      onClick={() => { setQuickActionId(null); setQuickReason('') }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${
                        quickActionId === null
                          ? 'border-brand bg-brand-light'
                          : 'border-line-subtle hover:border-line bg-white'
                      }`}
                    >
                      <span className="text-xl flex-shrink-0">✏️</span>
                      <span className="flex-1 text-sm font-medium text-ink-secondary">{t('quick.custom')}</span>
                      {quickActionId === null && <span className="text-brand font-bold flex-shrink-0 text-sm">✓</span>}
                    </button>
                  </div>

                  {/* Reason field */}
                  <input
                    placeholder={t('quick.reason')}
                    value={quickReason}
                    onChange={e => setQuickReason(e.target.value)}
                    autoComplete="off"
                    autoCorrect="off"
                    className="w-full rounded-xl border-2 border-line px-3 py-2 text-ink-primary outline-none focus:border-brand text-sm"
                  />

                  {/* Create new action */}
                  {!showCreateForm ? (
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="text-center text-ink-muted hover:text-ink-secondary text-sm font-medium transition-colors"
                    >
                      {t('quick.create-new')}
                    </button>
                  ) : (
                    <div className="bg-page rounded-2xl p-3 flex flex-col gap-2">
                      <input
                        autoFocus
                        autoComplete="off"
                        autoCorrect="off"
                        placeholder={t('quick.action-name')}
                        value={createName}
                        onChange={e => setCreateName(e.target.value)}
                        className="rounded-xl border-2 border-line px-3 py-2 text-ink-primary outline-none focus:border-brand text-sm"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-brand font-medium">{t('quick.points')}:</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          value={createPoints}
                          onChange={e => setCreatePoints(Math.max(1, Number(e.target.value)))}
                          className="w-20 rounded-xl border-2 border-line px-2 py-1.5 text-ink-primary outline-none focus:border-brand text-center font-bold text-sm"
                        />
                        <button
                          onClick={handleCreateAndSelect}
                          disabled={!createName.trim()}
                          className="flex-1 py-1.5 rounded-xl bg-brand disabled:opacity-40 text-white font-bold text-sm transition-colors"
                        >
                          {t('quick.add-select')}
                        </button>
                        <button onClick={() => setShowCreateForm(false)} className="text-ink-muted text-sm p-1">
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Confirm */}
                  <button
                    onClick={handleQuickConfirm}
                    disabled={quickAmount < 1}
                    className={`w-full py-3 rounded-2xl disabled:opacity-40 text-white font-bold text-base transition-colors ${
                      quickType === 'earn' ? 'bg-brand hover:bg-brand-hover shadow-brand' : 'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    {quickType === 'earn'
                      ? `+${quickAmount} ⭐ → ${quickKid.name}`
                      : `−${quickAmount} ⭐ from ${quickKid.name}`}
                  </button>
                </div>
              )}

              {/* REDEEM — reward list */}
              {quickType === 'redeem' && !redeemRewardId && (
                <div className="px-5 py-4 flex flex-col gap-2">
                  <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">
                    {t('quick.choose-reward')}
                  </p>

                  {/* Search rewards */}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-sm pointer-events-none">🔍</span>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={quickSearch}
                      onChange={e => setQuickSearch(e.target.value)}
                      className="w-full rounded-xl border-2 border-line pl-9 pr-8 py-2 text-sm text-ink-primary outline-none focus:border-brand"
                    />
                    {quickSearch && (
                      <button
                        onClick={() => setQuickSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-secondary text-sm"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {sortedRewards.length === 0 ? (
                    <p className="text-ink-muted text-sm text-center py-4">{t('quick.no-rewards')}</p>
                  ) : (
                    <>
                      {quickSearch && filteredRewards.length === 0 && (
                        <p className="text-ink-muted text-sm text-center py-2">No results for &ldquo;{quickSearch}&rdquo;</p>
                      )}
                      {displayedRewards.map(reward => {
                        const canAfford = kidBalance >= reward.pointsCost
                        return (
                          <button
                            key={reward.id}
                            onClick={() => handleRedeemTap(reward.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                              canAfford
                                ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 active:scale-95'
                                : 'border-line-subtle bg-white opacity-60'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-ink-primary truncate">{reward.name}</p>
                              <p className="text-xs text-ink-muted">{reward.pointsCost}⭐ cost</p>
                            </div>
                            <span className={`text-xs font-bold flex-shrink-0 ${canAfford ? 'text-emerald-600' : 'text-ink-muted'}`}>
                              {canAfford ? '→' : `−${reward.pointsCost - kidBalance}⭐`}
                            </span>
                          </button>
                        )
                      })}
                      {!showAllRewards && hasMoreRewards && (
                        <button
                          onClick={() => setShowAllRewards(true)}
                          className="text-center text-brand text-sm font-medium py-1.5 hover:text-brand-hover transition-colors"
                        >
                          View {sortedRewards.length - 3} more →
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* REDEEM — confirm dialog */}
              {quickType === 'redeem' && redeemRewardId && (() => {
                const reward = store.rewards.find(r => r.id === redeemRewardId)
                if (!reward) return null
                return (
                  <div className="px-5 py-6 flex flex-col gap-4">
                    <div className="text-center">
                      <p className="font-bold text-ink-primary text-lg">{reward.name}</p>
                      <p className="text-xs text-ink-muted mt-1">{t('quick.redeem-adjust')}</p>
                    </div>
                    <div className="flex items-center gap-4 justify-center">
                      <button
                        onClick={() => setRedeemCost(v => Math.max(1, v - 1))}
                        className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 font-black text-xl flex items-center justify-center active:scale-95 transition-transform"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        value={redeemCost}
                        onChange={e => {
                          const v = parseInt(e.target.value, 10)
                          setRedeemCost(isNaN(v) || v < 1 ? 1 : v)
                        }}
                        className="text-5xl font-black w-24 text-center bg-transparent outline-none border-b-2 border-emerald-400 pb-1 text-emerald-700"
                      />
                      <button
                        onClick={() => setRedeemCost(v => v + 1)}
                        className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 font-black text-xl flex items-center justify-center active:scale-95 transition-transform"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-xs text-ink-muted text-center">
                      {t('quick.balance', { n: kidBalance })} → {kidBalance - redeemCost}⭐ after
                    </p>
                    <button
                      onClick={handleConfirmRedeem}
                      disabled={redeemCost < 1}
                      className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white font-bold text-base transition-colors"
                    >
                      {t('quick.confirm-redeem')} −{redeemCost}⭐
                    </button>
                    <button
                      onClick={() => setRedeemRewardId(null)}
                      className="text-center text-ink-muted text-sm"
                    >
                      ← {t('cancel')}
                    </button>
                  </div>
                )
              })()}

              {/* Kid transaction history at bottom of sheet */}
              <div className="px-5 pb-6 border-t border-line-subtle mt-1 pt-4">
                <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">
                  {t('quick.recent')}
                </p>
                {kidTxs.length === 0 ? (
                  <p className="text-xs text-ink-muted text-center py-3">{t('quick.no-history')}</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {kidTxs.map(tx => {
                      const isEarn = tx.type === 'earn'
                      const icon = tx.type === 'redeem' ? '🎁' : (tx.actionId ? getCategoryEmoji(tx.actionId) : '⭐')
                      return (
                        <div key={tx.id} className="flex items-center gap-2 py-1.5">
                          <span className="text-sm flex-shrink-0">{icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-ink-primary truncate">{getTxLabel(tx)}</p>
                            <p className="text-[10px] text-ink-muted">{timeLabel(tx.timestamp)}</p>
                          </div>
                          <span className={`text-xs font-bold flex-shrink-0 ${isEarn ? 'text-green-500' : 'text-red-400'}`}>
                            {isEarn ? '+' : '−'}{tx.amount}⭐
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
