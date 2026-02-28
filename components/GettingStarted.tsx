'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { AppStore } from '@/types'
import { fireStarConfetti } from '@/lib/confetti'

interface Step {
  label: string
  hint: string
  href: string | null
  linkLabel: string | null
  done: boolean
}

interface Props {
  store: AppStore
  onDismiss: () => void
}

export function GettingStarted({ store, onDismiss }: Props) {
  const router = useRouter()

  const hasKid = store.kids.length > 0
  const hasLoggedAction = store.transactions.some(t => t.type === 'earn')
  const hasRedeemedReward = store.transactions.some(t => t.type === 'redeem')

  const steps: Step[] = [
    {
      label: 'Create your family',
      hint: 'Your family is set up and ready to go.',
      href: null,
      linkLabel: null,
      done: true,
    },
    {
      label: 'Add a kid',
      hint: 'Go to More → Manage Kids to add your first child.',
      href: '/parent/more',
      linkLabel: 'Manage Kids →',
      done: hasKid,
    },
    {
      label: 'Log an action and earn stars',
      hint: 'Go to Actions, tap ▶ next to any action, pick a kid, and award stars.',
      href: '/parent/actions',
      linkLabel: 'Go to Actions →',
      done: hasLoggedAction,
    },
    {
      label: 'Redeem a reward',
      hint: 'Go to Rewards, set up a reward, then tap "Redeem for a kid" when they have enough stars.',
      href: '/parent/rewards',
      linkLabel: 'Go to Rewards →',
      done: hasRedeemedReward,
    },
  ]

  const allDone = steps.every(s => s.done)
  const doneCount = steps.filter(s => s.done).length

  // Auto-dismiss + confetti when all steps complete
  useEffect(() => {
    if (allDone) {
      fireStarConfetti()
      const timer = setTimeout(onDismiss, 2500)
      return () => clearTimeout(timer)
    }
  }, [allDone, onDismiss])

  return (
    <div className="bg-white rounded-2xl shadow-sm border-l-4 border-amber-400 px-4 py-3 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{allDone ? '🎉' : '🚀'}</span>
          <p className="text-sm font-bold text-amber-900">
            {allDone ? 'You\'re all set!' : 'Getting Started'}
          </p>
          {!allDone && (
            <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">
              {doneCount}/{steps.length}
            </span>
          )}
        </div>
        {!allDone && (
          <button
            onClick={onDismiss}
            className="text-amber-400 hover:text-amber-600 text-xs font-medium transition-colors"
          >
            Got it
          </button>
        )}
      </div>

      {allDone ? (
        <p className="text-xs text-amber-600">
          You know how the star reward system works. Keep it up!
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className={`text-sm mt-0.5 flex-shrink-0 ${step.done ? 'text-green-500' : 'text-amber-300'}`}>
                {step.done ? '✅' : '○'}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold leading-snug ${step.done ? 'text-amber-400 line-through' : 'text-amber-900'}`}>
                  {step.label}
                </p>
                {!step.done && (
                  <p className="text-[11px] text-amber-500 mt-0.5 leading-snug">{step.hint}</p>
                )}
              </div>
              {!step.done && step.href && (
                <button
                  onClick={() => router.push(step.href!)}
                  className="text-[11px] text-amber-500 hover:text-amber-700 font-medium whitespace-nowrap flex-shrink-0 underline"
                >
                  {step.linkLabel}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
