'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useFamily } from '@/context/FamilyContext'

const tabs = [
  { href: '/parent', label: 'Home', icon: '🏠', exact: true },
  { href: '/parent/kids', label: 'Kids', icon: '👦' },
  { href: '/parent/actions', label: 'Actions', icon: '✅' },
  { href: '/parent/approvals', label: 'Approvals', icon: '🎁' },
  { href: '/parent/more', label: 'More', icon: '☰' },
]

export function ParentNav() {
  const pathname = usePathname()
  const { getPendingCount } = useFamily()
  const pending = getPendingCount()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-amber-100 flex z-40">
      {tabs.map(tab => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
        const showBadge = tab.href === '/parent/approvals' && pending > 0
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors relative ${
              active ? 'text-amber-600' : 'text-amber-400 hover:text-amber-500'
            }`}
          >
            <span className="text-xl relative">
              {tab.icon}
              {showBadge && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                  {pending}
                </span>
              )}
            </span>
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
