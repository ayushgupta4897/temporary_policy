import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { UI_CONFIG } from '@/config'
import Script from 'next/script'
import './globals.css'

// Load Inter font with optimal settings
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: `${UI_CONFIG.APP_NAME} | ${UI_CONFIG.APP_SUBTITLE} | Strategy&`,
  description: `${UI_CONFIG.TAGLINE} - Advanced AI-powered policy intelligence platform for strategic decision-making and sustainable transformation.`,
  icons: {
    icon: '/ampersand-icon.svg',
  },
  keywords: ['policy intelligence', 'strategic consulting', 'ideation center', 'strategy&', 'pwc', 'AI policy analysis', 'sustainable transformation'],
  authors: [{ name: 'Strategy& Ideation Center' }],
  openGraph: {
    title: `${UI_CONFIG.APP_NAME} | ${UI_CONFIG.APP_SUBTITLE}`,
    description: UI_CONFIG.TAGLINE,
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Only load New Relic in production
  const isProduction = process.env.NODE_ENV === 'production'

  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* New Relic Browser Agent - Only in Production */}
        {isProduction && (
          <>
            <Script
              id="newrelic-browser-agent"
              strategy="beforeInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.NREUM||(NREUM={});NREUM.init={
                    distributed_tracing:{enabled:true},
                    privacy:{cookies_enabled:true},
                    ajax:{deny_list:["bam.nr-data.net"]}
                  };
                  window.NREUM.loader_config={
                    accountID:"4736871",
                    trustKey:"4736871",
                    agentID:"policy-intelligence-frontend",
                    licenseKey:"NRJS-186d881697b43200d0c7d18030a9708fFFFFNRAL",
                    applicationID:"policy-intelligence-frontend"
                  };
                `,
              }}
            />
            <Script
              src="https://js-agent.newrelic.com/nr-loader-spa-current.min.js"
              strategy="beforeInteractive"
            />
          </>
        )}
      </head>
      <body className="antialiased">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
