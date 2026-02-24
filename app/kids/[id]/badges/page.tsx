'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFamily } from '@/context/FamilyContext'

export default function KidBadgesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { store, getKidBadges } = useFamily()

  const kid = store.kids.find(k => k.id === id)
  useEffect(() => { if (!kid) router.replace('/') }, [kid, router])
  if (!kid) return null

  const earned = getKidBadges(id)
  const earnedIds = new Set(earned.map(kb => kb.badgeId))

  return (
    <main className="p-5 max-w-sm mx-auto">
      <header className="flex items-center gap-3 pt-6 mb-8">
        <span className="text-4xl">{kid.avatar}</span>
        <h1 className="text-2xl font-bold text-amber-900">{kid.name}&apos;s Badges</h1>
      </header>

      {earned.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-3">🏅</div>
          <p className="text-amber-700 font-medium">No badges yet — keep going!</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {store.badges.filter(b => earnedIds.has(b.id)).map(badge => {
            const record = earned.find(kb => kb.badgeId === badge.id)
            return (
              <div key={badge.id} className="bg-white rounded-2xl p-4 text-center shadow-sm flex flex-col gap-1">
                <span className="text-4xl">{badge.icon}</span>
                <p className="font-bold text-amber-900 text-xs leading-tight">{badge.name}</p>
                {record && (
                  <p className="text-amber-400 text-[10px]">
                    {new Date(record.awardedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
