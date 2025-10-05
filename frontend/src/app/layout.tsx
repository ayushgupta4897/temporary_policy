import type { Metadata } from 'next'
import { UI_CONFIG } from '@/config'
import './globals.css'

export const metadata: Metadata = {
  title: `${UI_CONFIG.APP_NAME} Platform | ${UI_CONFIG.APP_SUBTITLE}`,
  description: 'Advanced AI-powered policy analysis and development platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen bg-dark-900">
          {children}
        </div>
      </body>
    </html>
  )
}
