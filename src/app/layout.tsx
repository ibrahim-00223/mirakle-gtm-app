import type { Metadata } from 'next'
import { Manrope, DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'
import { AppShell } from '@/components/layout/AppShell'
import { QueryProvider } from '@/components/providers/QueryProvider'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Mirakl GTM — Sales Intelligence',
  description: 'Pipeline de prospection intelligente pour les équipes sales Mirakle',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fr"
      className={`${manrope.variable} ${dmSans.variable} ${dmMono.variable} h-full`}
    >
      <body className="min-h-full bg-[#0F1F3D] text-white font-body antialiased">
        <QueryProvider>
          <AppShell>{children}</AppShell>
        </QueryProvider>
      </body>
    </html>
  )
}
