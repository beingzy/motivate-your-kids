'use client'

import { useState } from 'react'
import { useFamily } from '@/context/FamilyContext'

export function LogActionFab() {
  const { store, logCompletion } = useFamily()
  const [open, setOpen] = useState(false)
  const [kidId, setKidId] = useState('')
  const [actionId, setActionId] = useState('')

  const activeKids = store.kids
  const activeActions = store.actions.filter(a => a.isActive)

  function handleSubmit() {
    if (!kidId || !actionId) return
    logCompletion(kidId, actionId)
    setKidId('')
    setActionId('')
    setOpen(false)
  }

  return (
    <>
      {/* FAB button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-2xl shadow-lg flex items-center justify-center z-50 transition-colors"
        aria-label="Log action completion"
      >
        ＋
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setOpen(false)}>
          <div
            className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-amber-900">Log a completion</h2>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-amber-700">Kid</label>
              <select
                value={kidId}
                onChange={e => setKidId(e.target.value)}
                className="rounded-xl border-2 border-amber-200 px-3 py-2 text-amber-900 bg-white outline-none focus:border-amber-400"
              >
                <option value="">Pick a kid…</option>
                {activeKids.map(k => (
                  <option key={k.id} value={k.id}>
                    {k.avatar} {k.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-amber-700">Action completed</label>
              <select
                value={actionId}
                onChange={e => setActionId(e.target.value)}
                className="rounded-xl border-2 border-amber-200 px-3 py-2 text-amber-900 bg-white outline-none focus:border-amber-400"
              >
                <option value="">Pick an action…</option>
                {activeActions.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} (+{a.pointsValue}⭐)
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!kidId || !actionId}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold text-base transition-colors"
            >
              Award points ⭐
            </button>
          </div>
        </div>
      )}
    </>
  )
}
