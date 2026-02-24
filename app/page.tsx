'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFamily } from '@/context/FamilyContext'

export default function Home() {
  const { store } = useFamily()
  const router = useRouter()

  useEffect(() => {
    if (!store.family) {
      router.replace('/setup')
    }
  }, [store.family, router])

  if (!store.family) return null

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-6 bg-amber-50">
      <div className="text-center">
        <div className="text-6xl mb-3">⭐</div>
        <h1 className="text-3xl font-bold text-amber-900">{store.family.name}</h1>
        <p className="text-amber-700 mt-1">Who&apos;s using the app?</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => router.push('/parent')}
          className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg shadow-md transition-colors"
        >
          👨‍👩‍👧 I&apos;m a Parent
        </button>

        {store.kids.length > 0 && (
          <>
            <div className="text-center text-amber-600 font-medium text-sm">— or pick a kid —</div>
            {store.kids.map(kid => (
              <button
                key={kid.id}
                onClick={() => router.push(`/kids/${kid.id}`)}
                className="w-full py-4 px-6 rounded-2xl bg-white hover:bg-amber-100 border-2 font-bold text-lg shadow-sm transition-colors flex items-center gap-3"
                style={{ borderColor: kid.colorAccent }}
              >
                <span className="text-3xl">{kid.avatar}</span>
                <span className="text-amber-900">{kid.name}</span>
              </button>
            ))}
          </>
        )}
      </div>
    </main>
  )
}
