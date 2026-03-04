'use client'

import { useState } from 'react'
import { useFamily } from '@/context/FamilyContext'

export function LogActionFab() {
  const { store, logCompletion } = useFamily()
  const [open, setOpen] = useState(false)
  const [kidId, setKidId] = useState('')
  const [actionId, setActionId] = useState('')
  const [flash, setFlash] = useState<string | null>(null)

  const kids = store.kids
  const activeActions = store.actions.filter(a => a.isActive)
  const singleKid = kids.length === 1 ? kids[0] : null

  function handleOpen() {
    setKidId(singleKid ? singleKid.id : '')
    setActionId('')
    setOpen(true)
  }

  function handleSubmit() {
    const effectiveKidId = singleKid ? singleKid.id : kidId
    if (!effectiveKidId || !actionId) return
    const action = activeActions.find(a => a.id === actionId)
    const kid = kids.find(k => k.id === effectiveKidId)
    logCompletion(effectiveKidId, actionId)
    setActionId('')
    setKidId('')
    setOpen(false)
    if (action && kid) {
      setFlash(`+${action.pointsValue}⭐ for ${kid.name}!`)
      setTimeout(() => setFlash(null), 2500)
    }
  }

  return (
    <>
      {flash && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] bg-brand text-white font-bold rounded-2xl px-5 py-3 shadow-lg text-sm whitespace-nowrap pointer-events-none">
          {flash}
        </div>
      )}

      <button
        onClick={handleOpen}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-brand hover:bg-brand-hover text-white text-2xl shadow-lg flex items-center justify-center z-50 transition-colors"
        aria-label="Log action completion"
      >
        ＋
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setOpen(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-w-lg mx-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-ink-primary">Log a completion</h2>

            {/* Kid selector — only shown when multiple kids */}
            {!singleKid && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-ink-secondary">Kid</label>
                <div className="flex gap-2 flex-wrap">
                  {kids.map(k => (
                    <button
                      key={k.id}
                      onClick={() => setKidId(k.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 font-medium text-sm transition-colors ${
                        kidId === k.id
                          ? 'border-brand bg-page text-ink-primary'
                          : 'border-line text-ink-secondary hover:border-line'
                      }`}
                    >
                      <span>{k.avatar}</span>
                      <span>{k.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Single-kid header */}
            {singleKid && (
              <div className="flex items-center gap-2 bg-page rounded-xl px-3 py-2">
                <span className="text-2xl">{singleKid.avatar}</span>
                <span className="font-bold text-ink-primary">{singleKid.name}</span>
              </div>
            )}

            {/* Action list */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-ink-secondary">Action completed</label>
              <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
                {activeActions.map(a => (
                  <button
                    key={a.id}
                    onClick={() => setActionId(a.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-colors ${
                      actionId === a.id
                        ? 'border-brand bg-page'
                        : 'border-line-subtle hover:border-line'
                    }`}
                  >
                    <span className="flex-1 font-medium text-ink-primary text-sm">{a.name}</span>
                    <span className="text-brand font-bold text-sm">+{a.pointsValue}⭐</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={(!singleKid && !kidId) || !actionId}
              className="w-full py-3 rounded-2xl bg-brand hover:bg-brand-hover disabled:opacity-40 text-white font-bold text-base transition-colors"
            >
              Award stars ⭐
            </button>
          </div>
        </div>
      )}
    </>
  )
}
