import type { Metadata } from 'next'
import { Inter, Montserrat } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'

import './globals.css'
import { ThemeProvider } from '@/components/theme'
import ReactQueryProvider from '@/react-query'
import { ReduxProvider } from '@/redux/provider'
import { Toaster } from 'sonner'
import { MainNav } from '@/components/navigation/main-nav'
import ErrorBoundary from '@/components/global/error-boundary'
import { DatabaseProvider } from '@/components/global/database-provider'

// Load Montserrat for headings - a good alternative to Gilroy
const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

// Load Inter for body text - highly readable
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AetherLMS - Online Learning Platform',
  description: 'Learn through AI-powered video courses and interactive content on AetherLMS.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.variable} ${montserrat.variable} font-sans bg-background`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            disableTransitionOnChange
          >
            <ReduxProvider>
              <ReactQueryProvider>
                <ErrorBoundary>
                  <DatabaseProvider>
                    <div className="min-h-screen flex flex-col">
                      <MainNav />
                      <main className="flex-1">{children}</main>
                    </div>
                    <Toaster />
                  </DatabaseProvider>
                </ErrorBoundary>
              </ReactQueryProvider>
            </ReduxProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
