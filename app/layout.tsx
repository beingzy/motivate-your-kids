import type { Metadata, Viewport } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'
import { FamilyProvider } from '@/context/FamilyContext'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  weight: ['400', '600', '700', '800', '900'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Kids Rewards',
  description: 'Motivate your kids with points and badges',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kids Rewards',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f59e0b',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="antialiased bg-amber-50 min-h-screen">
        <FamilyProvider>{children}</FamilyProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
