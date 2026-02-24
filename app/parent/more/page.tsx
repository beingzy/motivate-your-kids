'use client'

import { useRouter } from 'next/navigation'
import { useFamily } from '@/context/FamilyContext'

export default function MorePage() {
  const router = useRouter()
  const { store } = useFamily()

  return (
    <main className="p-5 max-w-lg mx-auto">
      <header className="mb-6 pt-4">
        <h1 className="text-2xl font-bold text-amber-900">More</h1>
        {store.family && <p className="text-amber-600 text-sm">{store.family.name}</p>}
      </header>

      <div className="flex flex-col gap-3">
        {[
          { label: '🏅 Manage Badges', href: '/parent/badges' },
          { label: '⚙️ Family Settings', href: '/parent/settings' },
          { label: '🔀 Switch User', href: '/' },
        ].map(item => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className="w-full bg-white rounded-2xl p-4 text-left font-medium text-amber-900 shadow-sm hover:bg-amber-50 transition-colors flex items-center justify-between"
          >
            {item.label}
            <span className="text-amber-400">→</span>
          </button>
        ))}
      </div>
    </main>
  )
}
