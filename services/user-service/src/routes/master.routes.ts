import { Router, Request, Response } from 'express'
import { z } from 'zod'
import pool from '../db/pool'
import logger from '../lib/logger'

const router = Router()

const LevelEnum = z.enum(['SD', 'SMP', 'SMA'])

// Postgres unique-violation → friendly 409
function handleDbError(err: unknown, res: Response, tag: string) {
  if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === '23505') {
    return res.status(409).json({ success: false, error: 'Data dengan nama tersebut sudah ada.', code: 'DUPLICATE' })
  }
  if (err instanceof z.ZodError) {
    return res.status(400).json({ success: false, error: err.errors[0].message, code: 'VALIDATION_ERROR' })
  }
  logger.error(tag, { error: err })
  return res.status(500).json({ success: false, error: 'Internal server error' })
}

// ─── Kelas ──────────────────────────────────────────────────────────────────
const KelasSchema = z.object({ nama: z.string().min(1), level: LevelEnum })

router.get('/kelas', async (req: Request, res: Response) => {
  try {
    const level = req.query.level as string | undefined
    const result = level
      ? await pool.query('SELECT * FROM master_kelas WHERE level = $1 ORDER BY nama', [level])
      : await pool.query('SELECT * FROM master_kelas ORDER BY level, nama')
    res.json({ success: true, data: result.rows })
  } catch (err) {
    handleDbError(err, res, '[master/kelas GET]')
  }
})

router.post('/kelas', async (req: Request, res: Response) => {
  try {
    const body = KelasSchema.parse(req.body)
    const result = await pool.query(
      'INSERT INTO master_kelas (nama, level) VALUES ($1, $2) RETURNING *',
      [body.nama, body.level]
    )
    res.status(201).json({ success: true, data: result.rows[0], message: 'Kelas ditambahkan.' })
  } catch (err) {
    handleDbError(err, res, '[master/kelas POST]')
  }
})

router.delete('/kelas/:id', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM master_kelas WHERE id = $1', [req.params.id])
    res.json({ success: true, data: null, message: 'Kelas dihapus.' })
  } catch (err) {
    handleDbError(err, res, '[master/kelas DELETE]')
  }
})

// ─── Mata Pelajaran ─────────────────────────────────────────────────────────
const MapelSchema = z.object({ nama: z.string().min(1), level: LevelEnum })

router.get('/mata-pelajaran', async (req: Request, res: Response) => {
  try {
    const level = req.query.level as string | undefined
    const result = level
      ? await pool.query('SELECT * FROM master_mata_pelajaran WHERE level = $1 ORDER BY nama', [level])
      : await pool.query('SELECT * FROM master_mata_pelajaran ORDER BY level, nama')
    res.json({ success: true, data: result.rows })
  } catch (err) {
    handleDbError(err, res, '[master/mata-pelajaran GET]')
  }
})

router.post('/mata-pelajaran', async (req: Request, res: Response) => {
  try {
    const body = MapelSchema.parse(req.body)
    const result = await pool.query(
      'INSERT INTO master_mata_pelajaran (nama, level) VALUES ($1, $2) RETURNING *',
      [body.nama, body.level]
    )
    res.status(201).json({ success: true, data: result.rows[0], message: 'Mata pelajaran ditambahkan.' })
  } catch (err) {
    handleDbError(err, res, '[master/mata-pelajaran POST]')
  }
})

router.delete('/mata-pelajaran/:id', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM master_mata_pelajaran WHERE id = $1', [req.params.id])
    res.json({ success: true, data: null, message: 'Mata pelajaran dihapus.' })
  } catch (err) {
    handleDbError(err, res, '[master/mata-pelajaran DELETE]')
  }
})

// ─── Sub Mata Pelajaran ─────────────────────────────────────────────────────
const SubMapelSchema = z.object({ mata_pelajaran_id: z.string().uuid(), nama: z.string().min(1) })

router.get('/sub-mata-pelajaran', async (req: Request, res: Response) => {
  try {
    const mapelId = req.query.mata_pelajaran_id as string | undefined
    // Join parent subject so the frontend has its name + level for cascading.
    const base = `SELECT s.*, m.nama AS mata_pelajaran_nama, m.level AS level
                    FROM master_sub_mata_pelajaran s
                    JOIN master_mata_pelajaran m ON m.id = s.mata_pelajaran_id`
    const result = mapelId
      ? await pool.query(`${base} WHERE s.mata_pelajaran_id = $1 ORDER BY s.nama`, [mapelId])
      : await pool.query(`${base} ORDER BY m.nama, s.nama`)
    res.json({ success: true, data: result.rows })
  } catch (err) {
    handleDbError(err, res, '[master/sub-mata-pelajaran GET]')
  }
})

router.post('/sub-mata-pelajaran', async (req: Request, res: Response) => {
  try {
    const body = SubMapelSchema.parse(req.body)
    const result = await pool.query(
      'INSERT INTO master_sub_mata_pelajaran (mata_pelajaran_id, nama) VALUES ($1, $2) RETURNING *',
      [body.mata_pelajaran_id, body.nama]
    )
    res.status(201).json({ success: true, data: result.rows[0], message: 'Sub mata pelajaran ditambahkan.' })
  } catch (err) {
    handleDbError(err, res, '[master/sub-mata-pelajaran POST]')
  }
})

router.delete('/sub-mata-pelajaran/:id', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM master_sub_mata_pelajaran WHERE id = $1', [req.params.id])
    res.json({ success: true, data: null, message: 'Sub mata pelajaran dihapus.' })
  } catch (err) {
    handleDbError(err, res, '[master/sub-mata-pelajaran DELETE]')
  }
})

export default router
