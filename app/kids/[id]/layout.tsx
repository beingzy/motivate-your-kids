'use client'

import React from 'react'
import { useFamily } from '@/context/FamilyContext'
import { KidNav } from '@/components/KidNav'

export default function KidLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  const { id } = params
  const { store } = useFamily()
  const kid = store.kids.find(k => k.id === id)

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: kid ? `${kid.colorAccent}15` : '#fef9f0' }}>
      {children}
      <KidNav kidId={id} colorAccent={kid?.colorAccent} />
    </div>
  )
}
