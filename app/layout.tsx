import type { Metadata, Viewport } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'
import { FamilyProvider } from '@/context/FamilyContext'
import { LocaleProvider } from '@/context/LocaleContext'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import { Analytics } from '@vercel/analytics/next'

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
  themeColor: '#E8612D',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="antialiased min-h-screen">
        <LocaleProvider>
          <FamilyProvider>{children}</FamilyProvider>
        </LocaleProvider>
        <ServiceWorkerRegistration />
        <Analytics />
      </body>
    </html>
  )
}
