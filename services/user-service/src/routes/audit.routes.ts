import { Router, Request, Response } from 'express'
import { z } from 'zod'
import pool from '../db/pool'
import logger from '../lib/logger'
import { buildAuditPayload, insertAuditLog } from '../lib/audit'

const router = Router()

const WriteSchema = z.object({
  user_id: z.string().uuid().optional().nullable(),
  email: z.string().min(1),
  role: z.string().min(1),
  action: z.string().min(1),
  target_id: z.string().uuid().optional().nullable(),
  description: z.string().min(1),
  ip_address: z.string().optional().nullable(),
  user_agent: z.string().optional().nullable(),
})

// Map a UI category to its action prefix.
const CATEGORY_PREFIX: Record<string, string> = {
  auth: 'AUTH_%', users: 'USER_%', tryout: 'TRYOUT_%', exam: 'EXAM_%',
}

// ─── POST /internal/audit-logs — write (server-to-server, not via gateway) ───
router.post('/internal/audit-logs', async (req: Request, res: Response) => {
  try {
    const body = WriteSchema.parse(req.body)
    // Pass through explicit fields; buildAuditPayload only fills gaps.
    await insertAuditLog(buildAuditPayload(req, body))
    res.status(201).json({ success: true })
  } catch (err) {
    // Logging must never break callers — log and ack with 400 on bad payload.
    logger.error('[audit/write]', { error: err })
    res.status(400).json({ success: false })
  }
})

// ─── GET /audit-logs — admin viewer (filtered + paginated, via gateway) ──────
router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string | undefined)?.trim()
    const role = req.query.role as string | undefined
    const category = req.query.category as string | undefined
    const from = req.query.from as string | undefined // ISO timestamp lower bound
    const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) ?? '20', 10) || 20))
    const offset = (page - 1) * limit

    const where: string[] = []
    const params: unknown[] = []
    let i = 1

    if (q) { where.push(`(email ILIKE $${i} OR description ILIKE $${i})`); params.push(`%${q}%`); i++ }
    if (role && ['admin', 'guru', 'siswa', 'system'].includes(role)) { where.push(`role = $${i++}`); params.push(role) }
    if (category && CATEGORY_PREFIX[category]) { where.push(`action LIKE $${i++}`); params.push(CATEGORY_PREFIX[category]) }
    if (from) { where.push(`created_at >= $${i++}`); params.push(from) }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

    const totalRes = await pool.query(`SELECT COUNT(*)::int AS total FROM audit_logs ${whereSql}`, params)
    const total = totalRes.rows[0].total as number

    const rows = await pool.query(
      `SELECT id, user_id, email, role, action, target_id, description, ip_address, user_agent, created_at
         FROM audit_logs ${whereSql}
        ORDER BY created_at DESC
        LIMIT $${i++} OFFSET $${i++}`,
      [...params, limit, offset]
    )

    res.json({
      success: true,
      data: rows.rows,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    })
  } catch (err) {
    logger.error('[audit/list]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
