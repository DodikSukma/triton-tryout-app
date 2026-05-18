import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
})

export const metadata: Metadata = {
  title: 'Triton Denpasar — Online Tryout',
  description: 'Platform tryout online untuk siswa Triton Denpasar',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={plusJakartaSans.variable}>
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
