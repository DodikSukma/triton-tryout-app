import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
})

// Inter is scoped to the marketing landing page via the `font-inter` utility.
// It is exposed as a CSS variable only — the app default stays Plus Jakarta Sans.
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Triton Denpasar — Online Tryout',
  description: 'Platform tryout online untuk siswa Triton Denpasar',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} ${inter.variable}`}>
      <head>
        {/* FontAwesome icon set (used across the marketing landing page) */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body className={`${plusJakartaSans.className} bg-slate-50 text-slate-800`}>
        {children}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          duration={3500}
          toastOptions={{
            className: 'rounded-xl border-slate-200 shadow-lg',
            style: { fontFamily: 'var(--font-jakarta), sans-serif' },
          }}
        />
      </body>
    </html>
  )
}
