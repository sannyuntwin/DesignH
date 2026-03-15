import './globals.css'
import { Inter, Space_Grotesk } from 'next/font/google'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
})

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap'
})

export const metadata = {
  title: 'DesignPro - Professional Design Editor',
  description: 'A powerful professional design editor with text and image editing capabilities',
}

import { ToastProvider } from '@/components/ui/Toast'
import { DebugClickTracker } from '@/components/DebugClickTracker'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-inter antialiased">
        <DebugClickTracker />
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
