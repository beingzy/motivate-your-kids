'use client'

import { useMemo } from 'react'
import type { Transaction, Kid } from '@/types'

interface DailyPointsChartProps {
  transactions: Transaction[]
  kids: Kid[]
  days?: number
}

function formatDay(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[date.getDay()]
}

function formatDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

interface DayData {
  date: Date
  earned: number
  deducted: number
  net: number
}

export function DailyPointsChart({ transactions, kids, days = 7 }: DailyPointsChartProps) {
  const chartData = useMemo(() => {
    const now = new Date()
    const data: DayData[] = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      let earned = 0
      let deducted = 0

      transactions.forEach(tx => {
        if (tx.status !== 'approved') return
        const txDate = new Date(tx.timestamp)
        if (txDate >= date && txDate < nextDate) {
          if (tx.type === 'earn') earned += tx.amount
          else if (tx.type === 'deduct') deducted += tx.amount
          else if (tx.type === 'redeem') deducted += tx.amount
        }
      })

      data.push({ date, earned, deducted, net: earned - deducted })
    }

    return data
  }, [transactions, days])

  const maxVal = useMemo(() => {
    let max = 1
    chartData.forEach(d => {
      if (d.earned > max) max = d.earned
      if (d.deducted > max) max = d.deducted
    })
    return max
  }, [chartData])

  const totalEarned = chartData.reduce((s, d) => s + d.earned, 0)
  const totalDeducted = chartData.reduce((s, d) => s + d.deducted, 0)

  if (kids.length === 0) return null

  return (
    <div className="bg-white rounded-2xl shadow-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-ink-primary">Daily Stars (Last {days} days)</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-green-400" /> Earned
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-300" /> Deducted
          </span>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1.5" style={{ height: 120 }}>
        {chartData.map((day, i) => {
          const earnHeight = maxVal > 0 ? (day.earned / maxVal) * 100 : 0
          const deductHeight = maxVal > 0 ? (day.deducted / maxVal) * 100 : 0
          const isToday = i === chartData.length - 1

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
              {/* Bars */}
              <div className="w-full flex gap-0.5 items-end flex-1">
                {/* Earn bar */}
                <div
                  className={`flex-1 rounded-t-md transition-all ${isToday ? 'bg-green-500' : 'bg-green-300'}`}
                  style={{ height: `${earnHeight}%`, minHeight: day.earned > 0 ? 4 : 0 }}
                  title={`+${day.earned}`}
                />
                {/* Deduct bar */}
                <div
                  className={`flex-1 rounded-t-md transition-all ${isToday ? 'bg-red-400' : 'bg-red-200'}`}
                  style={{ height: `${deductHeight}%`, minHeight: day.deducted > 0 ? 4 : 0 }}
                  title={`-${day.deducted}`}
                />
              </div>
              {/* Label */}
              <div className="text-center">
                <p className={`text-[9px] font-bold ${isToday ? 'text-brand' : 'text-ink-muted'}`}>
                  {isToday ? 'Today' : formatDay(day.date)}
                </p>
                <p className="text-[8px] text-ink-muted">{formatDate(day.date)}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-line-subtle">
        <div className="text-center flex-1">
          <p className="text-xs text-ink-muted">Earned</p>
          <p className="text-sm font-bold text-green-600">+{totalEarned} ⭐</p>
        </div>
        <div className="w-px h-8 bg-line-subtle" />
        <div className="text-center flex-1">
          <p className="text-xs text-ink-muted">Deducted</p>
          <p className="text-sm font-bold text-red-400">-{totalDeducted} ⭐</p>
        </div>
        <div className="w-px h-8 bg-line-subtle" />
        <div className="text-center flex-1">
          <p className="text-xs text-ink-muted">Net</p>
          <p className={`text-sm font-bold ${totalEarned - totalDeducted >= 0 ? 'text-green-600' : 'text-red-400'}`}>
            {totalEarned - totalDeducted >= 0 ? '+' : ''}{totalEarned - totalDeducted} ⭐
          </p>
        </div>
      </div>
    </div>
  )
}
