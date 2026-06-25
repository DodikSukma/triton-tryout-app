import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
})

// Inter drives the marketing typography via the `font-inter` utility.
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Bimbel Triton Denpasar — Bimbingan Belajar SD, SMP, SMA Terpercaya di Bali',
  description:
    'Bimbingan belajar SD, SMP, dan SMA terpercaya di Denpasar, Bali. Metode terbukti, pengajar berpengalaman, dan platform tryout online dengan rekam jejak alumni di PTN terbaik.',
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
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body className={plusJakartaSans.className}>
        {children}
      </body>
    </html>
  )
}
