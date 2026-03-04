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
  const { store, hydrated, getBalance, awardBonus, awardDeduction, removeTransaction, logCompletion, redeemReward, addAction } = useFamily()
  const { t } = useLocale()

  const [showGuide, setShowGuide] = useState(false)

  // Quick action sheet
  const [quickType, setQuickType] = useState<QuickType | null>(null)
  const [quickKidId, setQuickKidId] = useState<string | null>(null)
  const [quickActionId, setQuickActionId] = useState<string | 'custom' | null>(null)
  const [quickAmount, setQuickAmount] = useState(5)
  const [quickReason, setQuickReason] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createPoints, setCreatePoints] = useState(5)
  const [pendingSelectName, setPendingSelectName] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

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

  function openQuick(type: QuickType) {
    setQuickType(type)
    setQuickAmount(5)
    setQuickReason('')
    setQuickActionId(null)
    setShowCreateForm(false)
    setCreateName('')
    setCreatePoints(5)
    setQuickKidId(store.kids.length === 1 ? store.kids[0].id : null)
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
    if (!quickKidId || !quickType) return
    const kidName = store.kids.find(k => k.id === quickKidId)?.name ?? ''

    if (quickType === 'redeem') return // handled inline

    if (!quickActionId) return

    if (quickActionId === 'custom') {
      if (quickType === 'earn') {
        awardBonus(quickKidId, quickAmount, quickReason.trim() || 'Bonus stars')
        showFlash(`+${quickAmount}⭐ for ${kidName}! ${randomEarnPhrase()}`)
        fireStarConfetti()
      } else {
        awardDeduction(quickKidId, quickAmount, quickReason.trim() || undefined)
        showFlash(`−${quickAmount}⭐ for ${kidName}. ${randomDeductPhrase()}`)
      }
    } else {
      logCompletion(quickKidId, quickActionId, quickAmount)
      if (quickType === 'earn') {
        showFlash(`+${quickAmount}⭐ for ${kidName}! ${randomEarnPhrase()}`)
        fireStarConfetti()
      } else {
        showFlash(`−${quickAmount}⭐ for ${kidName}. ${randomDeductPhrase()}`)
      }
    }
    setQuickType(null)
  }

  function handleRedeemTap(rewardId: string) {
    if (!quickKidId) return
    const reward = store.rewards.find(r => r.id === rewardId)
    if (!reward) return
    if (getBalance(quickKidId) < reward.pointsCost) return
    redeemReward(quickKidId, rewardId)
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

  // Filtered action lists for the picker
  const earnActions = store.actions.filter(a => a.isActive && !a.isDeduction)
  const deductActions = store.actions.filter(a => a.isActive && a.isDeduction)
  const activeRewards = store.rewards.filter(r => r.isActive !== false)

  const isEarnOrDeduct = quickType === 'earn' || quickType === 'deduct'
  const relevantActions = quickType === 'earn' ? earnActions : deductActions
  const confirmDisabled = !quickKidId || !quickActionId

  const kidBalance = quickKidId ? getBalance(quickKidId) : 0

  return (
    <main className="max-w-lg mx-auto">
      {/* Flash toast */}
      {flash && (
        <div className="fixed top-6 left-1/2 z-50 bg-brand text-white font-bold rounded-2xl px-5 py-3 shadow-lg text-sm whitespace-nowrap animate-slide-down">
          {flash}
        </div>
      )}

      {/* Undo delete toast */}
      {pendingDeleteId && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg whitespace-nowrap">
          <span className="text-sm">{t('home.tx-deleted')}</span>
          <button onClick={handleUndoDelete} className="text-ink-muted font-bold text-sm underline">
            {t('undo')}
          </button>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-5 pb-3">
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
          {/* ── Kid balance chips ── */}
          <div className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar">
            {store.kids.map(kid => {
              const bal = getBalance(kid.id)
              return (
                <div
                  key={kid.id}
                  className="flex-shrink-0 bg-white rounded-xl px-3 py-2 flex items-center gap-2 shadow-card border-t-2"
                  style={{ borderColor: kid.colorAccent }}
                >
                  <span className="text-lg leading-none">{kid.avatar}</span>
                  <div>
                    <p className="text-xs font-bold text-ink-primary leading-none">{kid.name}</p>
                    <p className="text-xs text-brand mt-0.5">{bal} ⭐</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Quick action buttons ── */}
          <div className="flex gap-2 px-4 mb-4">
            <button
              onClick={() => openQuick('earn')}
              className="flex-1 py-3 rounded-2xl bg-brand text-white font-bold text-sm hover:bg-brand-hover transition-colors shadow-card"
            >
              {t('home.add-stars')}
            </button>
            <button
              onClick={() => openQuick('deduct')}
              className="flex-1 py-3 rounded-2xl bg-red-50 text-red-500 font-bold text-sm hover:bg-red-100 transition-colors shadow-card border border-red-200"
            >
              {t('home.deduct-stars')}
            </button>
            <button
              onClick={() => openQuick('redeem')}
              className="flex-1 py-3 rounded-2xl bg-emerald-50 text-emerald-600 font-bold text-sm hover:bg-emerald-100 transition-colors shadow-card border border-emerald-200"
            >
              {t('home.redeem')}
            </button>
          </div>

          {/* ── Getting started guide ── */}
          {showGuide && (
            <div className="px-4">
              <GettingStarted store={store} onDismiss={handleDismissGuide} />
            </div>
          )}

          {/* ── Activity feed ── */}
          <div className="px-4 pb-6">
            {displayedTxs.length === 0 ? (
              <div className="text-center py-16">
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

      {/* ── Quick action bottom sheet ── */}
      {quickType && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setQuickType(null)}>
          <div
            className="bg-white w-full rounded-t-3xl p-5 flex flex-col gap-3 max-w-lg mx-auto max-h-[88vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet header */}
            <div className={`text-center py-2 rounded-2xl ${
              quickType === 'earn' ? 'bg-page' :
              quickType === 'deduct' ? 'bg-red-50' : 'bg-emerald-50'
            }`}>
              <h2 className={`text-xl font-bold ${
                quickType === 'earn' ? 'text-ink-primary' :
                quickType === 'deduct' ? 'text-red-800' : 'text-emerald-800'
              }`}>
                {t(quickType === 'earn' ? 'quick.award-stars' : quickType === 'deduct' ? 'quick.deduct-stars' : 'quick.redeem-reward')}
              </h2>
            </div>

            {/* Kid picker — multiple kids */}
            {store.kids.length > 1 && (
              <div>
                <p className="text-xs font-semibold text-brand uppercase tracking-wide mb-2 text-center">{t('quick.for-kid')}</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  {store.kids.map(kid => {
                    const bal = getBalance(kid.id)
                    const chosen = kid.id === quickKidId
                    return (
                      <button
                        key={kid.id}
                        onClick={() => setQuickKidId(kid.id)}
                        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl border-2 transition-all ${
                          chosen ? 'border-brand bg-page' : 'border-line-subtle hover:border-line'
                        }`}
                      >
                        <span className="text-2xl">{kid.avatar}</span>
                        <span className="text-xs font-bold text-ink-primary">{kid.name}</span>
                        <span className="text-xs text-ink-muted">{bal}⭐</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Single kid display */}
            {store.kids.length === 1 && (
              <div className="flex items-center justify-center gap-2 bg-page rounded-2xl py-2.5">
                <span className="text-2xl">{store.kids[0].avatar}</span>
                <span className="font-bold text-ink-primary">{store.kids[0].name}</span>
              </div>
            )}

            {/* ── EARN / DEDUCT: action picker ── */}
            {isEarnOrDeduct && (
              <>
                <p className="text-xs font-semibold text-brand uppercase tracking-wide">{t('quick.select-action')}</p>

                <div className="flex flex-col gap-1.5">
                  {relevantActions.length === 0 && (
                    <p className="text-ink-muted text-sm text-center py-2">{t('quick.no-actions')}</p>
                  )}
                  {relevantActions.map(action => {
                    const icon = store.categories.find(c => c.id === action.categoryId)?.icon ?? (action.isDeduction ? '⚠️' : '⭐')
                    const chosen = quickActionId === action.id
                    return (
                      <button
                        key={action.id}
                        onClick={() => handleSelectAction(action.id)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${
                          chosen
                            ? (quickType === 'earn' ? 'border-brand bg-page' : 'border-red-400 bg-red-50')
                            : 'border-line-subtle hover:border-line'
                        }`}
                      >
                        <span className="text-xl flex-shrink-0">{icon}</span>
                        <span className="flex-1 text-sm font-medium text-ink-primary">{action.name}</span>
                        <span className={`text-sm font-bold flex-shrink-0 ${quickType === 'earn' ? 'text-brand' : 'text-red-500'}`}>
                          {quickType === 'earn' ? '+' : '−'}{action.pointsValue}⭐
                        </span>
                        {chosen && <span className="text-brand font-bold flex-shrink-0">✓</span>}
                      </button>
                    )
                  })}

                  {/* Custom amount option */}
                  <button
                    onClick={() => { setQuickActionId('custom'); setQuickAmount(5); setQuickReason('') }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${
                      quickActionId === 'custom'
                        ? 'border-brand bg-page'
                        : 'border-line-subtle hover:border-line'
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">✏️</span>
                    <span className="flex-1 text-sm font-medium text-ink-secondary">{t('quick.custom')}</span>
                    {quickActionId === 'custom' && <span className="text-brand font-bold flex-shrink-0">✓</span>}
                  </button>
                </div>

                {/* Amount adjuster (shown when action or custom is selected) */}
                {quickActionId && (
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <p className="text-xs text-ink-muted font-medium">
                      {t(quickType === 'earn' ? 'quick.stars-to-award' : 'quick.stars-to-deduct')}
                    </p>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setQuickAmount(v => Math.max(1, v - 1))}
                        className="w-10 h-10 rounded-full bg-brand-light hover:bg-brand-light text-ink-secondary font-black text-xl transition-colors flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className={`text-4xl font-black w-14 text-center ${quickType === 'earn' ? 'text-ink-primary' : 'text-red-600'}`}>
                        {quickAmount}
                      </span>
                      <button
                        onClick={() => setQuickAmount(v => v + 1)}
                        className="w-10 h-10 rounded-full bg-brand-light hover:bg-brand-light text-ink-secondary font-black text-xl transition-colors flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Reason (custom only) */}
                {quickActionId === 'custom' && (
                  <input
                    placeholder={t('quick.reason')}
                    value={quickReason}
                    onChange={e => setQuickReason(e.target.value)}
                    autoComplete="off"
                    autoCorrect="off"
                    className="w-full rounded-xl border-2 border-line px-3 py-2 text-ink-primary outline-none focus:border-brand text-sm"
                  />
                )}

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
                      <button
                        onClick={() => setShowCreateForm(false)}
                        className="text-ink-muted text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirm button */}
                <button
                  onClick={handleQuickConfirm}
                  disabled={confirmDisabled}
                  className={`w-full py-3 rounded-2xl disabled:opacity-40 text-white font-bold text-base transition-colors ${
                    quickType === 'earn' ? 'bg-brand hover:bg-brand-hover' : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {quickType === 'earn'
                    ? `+${quickAmount} ⭐`
                    : `−${quickAmount} ⭐`}
                </button>
              </>
            )}

            {/* ── REDEEM: reward picker ── */}
            {quickType === 'redeem' && (
              <>
                <p className="text-xs font-semibold text-brand uppercase tracking-wide">{t('quick.choose-reward')}</p>

                {activeRewards.length === 0 ? (
                  <p className="text-ink-muted text-sm text-center py-4">{t('quick.no-rewards')}</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {activeRewards.map(reward => {
                      const canAfford = quickKidId ? kidBalance >= reward.pointsCost : false
                      const needMore = reward.pointsCost - kidBalance
                      return (
                        <div
                          key={reward.id}
                          className={`flex items-center gap-3 px-3 py-3 rounded-xl border-2 ${
                            canAfford ? 'border-emerald-200 bg-emerald-50' : 'border-line-subtle bg-white opacity-70'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-ink-primary truncate">{reward.name}</p>
                            <p className="text-xs text-brand">{reward.pointsCost}⭐</p>
                          </div>
                          {canAfford ? (
                            <button
                              onClick={() => handleRedeemTap(reward.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors flex-shrink-0"
                            >
                              Redeem ✓
                            </button>
                          ) : (
                            <span className="text-xs text-ink-muted flex-shrink-0">
                              {quickKidId
                                ? t('quick.need-more', { n: needMore })
                                : t('quick.select-kid-first')}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            <button onClick={() => setQuickType(null)} className="text-center text-ink-muted text-sm py-1">
              {t('cancel')}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
