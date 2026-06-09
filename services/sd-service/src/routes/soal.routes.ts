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
  opsi: z.array(OpsiSchema).optional(),
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
        bobot           = COALESCE($10, bobot)
       WHERE id = $11 RETURNING *`,
      [
        body.nomor_soal, body.tipe, body.pertanyaan, body.pertanyaan_html,
        body.gambar_url, body.gambar_base64, body.equation, body.equation_latex,
        body.panduan_essay, body.bobot, req.params.soalId,
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
