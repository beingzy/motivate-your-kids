'use client'

import { usePathname } from 'next/navigation'
import { ParentNav } from '@/components/ParentNav'
import { LogActionFab } from '@/components/LogActionFab'

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Hide the global FAB when on a kid detail page — it already has an inline action list
  const hideFab = /^\/parent\/kids\/[^/]+$/.test(pathname)

  return (
    <div className="min-h-screen bg-amber-50 pb-20">
      {children}
      {!hideFab && <LogActionFab />}
      <ParentNav />
    </div>
  )
}
