import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Motivate Your Kids — Documentation',
  description: 'Guides, setup instructions, and reference documentation for the Motivate Your Kids app.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '0 auto', padding: '2rem' }}>
        {children}
      </body>
    </html>
  )
}
