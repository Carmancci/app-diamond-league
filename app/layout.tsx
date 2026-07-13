import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { SiteHeader } from '@/components/site-header'
import { BottomNav } from '@/components/bottom-nav'
import { ThemeProvider } from '@/components/theme-provider'
import { AthleteQuickView } from '@/components/athlete-quick-view'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'Diamond League 2026 — Resultados & Estatísticas',
  description:
    'Todos os resultados, calendário e estatísticas da Wanda Diamond League 2026. Cada etapa com modalidades por gênero, marcas dos atletas e cronômetro para as próximas provas.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#141824' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`bg-background ${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-background font-sans antialiased pb-16 md:pb-0">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <SiteHeader />
          {children}
          <AthleteQuickView />
          <BottomNav />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </ThemeProvider>
      </body>
    </html>
  )
}
