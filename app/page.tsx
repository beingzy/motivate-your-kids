'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFamily } from '@/context/FamilyContext'

export default function Home() {
  const { store, hydrated } = useFamily()
  const router = useRouter()

  useEffect(() => {
    if (hydrated && !store.family) router.replace('/setup')
  }, [hydrated, store.family, router])

  // Wait for localStorage hydration before deciding what to render.
  // Without this, returning users see a blank flash before family data loads.
  if (!hydrated) return null
  if (!store.family) return null

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <div className="text-6xl mb-3">⭐</div>
        <h1 className="text-3xl font-bold text-ink-primary">{store.family.name}</h1>
        <p className="text-ink-secondary mt-1">Who&apos;s using the app?</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => router.push('/parent')}
          className="w-full py-4 px-6 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold text-lg shadow-brand transition-colors"
        >
          👨‍👩‍👧 I&apos;m a Parent
        </button>

        {store.kids.length > 0 && (
          <>
            <div className="text-center text-ink-secondary font-medium text-sm">— or pick a kid —</div>
            {store.kids.map(kid => (
              <button
                key={kid.id}
                onClick={() => router.push(`/kids/${kid.id}`)}
                className="w-full py-4 px-6 rounded-2xl bg-white hover:bg-brand-light border-2 font-bold text-lg shadow-card transition-colors flex items-center gap-3"
                style={{ borderColor: kid.colorAccent }}
              >
                <span className="text-3xl">{kid.avatar}</span>
                <span className="text-ink-primary">{kid.name}</span>
              </button>
            ))}
          </>
        )}
      </div>
    </main>
  )
}
