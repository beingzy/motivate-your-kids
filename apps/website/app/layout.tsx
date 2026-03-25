import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Motivate Your Kids — Fun Rewards for Great Behavior',
  description:
    'A family rewards app that helps parents motivate kids through points, badges, and custom rewards. Free, simple, and fun.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
