import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'PingHook - Webhook Inspector & Cron Monitor',
    template: '%s | PingHook',
  },
  description: 'Debug webhooks and monitor cron jobs with real-time logs and instant alerts.',
  keywords: ['webhook', 'cron', 'monitor', 'developer tools', 'api', 'testing', 'debugging'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
