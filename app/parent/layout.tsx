import { ParentNav } from '@/components/ParentNav'
import { LogActionFab } from '@/components/LogActionFab'

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-amber-50 pb-20">
      {children}
      <LogActionFab />
      <ParentNav />
    </div>
  )
}
