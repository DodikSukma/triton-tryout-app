import { Router, Request, Response } from 'express'
import { z } from 'zod'
import pool from '../db/pool'
import logger from '../lib/logger'

const router = Router()

const TryoutSchema = z.object({
  nama_tryout: z.string().min(1),
  mata_pelajaran: z.string().min(1),
  durasi_menit: z.number().int().positive().default(90),
})

const OpsiSchema = z.object({
  huruf: z.string().length(1),
  teks: z.string().min(1),
  teks_html: z.string().optional(),
  is_benar: z.boolean().default(false),
})

const SoalSchema = z.object({
  nomor_soal: z.number().int().positive().optional(),
  tipe: z.enum(['pilihan_ganda', 'essay']),
  pertanyaan: z.string().min(1),
  pertanyaan_html: z.string().optional(),
  gambar_url: z.string().url().optional(),
  gambar_base64: z.string().optional(),
  equation: z.string().optional(),
  equation_latex: z.string().optional(),
  panduan_essay: z.string().optional(),
  bobot: z.number().int().positive().default(1),
  opsi: z.array(OpsiSchema).optional(),
})

// GET /tryouts — list tryouts (guru sees own, admin sees all)
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    const role = req.headers['x-user-role'] as string
    const query = role === 'admin'
      ? 'SELECT * FROM tryouts ORDER BY created_at DESC'
      : 'SELECT * FROM tryouts WHERE dibuat_oleh = $1 ORDER BY created_at DESC'
    const result = role === 'admin'
      ? await pool.query(query)
      : await pool.query(query, [userId])

    const ids = result.rows.map((r) => r.id)
    if (ids.length > 0) {
      // soal counts from own DB
      const counts = await pool.query(
        'SELECT tryout_id, COUNT(*)::int AS soal_count, COALESCE(SUM(bobot),0)::int AS total_bobot FROM soal WHERE tryout_id = ANY($1) GROUP BY tryout_id',
        [ids]
      )
      const soalMap = new Map(counts.rows.map((c) => [c.tryout_id, c]))

      result.rows = result.rows.map((r) => ({
        ...r,
        soal_count:  soalMap.get(r.id)?.soal_count  ?? 0,
        total_bobot: soalMap.get(r.id)?.total_bobot ?? 0,
      }))
    }

    res.json({ success: true, data: result.rows })
  } catch (err) {
    logger.error('[tryouts/list]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// GET /tryouts/available — siswa: published only
router.get('/available', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT t.*,
              COALESCE(s.soal_count, 0)::int  AS soal_count,
              COALESCE(s.total_bobot, 0)::int AS total_bobot
         FROM tryouts t
         LEFT JOIN (
           SELECT tryout_id, COUNT(*)::int AS soal_count, SUM(bobot)::int AS total_bobot
             FROM soal GROUP BY tryout_id
         ) s ON s.tryout_id = t.id
        WHERE t.status = 'published'
        ORDER BY t.created_at DESC`
    )
    res.json({ success: true, data: result.rows })
  } catch (err) {
    logger.error('[tryouts/available]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// POST /tryouts
router.post('/', async (req: Request, res: Response) => {
  try {
    const guruId = req.headers['x-user-id'] as string
    const body = TryoutSchema.parse(req.body)
    const result = await pool.query(
      'INSERT INTO tryouts (nama_tryout, mata_pelajaran, durasi_menit, dibuat_oleh) VALUES ($1,$2,$3,$4) RETURNING *',
      [body.nama_tryout, body.mata_pelajaran, body.durasi_menit, guruId]
    )
    res.status(201).json({ success: true, data: result.rows[0] })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const e = err.errors[0]
      return res.status(400).json({ success: false, error: `${e.path.join('.')}: ${e.message}`, code: 'VALIDATION_ERROR' })
    }
    logger.error('[tryouts/create]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// GET /tryouts/:id — tryout detail + all soal + opsi
// For siswa role, is_benar is stripped from opsi to prevent cheating.
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const role = req.headers['x-user-role'] as string
    const tryout = await pool.query('SELECT * FROM tryouts WHERE id = $1', [req.params.id])
    if (!tryout.rows[0]) return res.status(404).json({ success: false, error: 'Tryout tidak ditemukan' })

    const soalList = await pool.query(
      `SELECT s.*,
              COALESCE(
                json_agg(json_build_object(
                  'id', o.id,
                  'huruf', o.huruf,
                  'teks', o.teks,
                  'teks_html', o.teks_html,
                  'is_benar', o.is_benar
                ) ORDER BY o.huruf) FILTER (WHERE o.id IS NOT NULL),
                '[]'::json
              ) AS opsi
         FROM soal s
         LEFT JOIN opsi_jawaban o ON o.soal_id = s.id
        WHERE s.tryout_id = $1
        GROUP BY s.id
        ORDER BY s.nomor_soal`,
      [req.params.id]
    )

    let soal = soalList.rows
    if (role === 'siswa') {
      soal = soal.map((s) => ({
        ...s,
        panduan_essay: null,
        opsi: (s.opsi as { is_benar: boolean }[]).map(({ is_benar: _ignore, ...rest }) => rest),
      }))
    }

    res.json({ success: true, data: { ...tryout.rows[0], soal } })
  } catch (err) {
    logger.error('[tryouts/:id]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// PUT /tryouts/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const body = TryoutSchema.partial().parse(req.body)
    const result = await pool.query(
      `UPDATE tryouts SET
        nama_tryout    = COALESCE($1, nama_tryout),
        mata_pelajaran = COALESCE($2, mata_pelajaran),
        durasi_menit   = COALESCE($3, durasi_menit),
        updated_at     = NOW()
       WHERE id = $4 RETURNING *`,
      [body.nama_tryout, body.mata_pelajaran, body.durasi_menit, req.params.id]
    )
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Tryout tidak ditemukan' })
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const e = err.errors[0]
      return res.status(400).json({ success: false, error: `${e.path.join('.')}: ${e.message}`, code: 'VALIDATION_ERROR' })
    }
    logger.error('[tryouts/:id PUT]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// PATCH /tryouts/:id/publish
router.patch('/:id/publish', async (req: Request, res: Response) => {
  try {
    const StatusSchema = z.object({ status: z.enum(['draft', 'published', 'closed']) })
    const body = StatusSchema.parse(req.body)
    const result = await pool.query(
      'UPDATE tryouts SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [body.status, req.params.id]
    )
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Tryout tidak ditemukan' })
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const e = err.errors[0]
      return res.status(400).json({ success: false, error: `${e.path.join('.')}: ${e.message}`, code: 'VALIDATION_ERROR' })
    }
    logger.error('[tryouts/:id/publish]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// DELETE /tryouts/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM tryouts WHERE id = $1', [req.params.id])
    res.json({ success: true, data: null, message: 'Tryout dihapus' })
  } catch (err) {
    logger.error('[tryouts/:id DELETE]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// POST /tryouts/:id/soal — add a soal (with optional opsi)
router.post('/:id/soal', async (req: Request, res: Response) => {
  const client = await pool.connect()
  try {
    const body = SoalSchema.parse(req.body)

    let nomor = body.nomor_soal
    if (!nomor) {
      const n = await client.query(
        'SELECT COALESCE(MAX(nomor_soal),0)+1 AS next FROM soal WHERE tryout_id=$1',
        [req.params.id]
      )
      nomor = n.rows[0].next
    }

    await client.query('BEGIN')

    const soalResult = await client.query(
      `INSERT INTO soal
         (tryout_id, nomor_soal, tipe, pertanyaan, pertanyaan_html,
          gambar_url, gambar_base64, equation, equation_latex, panduan_essay, bobot)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        req.params.id, nomor, body.tipe, body.pertanyaan, body.pertanyaan_html ?? null,
        body.gambar_url ?? null, body.gambar_base64 ?? null,
        body.equation ?? null, body.equation_latex ?? null,
        body.panduan_essay ?? null, body.bobot,
      ]
    )
    const soal = soalResult.rows[0]

    const opsiList: unknown[] = []
    if (body.opsi && body.opsi.length > 0) {
      for (const opsi of body.opsi) {
        const r = await client.query(
          'INSERT INTO opsi_jawaban (soal_id, huruf, teks, teks_html, is_benar) VALUES ($1,$2,$3,$4,$5) RETURNING *',
          [soal.id, opsi.huruf, opsi.teks, opsi.teks_html ?? null, opsi.is_benar]
        )
        opsiList.push(r.rows[0])
      }
    }

    await client.query('COMMIT')
    res.status(201).json({ success: true, data: { ...soal, opsi: opsiList } })
  } catch (err) {
    await client.query('ROLLBACK')
    if (err instanceof z.ZodError) {
      const e = err.errors[0]
      return res.status(400).json({ success: false, error: `${e.path.join('.')}: ${e.message}`, code: 'VALIDATION_ERROR' })
    }
    logger.error('[tryouts/:id/soal POST]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  } finally {
    client.release()
  }
})

export default router
