
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthSessionProvider } from '@/components/providers/session-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { PWAProvider } from '@/components/pwa/PWAProvider'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import { MusicPlayerProvider } from '@/contexts/MusicPlayerContext'
import { PersonalLibraryProvider } from '@/contexts/PersonalLibraryContext'
import { WalletProvider } from '@/contexts/WalletContext'
import { MiniPlayer } from '@/components/player/MiniPlayer'
import { FullPlayer } from '@/components/player/FullPlayer'
import { MediaSessionHandler } from '@/components/media-session/MediaSessionHandler'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Shellff - Decentralized Music Streaming',
  description: 'The next generation of music streaming with Web2/Web3 integration',
  keywords: ['music streaming', 'decentralized', 'Web3', 'blockchain', 'audio', 'shellff'],
  authors: [{ name: 'Shellff Team' }],
  creator: 'Shellff',
  publisher: 'Shellff',
  applicationName: 'Shellff',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://shellff.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://shellff.com',
    title: 'Shellff - Decentralized Music Streaming',
    description: 'The next generation of music streaming with Web2/Web3 integration',
    siteName: 'Shellff',
    images: [
      {
        url: 'https://cdn.abacus.ai/images/53926280-0557-4f66-987f-150753d0d6cf.png',
        width: 512,
        height: 512,
        alt: 'Shellff - Decentralized Music Streaming',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Shellff - Decentralized Music Streaming',
    description: 'The next generation of music streaming with Web2/Web3 integration',
    images: ['https://cdn.abacus.ai/images/53926280-0557-4f66-987f-150753d0d6cf.png'],
  },
  appleWebApp: {
    capable: true,
    title: 'Shellff',
    statusBarStyle: 'black-translucent',
    startupImage: [
      {
        url: 'https://cdn.abacus.ai/images/53926280-0557-4f66-987f-150753d0d6cf.png',
        media: '(orientation: portrait)',
      },
    ],
  },
  manifest: '/manifest.json',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Shellff',
    'msapplication-TileColor': '#9B5DE5',
    'msapplication-config': '/browserconfig.xml',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#9B5DE5',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="https://cdn.abacus.ai/images/bda0d262-5d1a-4a75-a8ab-bf949dace0b8.png" />
        <link rel="mask-icon" href="https://cdn.abacus.ai/images/53926280-0557-4f66-987f-150753d0d6cf.png" color="#9B5DE5" />
        
        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="//cdn.abacus.ai" />
        <link rel="preconnect" href="https://cdn.abacus.ai" crossOrigin="anonymous" />
        
        {/* Additional PWA optimizations */}
        <meta name="theme-color" content="#9B5DE5" />
        <meta name="background-color" content="#121212" />
        <meta name="display" content="standalone" />
        <meta name="orientation" content="portrait" />
        
        {/* Performance hints */}
        <link rel="prefetch" href="/auth/login" />
        <link rel="prefetch" href="/auth/register" />
        <link rel="prefetch" href="/dashboard" />
      </head>
      <body className={inter.className}>
        <PWAProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthSessionProvider>
              <MusicPlayerProvider>
                <PersonalLibraryProvider>
                  <WalletProvider>
                    {children}
                    <MiniPlayer />
                    <FullPlayer />
                    <MediaSessionHandler />
                    <InstallPrompt />
                    <Toaster />
                  </WalletProvider>
                </PersonalLibraryProvider>
              </MusicPlayerProvider>
            </AuthSessionProvider>
          </ThemeProvider>
        </PWAProvider>
      </body>
    </html>
  )
}
