'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MorePage() {
  const router = useRouter()
  useEffect(() => { router.replace('/parent/settings') }, [router])
  return null
}
