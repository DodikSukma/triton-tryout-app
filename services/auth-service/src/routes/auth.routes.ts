import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import pool from '../db/pool'
import logger from '../lib/logger'

const router = Router()

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(6),
})

router.post('/login', async (req: Request, res: Response) => {
  try {
    const body = LoginSchema.parse(req.body)
    const result = await pool.query(
      'SELECT id, email, password_hash, role, is_active FROM users WHERE email = $1',
      [body.email]
    )
    const user = result.rows[0]
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, error: 'Email atau password salah' })
    }
    const valid = await bcrypt.compare(body.password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Email atau password salah' })
    }
    req.session.userId = user.id
    req.session.role = user.role
    req.session.email = user.email
    res.json({ success: true, data: { userId: user.id, role: user.role, email: user.email } })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message, code: 'VALIDATION_ERROR' })
    }
    logger.error('[auth/login]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Gagal logout' })
    }
    res.clearCookie('triton.sid')
    res.json({ success: true, data: null, message: 'Berhasil logout' })
  })
})

router.get('/me', (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }
  res.json({
    success: true,
    data: {
      userId: req.session.userId,
      role: req.session.role,
      email: req.session.email,
    },
  })
})

router.post('/change-password', async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }
    const body = ChangePasswordSchema.parse(req.body)
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.session.userId])
    const user = result.rows[0]
    if (!user) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan' })
    }
    const valid = await bcrypt.compare(body.oldPassword, user.password_hash)
    if (!valid) {
      return res.status(400).json({ success: false, error: 'Password lama tidak sesuai' })
    }
    const newHash = await bcrypt.hash(body.newPassword, 12)
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, req.session.userId])
    res.json({ success: true, data: null, message: 'Password berhasil diubah' })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message, code: 'VALIDATION_ERROR' })
    }
    logger.error('[auth/change-password]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// ─── Internal: create user (called by user-service when admin adds user) ────
// Not exposed via gateway — only reachable from internal services.
const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'guru', 'siswa']),
})

router.post('/internal/users', async (req: Request, res: Response) => {
  try {
    const body = CreateUserSchema.parse(req.body)
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [body.email])
    if (exists.rows[0]) {
      return res.status(409).json({ success: false, error: 'Email sudah terdaftar.', code: 'EMAIL_EXISTS' })
    }
    const hash = await bcrypt.hash(body.password, 12)
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1,$2,$3) RETURNING id, email, role, is_active, created_at',
      [body.email, hash, body.role]
    )
    res.status(201).json({ success: true, data: result.rows[0] })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message, code: 'VALIDATION_ERROR' })
    }
    logger.error('[auth/internal/users POST]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.patch('/internal/users/:id', async (req: Request, res: Response) => {
  try {
    const PatchSchema = z.object({
      is_active: z.boolean().optional(),
      password: z.string().min(6).optional(),
      role: z.enum(['admin', 'guru', 'siswa']).optional(),
    })
    const body = PatchSchema.parse(req.body)
    const updates: string[] = []
    const values: unknown[] = []
    let i = 1
    if (body.is_active !== undefined) { updates.push(`is_active = $${i++}`); values.push(body.is_active) }
    if (body.role) { updates.push(`role = $${i++}`); values.push(body.role) }
    if (body.password) { updates.push(`password_hash = $${i++}`); values.push(await bcrypt.hash(body.password, 12)) }
    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'Tidak ada perubahan.' })
    }
    updates.push('updated_at = NOW()')
    values.push(req.params.id)
    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${i} RETURNING id, email, role, is_active`,
      values
    )
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'User tidak ditemukan' })
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message, code: 'VALIDATION_ERROR' })
    }
    logger.error('[auth/internal/users PATCH]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.delete('/internal/users/:id', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id])
    res.json({ success: true, data: null })
  } catch (err) {
    logger.error('[auth/internal/users DELETE]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.get('/internal/users', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT id, email, role, is_active, created_at FROM users ORDER BY created_at DESC')
    res.json({ success: true, data: result.rows })
  } catch (err) {
    logger.error('[auth/internal/users GET]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
