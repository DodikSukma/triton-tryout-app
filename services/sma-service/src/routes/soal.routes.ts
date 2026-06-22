import { Router, Request, Response } from 'express'
import { z } from 'zod'
import pool from '../db/pool'
import logger from '../lib/logger'

const router = Router()

const OpsiSchema = z.object({
  huruf: z.string().length(1),
  teks: z.string().min(1),
  teks_html: z.string().optional(),
  is_benar: z.boolean().default(false),
})

const UpdateSoalSchema = z.object({
  nomor_soal: z.number().int().positive().optional(),
  tipe: z.enum(['pilihan_ganda', 'essay']).optional(),
  pertanyaan: z.string().min(1).optional(),
  pertanyaan_html: z.string().optional(),
  gambar_url: z.string().url().optional().nullable(),
  gambar_base64: z.string().optional().nullable(),
  equation: z.string().optional().nullable(),
  equation_latex: z.string().optional().nullable(),
  panduan_essay: z.string().optional().nullable(),
  bobot: z.number().int().positive().optional(),
  // TRN-10: question code + solution/explanation
  kode_soal: z.string().optional().nullable(),
  penyelesaian: z.string().optional().nullable(),
  penyelesaian_html: z.string().optional().nullable(),
  penyelesaian_gambar_url: z.string().optional().nullable(),
  penyelesaian_gambar_base64: z.string().optional().nullable(),
  opsi: z.array(OpsiSchema).optional(),
})

// GET /soal/bank?mata_pelajaran=&kelas= — TRN-10 Question Bank search.
// Allowed roles (also enforced at the gateway): admin, admin-soal.
const ALLOWED_BANK_ROLES = new Set(['admin', 'admin-soal'])

router.get('/bank', async (req: Request, res: Response) => {
  try {
    const role = req.headers['x-user-role'] as string
    if (!ALLOWED_BANK_ROLES.has(role)) {
      return res.status(403).json({ success: false, error: 'Forbidden' })
    }
    const mapel = (req.query.mata_pelajaran as string | undefined)?.trim()
    const kelas = (req.query.kelas as string | undefined)?.trim()
    const search = (req.query.search as string | undefined)?.trim()

    const conds: string[] = []
    const params: unknown[] = []
    if (mapel) { params.push(mapel); conds.push(`t.mata_pelajaran = $${params.length}`) }
    if (kelas) { params.push(kelas); conds.push(`t.kelas = $${params.length}`) }
    // TRN-14: keyword search by question code or question text.
    if (search) {
      params.push(`%${search}%`)
      conds.push(`(s.kode_soal ILIKE $${params.length} OR s.pertanyaan ILIKE $${params.length})`)
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : ''

    const result = await pool.query(
      `SELECT s.id, s.tryout_id, s.nomor_soal, s.tipe, s.bobot,
              s.pertanyaan, s.pertanyaan_html, s.gambar_url, s.gambar_base64,
              s.kode_soal, s.penyelesaian, s.penyelesaian_html,
              s.penyelesaian_gambar_url, s.penyelesaian_gambar_base64,
              t.nama_tryout, t.mata_pelajaran, t.kelas, t.is_super_tryout,
              COALESCE(
                json_agg(json_build_object(
                  'id', o.id, 'huruf', o.huruf, 'teks', o.teks, 'teks_html', o.teks_html, 'is_benar', o.is_benar
                ) ORDER BY o.huruf) FILTER (WHERE o.id IS NOT NULL),
                '[]'::json
              ) AS opsi
         FROM soal s
         JOIN tryouts t ON t.id = s.tryout_id
         LEFT JOIN opsi_jawaban o ON o.soal_id = s.id
         ${where}
        GROUP BY s.id, t.nama_tryout, t.mata_pelajaran, t.kelas, t.is_super_tryout
        ORDER BY s.created_at DESC
        LIMIT 300`,
      params
    )
    res.json({ success: true, data: result.rows })
  } catch (err) {
    logger.error('[soal/bank]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// PUT /soal/:soalId — full update with opsi replacement
router.put('/:soalId', async (req: Request, res: Response) => {
  const client = await pool.connect()
  try {
    const body = UpdateSoalSchema.parse(req.body)

    await client.query('BEGIN')

    const result = await client.query(
      `UPDATE soal SET
        nomor_soal      = COALESCE($1,  nomor_soal),
        tipe            = COALESCE($2,  tipe),
        pertanyaan      = COALESCE($3,  pertanyaan),
        pertanyaan_html = COALESCE($4,  pertanyaan_html),
        gambar_url      = COALESCE($5,  gambar_url),
        gambar_base64   = COALESCE($6,  gambar_base64),
        equation        = COALESCE($7,  equation),
        equation_latex  = COALESCE($8,  equation_latex),
        panduan_essay   = COALESCE($9,  panduan_essay),
        bobot           = COALESCE($10, bobot),
        kode_soal                  = COALESCE($12, kode_soal),
        penyelesaian               = COALESCE($13, penyelesaian),
        penyelesaian_html          = COALESCE($14, penyelesaian_html),
        penyelesaian_gambar_url    = COALESCE($15, penyelesaian_gambar_url),
        penyelesaian_gambar_base64 = COALESCE($16, penyelesaian_gambar_base64)
       WHERE id = $11 RETURNING *`,
      [
        body.nomor_soal, body.tipe, body.pertanyaan, body.pertanyaan_html,
        body.gambar_url, body.gambar_base64, body.equation, body.equation_latex,
        body.panduan_essay, body.bobot, req.params.soalId,
        body.kode_soal ?? null, body.penyelesaian ?? null, body.penyelesaian_html ?? null,
        body.penyelesaian_gambar_url ?? null, body.penyelesaian_gambar_base64 ?? null,
      ]
    )
    if (!result.rows[0]) {
      await client.query('ROLLBACK')
      return res.status(404).json({ success: false, error: 'Soal tidak ditemukan' })
    }

    if (body.opsi) {
      await client.query('DELETE FROM opsi_jawaban WHERE soal_id = $1', [req.params.soalId])
      for (const opsi of body.opsi) {
        await client.query(
          'INSERT INTO opsi_jawaban (soal_id, huruf, teks, teks_html, is_benar) VALUES ($1,$2,$3,$4,$5)',
          [req.params.soalId, opsi.huruf, opsi.teks, opsi.teks_html ?? null, opsi.is_benar]
        )
      }
    }

    await client.query('COMMIT')

    const enriched = await pool.query(
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
        WHERE s.id = $1
        GROUP BY s.id`,
      [req.params.soalId]
    )

    res.json({ success: true, data: enriched.rows[0] })
  } catch (err) {
    await client.query('ROLLBACK')
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message, code: 'VALIDATION_ERROR' })
    }
    logger.error('[soal/:soalId PUT]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  } finally {
    client.release()
  }
})

// DELETE /soal/:soalId
router.delete('/:soalId', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM soal WHERE id = $1', [req.params.soalId])
    res.json({ success: true, data: null, message: 'Soal dihapus' })
  } catch (err) {
    logger.error('[soal/:soalId DELETE]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
