import { NextRequest, NextResponse } from 'next/server'

// TRN-10: server-side guard for the Question-Bank admin area. Only users whose
// session resolves to role 'admin-soal' may reach /admin-soal/*. The session is
// validated against the auth-service (via the gateway) using the forwarded cookie.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (!pathname.startsWith('/admin-soal')) return NextResponse.next()

  const cookie = req.headers.get('cookie') ?? ''
  try {
    const r = await fetch(`${API_URL}/auth/me`, { headers: { cookie } })
    if (!r.ok) {
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      url.search = `redirect=${encodeURIComponent(pathname)}`
      return NextResponse.redirect(url)
    }
    const { data } = (await r.json()) as { data?: { role?: string } }
    const role = data?.role
    if (role !== 'admin-soal') {
      const url = req.nextUrl.clone()
      url.search = ''
      url.pathname = role ? `/${role}/dashboard` : '/login'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  } catch {
    // Auth service unreachable — fail closed to the login page.
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: ['/admin-soal/:path*'],
}
