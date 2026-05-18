import express from 'express'
import cors from 'cors'
import { createProxyMiddleware } from 'http-proxy-middleware'
import logger from './lib/logger'
import { requireAuth, requireRole } from './middleware/auth.middleware'

const app = express()
const PORT = process.env.PORT ?? 4000

const AUTH_SERVICE_URL    = process.env.AUTH_SERVICE_URL    ?? 'http://localhost:4001'
const USER_SERVICE_URL    = process.env.USER_SERVICE_URL    ?? 'http://localhost:4002'
const SOAL_SERVICE_URL    = process.env.SOAL_SERVICE_URL    ?? 'http://localhost:4003'
const JAWABAN_SERVICE_URL = process.env.JAWABAN_SERVICE_URL ?? 'http://localhost:4004'

app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  credentials: true,
}))

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip })
  next()
})

// ─── Auth (public) ──────────────────────────────────────────
app.use('/auth', createProxyMiddleware({ target: AUTH_SERVICE_URL, changeOrigin: true }))

// ─── User service ───────────────────────────────────────────
// Profile endpoints — all authenticated roles
app.use('/users/profile', requireAuth, createProxyMiddleware({ target: USER_SERVICE_URL, changeOrigin: true }))
// User management — admin only
app.use('/users', requireAuth, requireRole('admin'), createProxyMiddleware({ target: USER_SERVICE_URL, changeOrigin: true }))

// ─── Soal service ───────────────────────────────────────────
// Siswa: list of published tryouts
app.use('/tryouts/available', requireAuth, requireRole('siswa'), createProxyMiddleware({ target: SOAL_SERVICE_URL, changeOrigin: true }))

// /tryouts/:id GET → all roles (siswa needs for exam)
// /tryouts (POST), /tryouts/:id (PUT/PATCH/DELETE), /tryouts/:id/soal (POST) → guru/admin
app.use('/tryouts', requireAuth, (req, res, next) => {
  const role = req.headers['x-user-role'] as string
  if (req.method === 'GET') {
    // Only GET /tryouts/:id allowed for siswa (single tryout detail for exam)
    if (role === 'siswa' && /^\/[a-f0-9-]+$/.test(req.path)) return next()
    if (role === 'guru' || role === 'admin') return next()
    return res.status(403).json({ success: false, error: 'Forbidden' })
  }
  if (role === 'guru' || role === 'admin') return next()
  return res.status(403).json({ success: false, error: 'Forbidden' })
}, createProxyMiddleware({ target: SOAL_SERVICE_URL, changeOrigin: true }))

app.use('/soal', requireAuth, requireRole('guru', 'admin'), createProxyMiddleware({ target: SOAL_SERVICE_URL, changeOrigin: true }))

// ─── Jawaban service ────────────────────────────────────────
app.use('/sesi',    requireAuth, requireRole('siswa'),         createProxyMiddleware({ target: JAWABAN_SERVICE_URL, changeOrigin: true }))
app.use('/hasil',   requireAuth,                                createProxyMiddleware({ target: JAWABAN_SERVICE_URL, changeOrigin: true }))
app.use('/riwayat', requireAuth, requireRole('siswa'),         createProxyMiddleware({ target: JAWABAN_SERVICE_URL, changeOrigin: true }))

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'api-gateway' }))

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack })
  res.status(500).json({ success: false, error: 'Internal server error' })
})

app.listen(PORT, () => logger.info(`API Gateway running on port ${PORT}`))
