import { Router, Request, Response } from 'express'
import { z } from 'zod'
import pool from '../db/pool'
import logger from '../lib/logger'
import { auditLog } from '../lib/audit'

const router = Router()

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL ?? 'http://localhost:4001'

interface AuthUser {
  id: string
  email: string
  role: 'admin' | 'guru' | 'siswa'
  is_active: boolean
  created_at: string
}

const UpdateProfileSchema = z.object({
  nama_lengkap: z.string().min(1).optional(),
  no_telepon: z.string().optional().nullable(),
  kelas: z.string().optional().nullable(),
  mata_pelajaran: z.string().optional().nullable(),
  education_level: z.enum(['SD', 'SMP', 'SMA']).optional().nullable(),
  bio: z.string().optional().nullable(),
  avatar_url: z.string().optional().nullable(),
})

const AvatarSchema = z.object({
  avatar_base64: z.string().min(20),
  mime_type: z.string().regex(/^image\/(jpeg|jpg|png|gif|webp)$/),
})

// Approx max size: 2MB raw → ~2.8MB base64
const MAX_AVATAR_BASE64_LEN = 2_800_000

// GET /users — admin only — joins profile + auth data
router.get('/', async (req: Request, res: Response) => {
  try {
    const roleFilter = req.query.role as string | undefined

    const authRes = await fetch(`${AUTH_SERVICE_URL}/auth/internal/users`)
    const authJson = (await authRes.json()) as { success: boolean; data: AuthUser[] }
    let authUsers = authJson.data ?? []

    if (roleFilter && ['admin', 'guru', 'siswa'].includes(roleFilter)) {
      authUsers = authUsers.filter((u) => u.role === roleFilter)
    }

    const profiles = await pool.query(
      'SELECT user_id, nama_lengkap, no_telepon, kelas, mata_pelajaran, education_level, avatar_url, bio FROM profiles'
    )
    const profMap = new Map(profiles.rows.map((p) => [p.user_id, p]))

    const merged = authUsers.map((u) => ({
      ...u,
      profile: profMap.get(u.id) ?? null,
    }))

    res.json({ success: true, data: merged })
  } catch (err) {
    logger.error('[users/list]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// POST /users — admin only — create new user (auth + profile)
const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['admin', 'guru', 'siswa']),
  nama_lengkap: z.string().min(1, 'Nama lengkap wajib diisi'),
  no_telepon: z.string().optional().nullable(),
  kelas: z.string().optional().nullable(),
  mata_pelajaran: z.string().optional().nullable(),
  education_level: z.enum(['SD', 'SMP', 'SMA']).optional().nullable(),
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const body = CreateUserSchema.parse(req.body)

    // 1. Create auth user
    const authRes = await fetch(`${AUTH_SERVICE_URL}/auth/internal/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: body.email, password: body.password, role: body.role }),
    })
    const authJson = (await authRes.json()) as { success: boolean; data?: AuthUser; error?: string; code?: string }
    if (!authRes.ok || !authJson.success || !authJson.data) {
      return res.status(authRes.status).json({
        success: false,
        error: authJson.error ?? 'Gagal membuat akun.',
        code: authJson.code,
      })
    }
    const newUser = authJson.data

    // 2. Create profile
    const prof = await pool.query(
      `INSERT INTO profiles (user_id, nama_lengkap, no_telepon, kelas, mata_pelajaran, education_level)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [newUser.id, body.nama_lengkap, body.no_telepon ?? null, body.kelas ?? null, body.mata_pelajaran ?? null, body.education_level ?? null]
    )

    auditLog(req, {
      action: 'USER_CREATE',
      target_id: newUser.id,
      description: `Admin created user ${body.email} with role ${body.role}`,
    })

    res.status(201).json({
      success: true,
      data: { ...newUser, profile: prof.rows[0] },
      message: 'Pengguna berhasil ditambahkan.',
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message, code: 'VALIDATION_ERROR' })
    }
    logger.error('[users POST]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// PATCH /users/:id/active — toggle is_active (admin)
router.patch('/:id/active', async (req: Request, res: Response) => {
  try {
    const ToggleSchema = z.object({ is_active: z.boolean() })
    const body = ToggleSchema.parse(req.body)
    const authRes = await fetch(`${AUTH_SERVICE_URL}/auth/internal/users/${req.params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: body.is_active }),
    })
    const authJson = (await authRes.json()) as { success: boolean; data?: AuthUser; error?: string }
    if (!authRes.ok || !authJson.success) {
      return res.status(authRes.status).json({ success: false, error: authJson.error ?? 'Gagal' })
    }
    auditLog(req, {
      action: 'USER_TOGGLE_ACTIVE',
      target_id: req.params.id,
      description: `Admin updated status of user ${authJson.data?.email ?? req.params.id} to active=${body.is_active}`,
    })
    res.json({ success: true, data: authJson.data })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message, code: 'VALIDATION_ERROR' })
    }
    logger.error('[users/:id/active]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// GET /users/profile/me
router.get('/profile/me', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    const result = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId])
    res.json({ success: true, data: result.rows[0] ?? null })
  } catch (err) {
    logger.error('[users/profile/me]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// PUT /users/profile/me
router.put('/profile/me', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    const body = UpdateProfileSchema.parse(req.body)
    const existing = await pool.query('SELECT id FROM profiles WHERE user_id = $1', [userId])
    if (existing.rows.length === 0) {
      const result = await pool.query(
        `INSERT INTO profiles (user_id, nama_lengkap, no_telepon, kelas, mata_pelajaran, bio, avatar_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [
          userId,
          body.nama_lengkap ?? '',
          body.no_telepon ?? null,
          body.kelas ?? null,
          body.mata_pelajaran ?? null,
          body.bio ?? null,
          body.avatar_url ?? null,
        ]
      )
      return res.json({ success: true, data: result.rows[0] })
    }
    const result = await pool.query(
      `UPDATE profiles SET
        nama_lengkap   = COALESCE($1, nama_lengkap),
        no_telepon     = COALESCE($2, no_telepon),
        kelas          = COALESCE($3, kelas),
        mata_pelajaran = COALESCE($4, mata_pelajaran),
        bio            = COALESCE($5, bio),
        avatar_url     = COALESCE($6, avatar_url),
        updated_at     = NOW()
       WHERE user_id = $7 RETURNING *`,
      [body.nama_lengkap, body.no_telepon, body.kelas, body.mata_pelajaran, body.bio, body.avatar_url, userId]
    )
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message, code: 'VALIDATION_ERROR' })
    }
    logger.error('[users/profile/me PUT]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// POST /users/profile/avatar — upload avatar (base64)
router.post('/profile/avatar', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    const body = AvatarSchema.parse(req.body)

    if (body.avatar_base64.length > MAX_AVATAR_BASE64_LEN) {
      return res.status(400).json({
        success: false,
        error: 'Ukuran gambar terlalu besar (maksimal 2MB).',
        code: 'FILE_TOO_LARGE',
      })
    }

    const dataUri = `data:${body.mime_type};base64,${body.avatar_base64}`

    // Upsert profile so avatar can save before profile is filled
    const existing = await pool.query('SELECT id FROM profiles WHERE user_id = $1', [userId])
    if (existing.rows.length === 0) {
      await pool.query(
        'INSERT INTO profiles (user_id, nama_lengkap, avatar_url) VALUES ($1, $2, $3)',
        [userId, '', dataUri]
      )
    } else {
      await pool.query(
        'UPDATE profiles SET avatar_url = $1, updated_at = NOW() WHERE user_id = $2',
        [dataUri, userId]
      )
    }

    res.json({ success: true, data: { avatar_url: dataUri }, message: 'Foto profil berhasil diperbarui.' })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message, code: 'VALIDATION_ERROR' })
    }
    logger.error('[users/profile/avatar]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// GET /users/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [req.params.id])
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'User tidak ditemukan' })
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    logger.error('[users/:id]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// PUT /users/:id — admin
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const body = UpdateProfileSchema.parse(req.body)
    const result = await pool.query(
      `UPDATE profiles SET
        nama_lengkap    = COALESCE($1, nama_lengkap),
        no_telepon      = COALESCE($2, no_telepon),
        kelas           = COALESCE($3, kelas),
        mata_pelajaran  = COALESCE($4, mata_pelajaran),
        education_level = COALESCE($5, education_level),
        bio             = COALESCE($6, bio),
        updated_at      = NOW()
       WHERE user_id = $7 RETURNING *`,
      [body.nama_lengkap, body.no_telepon, body.kelas, body.mata_pelajaran, body.education_level, body.bio, req.params.id]
    )
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'User tidak ditemukan' })
    auditLog(req, {
      action: 'USER_UPDATE',
      target_id: req.params.id,
      description: `Admin updated profile for user ${result.rows[0].nama_lengkap ?? req.params.id}`,
    })
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message, code: 'VALIDATION_ERROR' })
    }
    logger.error('[users/:id PUT]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// DELETE /users/:id — admin (deletes from BOTH auth + profile)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // Capture name before deletion for the audit trail.
    const before = await pool.query('SELECT nama_lengkap FROM profiles WHERE user_id = $1', [req.params.id])
    // Profile first (cascade-safe)
    await pool.query('DELETE FROM profiles WHERE user_id = $1', [req.params.id])
    // Then auth
    await fetch(`${AUTH_SERVICE_URL}/auth/internal/users/${req.params.id}`, { method: 'DELETE' })
    auditLog(req, {
      action: 'USER_DELETE',
      target_id: req.params.id,
      description: `Admin deleted user account ${before.rows[0]?.nama_lengkap ?? req.params.id}`,
    })
    res.json({ success: true, data: null, message: 'Pengguna dihapus.' })
  } catch (err) {
    logger.error('[users/:id DELETE]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
