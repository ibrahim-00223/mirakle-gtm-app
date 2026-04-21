import type { Metadata } from 'next'
import { Roboto_Serif } from 'next/font/google'
import './globals.css'
import { AppShell } from '@/components/layout/AppShell'
import { QueryProvider } from '@/components/providers/QueryProvider'

const robotoSerif = Roboto_Serif({
  subsets: ['latin'],
  variable: '--font-roboto-serif',
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
    <html lang="fr" className={`${robotoSerif.variable} h-full`}>
      <body className="min-h-full bg-[#F2F8FF] text-[#03182F] font-sans antialiased">
        <QueryProvider>
          <AppShell>{children}</AppShell>
        </QueryProvider>
      </body>
    </html>
  )
}
