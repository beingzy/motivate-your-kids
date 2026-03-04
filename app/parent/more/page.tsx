'use client'

import { useRouter } from 'next/navigation'
import { useFamily } from '@/context/FamilyContext'

const ITEMS = [
  { label: '👶 Manage Kids', href: '/parent/kids' },
  { label: '🏅 Manage Badges', href: '/parent/badges' },
  { label: '📋 Activity History', href: '/parent/history' },
  { label: '⚙️ Family Settings', href: '/parent/settings' },
  { label: '🔀 Switch User', href: '/' },
]

export default function MorePage() {
  const router = useRouter()
  const { store } = useFamily()

  return (
    <main className="p-5 max-w-lg mx-auto">
      <header className="mb-6 pt-4">
        <h1 className="text-2xl font-bold text-ink-primary">More</h1>
        {store.family && <p className="text-ink-secondary text-sm">{store.family.name}</p>}
      </header>

      <div className="flex flex-col gap-3">
        {ITEMS.map(item => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className="w-full bg-white rounded-2xl p-4 text-left font-medium text-ink-primary shadow-card hover:bg-page transition-colors flex items-center justify-between"
          >
            {item.label}
            <span className="text-ink-muted">→</span>
          </button>
        ))}
      </div>
    </main>
  )
}
