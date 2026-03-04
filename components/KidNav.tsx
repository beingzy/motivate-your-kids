'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface KidNavProps {
  kidId: string
  colorAccent?: string
}

export function KidNav({ kidId, colorAccent }: KidNavProps) {
  const pathname = usePathname()
  const base = `/kids/${kidId}`

  const tabs = [
    { href: base, label: 'My Stars', icon: '⭐', exact: true },
    { href: `${base}/badges`, label: 'Badges', icon: '🏅' },
    { href: `${base}/rewards`, label: 'Rewards', icon: '🎁' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-line shadow-nav flex z-40" style={{ height: 64 }}>
      {tabs.map(tab => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-bold transition-colors"
            style={{ color: active ? (colorAccent ?? '#E8612D') : '#94A3B8' }}
          >
            <span className="text-2xl">{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
