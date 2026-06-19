import express from 'express'
import cors from 'cors'
import { createProxyMiddleware } from 'http-proxy-middleware'
import logger from './lib/logger'
import { requireAuth, requireRole } from './middleware/auth.middleware'

const app = express()
const PORT = process.env.PORT ?? 4000

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL ?? 'http://localhost:4001'
const USER_SERVICE_URL = process.env.USER_SERVICE_URL ?? 'http://localhost:4002'

// ─── Education-level services (replace soal-service + jawaban-service) ───────
const SD_SERVICE_URL = process.env.SD_SERVICE_URL ?? 'http://localhost:4005'
const SMP_SERVICE_URL = process.env.SMP_SERVICE_URL ?? 'http://localhost:4006'
const SMA_SERVICE_URL = process.env.SMA_SERVICE_URL ?? 'http://localhost:4007'

app.use(cors({
  origin: (origin, callback) => {
    // Allow any origin dynamically to avoid CORS issues in dev/demo mode
    callback(null, true)
  },
  credentials: true,
}))

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip })
  next()
})

// ─── Auth (public) ──────────────────────────────────────────
// xfwd forwards the client IP (X-Forwarded-For) for audit logging.
app.use('/auth', createProxyMiddleware({ target: AUTH_SERVICE_URL, changeOrigin: true, xfwd: true }))

// ─── User service ───────────────────────────────────────────
// Profile endpoints — all authenticated roles
app.use('/users/profile', requireAuth, createProxyMiddleware({ target: USER_SERVICE_URL, changeOrigin: true, xfwd: true }))
// User management — admin only
app.use('/users', requireAuth, requireRole('admin'), createProxyMiddleware({ target: USER_SERVICE_URL, changeOrigin: true, xfwd: true }))
// Audit logs viewer — admin only (read)
app.use('/audit-logs', requireAuth, requireRole('admin'), createProxyMiddleware({ target: USER_SERVICE_URL, changeOrigin: true, xfwd: true }))

// ─── Level services (SD / SMP / SMA) ────────────────────────
// Each level service merges the old soal + jawaban responsibilities for one
// education level. The role guard below mirrors the per-resource RBAC that the
// old soal/jawaban gateway routes enforced, applied to the level-stripped path.
//
// Path note: `app.use('/sd', ...)` makes Express strip `/sd` from req.path for
// the guard, while http-proxy-middleware forwards the original URL — so
// pathRewrite removes the `/sd` prefix before reaching the service.

const forbidden = (res: express.Response) =>
  res.status(403).json({ success: false, error: 'Forbidden' })

// ─── Master data (user-service) ─────────────────────────────────────────────
// Reads: guru + admin (gurus need the dropdowns). Writes: admin only.
app.use('/master', requireAuth, (req, res, next) => {
  const role = req.headers['x-user-role'] as string
  if (req.method === 'GET') {
    return role === 'guru' || role === 'admin' ? next() : forbidden(res)
  }
  return role === 'admin' ? next() : forbidden(res)
}, createProxyMiddleware({ target: USER_SERVICE_URL, changeOrigin: true, xfwd: true }))

// RBAC for level routes. `req.path` here is relative to the /sd|/smp|/sma mount.
function levelAccessGuard(req: express.Request, res: express.Response, next: express.NextFunction) {
  const role = req.headers['x-user-role'] as string
  const p = req.path
  const method = req.method

  // Siswa: list of published tryouts
  if (p === '/tryouts/available') {
    return role === 'siswa' ? next() : forbidden(res)
  }

  // Tryout / question-bank management
  if (p === '/tryouts' || p.startsWith('/tryouts/')) {
    if (method === 'GET') {
      // Single tryout detail (uuid) — siswa needs it to take the exam
      if (role === 'siswa' && /^\/tryouts\/[a-f0-9-]+$/.test(p)) return next()
      if (role === 'guru' || role === 'admin') return next()
      return forbidden(res)
    }
    // Create / update / delete / publish / add-soal — guru or admin
    return role === 'guru' || role === 'admin' ? next() : forbidden(res)
  }

  // Soal edits — guru or admin
  if (p === '/soal' || p.startsWith('/soal/')) {
    return role === 'guru' || role === 'admin' ? next() : forbidden(res)
  }

  // Exam session runner + history — siswa
  if (p === '/sesi' || p.startsWith('/sesi/') || p === '/riwayat') {
    return role === 'siswa' ? next() : forbidden(res)
  }

  // Results — any authenticated role (rekap is further restricted inside the service)
  if (p === '/hasil' || p.startsWith('/hasil/')) {
    return next()
  }

  // Anything else (e.g. /health) — allow authenticated through
  return next()
}

// ─── Student level firewall + class scoping (TRN-04 / TRN-07) ───────────────
// A student may only reach their own education level's service (firewall), and
// their assigned class is forwarded as x-user-class so level services can scope
// the available-tryout list. Admin + guru bypass. Cached briefly.
const profileCache = new Map<string, { level: string | null; kelas: string | null; exp: number }>()

async function getStudentProfile(userId: string): Promise<{ level: string | null; kelas: string | null }> {
  const cached = profileCache.get(userId)
  if (cached && cached.exp > Date.now()) return cached
  try {
    const r = await fetch(`${USER_SERVICE_URL}/users/${userId}`)
    const j = (await r.json()) as { success: boolean; data?: { education_level?: string | null; kelas?: string | null } }
    const level = j.success && j.data ? (j.data.education_level ?? null) : null
    const kelas = j.success && j.data ? (j.data.kelas ?? null) : null
    const entry = { level, kelas, exp: Date.now() + 60_000 }
    profileCache.set(userId, entry)
    return entry
  } catch {
    return { level: null, kelas: null }
  }
}

function makeLevelFirewall(prefix: 'sd' | 'smp' | 'sma') {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if ((req.headers['x-user-role'] as string) !== 'siswa') return next() // admin + guru bypass
    const { level, kelas } = await getStudentProfile(req.headers['x-user-id'] as string)
    // Enforce only when the student's level is set; mismatch → blocked.
    if (level && level.toLowerCase() !== prefix) {
      return res.status(403).json({
        success: false,
        error: `Akses ditolak: tryout jenjang ${prefix.toUpperCase()} tidak sesuai dengan jenjang Anda (${level}).`,
        code: 'LEVEL_FORBIDDEN',
      })
    }
    // Forward the assigned class so the level service can scope by class.
    if (kelas) req.headers['x-user-class'] = kelas
    return next()
  }
}

app.use('/sd', requireAuth, makeLevelFirewall('sd'), levelAccessGuard, createProxyMiddleware({
  target: SD_SERVICE_URL, changeOrigin: true, xfwd: true, pathRewrite: { '^/sd': '' },
}))
app.use('/smp', requireAuth, makeLevelFirewall('smp'), levelAccessGuard, createProxyMiddleware({
  target: SMP_SERVICE_URL, changeOrigin: true, xfwd: true, pathRewrite: { '^/smp': '' },
}))
app.use('/sma', requireAuth, makeLevelFirewall('sma'), levelAccessGuard, createProxyMiddleware({
  target: SMA_SERVICE_URL, changeOrigin: true, xfwd: true, pathRewrite: { '^/sma': '' },
}))

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'api-gateway' }))

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack })
  res.status(500).json({ success: false, error: 'Internal server error' })
})

app.listen(PORT, () => logger.info(`API Gateway running on port ${PORT}`))
