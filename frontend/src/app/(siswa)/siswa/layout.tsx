'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import RoleGuard from '@/components/shared/RoleGuard'

export default function SiswaLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <RoleGuard allowedRoles={['siswa']}>
      {(user) => (
        <div className="min-h-screen bg-slate-50">
          <Sidebar
            role="siswa"
            fallbackName={user.email}
            mobileOpen={mobileSidebarOpen}
            onMobileClose={() => setMobileSidebarOpen(false)}
          />

          {/* Mobile top bar — visible only on < lg */}
          <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 shadow-sm">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
              aria-label="Buka menu"
            >
              <Menu size={22} />
            </button>
            <Link href="/siswa/dashboard" className="absolute left-1/2 -translate-x-1/2">
              <div className="w-28 h-8 relative">
                <Image src="/logo.png" alt="Triton Denpasar" fill priority className="object-contain" />
              </div>
            </Link>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm">
              {user.email.charAt(0).toUpperCase()}
            </div>
          </header>

          <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
            {children}
          </main>
        </div>
      )}
    </RoleGuard>
  )
}
