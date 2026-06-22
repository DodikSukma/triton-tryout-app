import { Router, Request, Response } from 'express'
import { z } from 'zod'
import multer from 'multer'
import mammoth from 'mammoth'
import pool from '../db/pool'
import logger from '../lib/logger'
import { parseDocxHtml } from '../lib/docxParser'
import { auditLog } from '../lib/audit'

const router = Router()

// In-memory upload for .docx batch import (mammoth reads the buffer directly).
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } })

const TryoutSchema = z.object({
  nama_tryout: z.string().min(1),
  mata_pelajaran: z.string().min(1),
  sub_mata_pelajaran: z.string().optional().nullable(),
  kelas: z.string().optional().nullable(),
  durasi_menit: z.number().int().positive().default(90),
  randomize_questions: z.boolean().optional(),
  randomize_options: z.boolean().optional(),
  is_super_tryout: z.boolean().optional(), // TRN-10: compiled by admin-soal
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
  // TRN-10: question code + solution/explanation
  kode_soal: z.string().optional().nullable(),
  penyelesaian: z.string().optional().nullable(),
  penyelesaian_html: z.string().optional().nullable(),
  penyelesaian_gambar_url: z.string().optional().nullable(),
  penyelesaian_gambar_base64: z.string().optional().nullable(),
  opsi: z.array(OpsiSchema).optional(),
})

// TRN-10: admins and question-bank admins see/manage every tryout.
const ADMIN_ROLES = new Set(['admin', 'admin-soal'])

// GET /tryouts — list tryouts (guru sees own, admin sees all)
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    const role = req.headers['x-user-role'] as string
    const seesAll = ADMIN_ROLES.has(role)
    const query = seesAll
      ? 'SELECT * FROM tryouts ORDER BY created_at DESC'
      : 'SELECT * FROM tryouts WHERE dibuat_oleh = $1 ORDER BY created_at DESC'
    const result = seesAll
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

// GET /tryouts/available — siswa: published only, scoped to the student's class.
// The gateway forwards the assigned class as x-user-class; tryouts with NULL
// kelas are universal (visible to every class in this level).
router.get('/available', async (req: Request, res: Response) => {
  try {
    const kelas = req.headers['x-user-class'] as string | undefined
    const params: unknown[] = []
    let classFilter = ''
    if (kelas) {
      classFilter = 'AND (t.kelas = $1 OR t.kelas IS NULL)'
      params.push(kelas)
    }
    const result = await pool.query(
      `SELECT t.*,
              COALESCE(s.soal_count, 0)::int  AS soal_count,
              COALESCE(s.total_bobot, 0)::int AS total_bobot
         FROM tryouts t
         LEFT JOIN (
           SELECT tryout_id, COUNT(*)::int AS soal_count, SUM(bobot)::int AS total_bobot
             FROM soal GROUP BY tryout_id
         ) s ON s.tryout_id = t.id
        WHERE t.status = 'published' ${classFilter}
        ORDER BY t.created_at DESC`,
      params
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
    const role = req.headers['x-user-role'] as string
    const body = TryoutSchema.parse(req.body)
    // TRN-14: Super Tryouts (or anything created by admin-soal) skip the teacher
    // approval workflow and go live immediately.
    const defaultStatus = (body.is_super_tryout || role === 'admin-soal') ? 'published' : 'draft'
    const result = await pool.query(
      `INSERT INTO tryouts
         (nama_tryout, mata_pelajaran, sub_mata_pelajaran, kelas, durasi_menit, dibuat_oleh,
          randomize_questions, randomize_options, is_super_tryout, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        body.nama_tryout, body.mata_pelajaran, body.sub_mata_pelajaran ?? null, body.kelas ?? null,
        body.durasi_menit, guruId, body.randomize_questions ?? true, body.randomize_options ?? true,
        body.is_super_tryout ?? false, defaultStatus,
      ]
    )
    auditLog(req, {
      action: 'TRYOUT_CREATE',
      target_id: result.rows[0].id,
      description: `Guru created draft tryout '${result.rows[0].nama_tryout}'`,
    })
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
      // Hide answer keys, grading guides, and solutions while taking the exam.
      soal = soal.map((s) => ({
        ...s,
        panduan_essay: null,
        penyelesaian: null,
        penyelesaian_html: null,
        penyelesaian_gambar_url: null,
        penyelesaian_gambar_base64: null,
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
        nama_tryout         = COALESCE($1, nama_tryout),
        mata_pelajaran      = COALESCE($2, mata_pelajaran),
        sub_mata_pelajaran  = COALESCE($3, sub_mata_pelajaran),
        kelas               = COALESCE($4, kelas),
        durasi_menit        = COALESCE($5, durasi_menit),
        randomize_questions = COALESCE($6, randomize_questions),
        randomize_options   = COALESCE($7, randomize_options),
        updated_at          = NOW()
       WHERE id = $8 RETURNING *`,
      [
        body.nama_tryout, body.mata_pelajaran, body.sub_mata_pelajaran, body.kelas,
        body.durasi_menit, body.randomize_questions ?? null, body.randomize_options ?? null, req.params.id,
      ]
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

// Approval-workflow status transition shared by /status and legacy /publish.
const StatusSchema = z.object({
  status: z.enum(['draft', 'pending_approval', 'approved', 'rejected', 'published', 'closed']),
  revision_notes: z.string().optional().nullable(),
})

// Statuses a guru may set on their own tryout. Everything else is admin-only.
const GURU_ALLOWED = new Set(['draft', 'pending_approval'])

async function handleStatusChange(req: Request, res: Response) {
  try {
    const role = req.headers['x-user-role'] as string
    const body = StatusSchema.parse(req.body)

    if (role === 'guru' && !GURU_ALLOWED.has(body.status)) {
      return res.status(403).json({
        success: false,
        error: 'Guru hanya dapat menyimpan draft atau mengajukan persetujuan.',
        code: 'FORBIDDEN_STATUS',
      })
    }

    // Revision notes only persist while a tryout is in the 'rejected' state.
    const notes = body.status === 'rejected' ? (body.revision_notes ?? null) : null

    const prev = await pool.query('SELECT status FROM tryouts WHERE id = $1', [req.params.id])
    const oldStatus = prev.rows[0]?.status

    const result = await pool.query(
      'UPDATE tryouts SET status = $1, revision_notes = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [body.status, notes, req.params.id]
    )
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Tryout tidak ditemukan' })

    // Audit the meaningful lifecycle transitions.
    const t = result.rows[0]
    const entry: [string, string] | null =
      body.status === 'pending_approval' ? ['TRYOUT_SUBMIT_REVIEW', `Guru submitted tryout '${t.nama_tryout}' for approval`]
      : body.status === 'approved'        ? ['TRYOUT_APPROVE', `Admin approved tryout '${t.nama_tryout}'`]
      : body.status === 'rejected'        ? ['TRYOUT_REJECT', `Admin requested revisions for tryout '${t.nama_tryout}': ${notes ?? ''}`]
      : body.status === 'published'       ? ['TRYOUT_PUBLISH', `Published tryout '${t.nama_tryout}'`]
      : body.status === 'draft' && oldStatus === 'published' ? ['TRYOUT_UNPUBLISH', `Unpublished tryout '${t.nama_tryout}'`]
      : null
    if (entry) auditLog(req, { action: entry[0], target_id: t.id, description: entry[1] })

    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const e = err.errors[0]
      return res.status(400).json({ success: false, error: `${e.path.join('.')}: ${e.message}`, code: 'VALIDATION_ERROR' })
    }
    logger.error('[tryouts/:id/status]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

// PATCH /tryouts/:id/status — full approval workflow transition (+ revision_notes)
router.patch('/:id/status', handleStatusChange)
// PATCH /tryouts/:id/publish — legacy alias (same role-aware logic)
router.patch('/:id/publish', handleStatusChange)

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
          gambar_url, gambar_base64, equation, equation_latex, panduan_essay, bobot,
          kode_soal, penyelesaian, penyelesaian_html, penyelesaian_gambar_url, penyelesaian_gambar_base64)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        req.params.id, nomor, body.tipe, body.pertanyaan, body.pertanyaan_html ?? null,
        body.gambar_url ?? null, body.gambar_base64 ?? null,
        body.equation ?? null, body.equation_latex ?? null,
        body.panduan_essay ?? null, body.bobot,
        body.kode_soal ?? null, body.penyelesaian ?? null, body.penyelesaian_html ?? null,
        body.penyelesaian_gambar_url ?? null, body.penyelesaian_gambar_base64 ?? null,
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

// POST /tryouts/:id/upload-docx — batch import questions from a Word (.docx) file.
// `?preview=true` parses and returns the extracted questions WITHOUT inserting.
router.post('/:id/upload-docx', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'File .docx tidak ditemukan.', code: 'NO_FILE' })
    }
    const preview = req.query.preview === 'true' || req.body?.preview === 'true'

    // Custom converter: inline embedded images as base64 data URIs.
    const options = {
      convertImage: mammoth.images.imgElement((image) =>
        image.read('base64').then((imageBuffer) => ({
          src: `data:${image.contentType};base64,${imageBuffer}`,
        }))
      ),
    }
    const { value: html } = await mammoth.convertToHtml({ buffer: req.file.buffer }, options)
    const parsed = parseDocxHtml(html)

    if (parsed.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tidak ada soal yang terbaca. Periksa format dokumen atau gunakan template.',
        code: 'EMPTY',
      })
    }

    // Preview mode: return the parsed questions (with per-question warnings) only.
    if (preview) {
      return res.json({ success: true, data: parsed, message: `${parsed.length} soal terbaca.` })
    }

    // Insert mode: reject if any question is invalid (every PG block needs
    // options and exactly one correct answer).
    const invalid = parsed.filter((s) => s.warning)
    if (invalid.length > 0) {
      return res.status(400).json({
        success: false,
        error: `${invalid.length} soal tidak valid. Contoh: ${invalid[0].warning}`,
        code: 'VALIDATION_ERROR',
        data: parsed,
      })
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const maxRes = await client.query(
        'SELECT COALESCE(MAX(nomor_soal),0) AS max FROM soal WHERE tryout_id = $1',
        [req.params.id]
      )
      let nomor = maxRes.rows[0].max as number

      for (const s of parsed) {
        nomor += 1
        const soalRes = await client.query(
          `INSERT INTO soal
             (tryout_id, nomor_soal, tipe, pertanyaan, pertanyaan_html,
              gambar_base64, equation, equation_latex, panduan_essay, bobot)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           RETURNING id`,
          [
            req.params.id, nomor, s.tipe, s.pertanyaan, s.pertanyaan_html,
            s.gambar_base64, s.equation, s.equation_latex, s.panduan_essay, s.bobot,
          ]
        )
        const soalId = soalRes.rows[0].id
        for (const o of s.opsi) {
          await client.query(
            'INSERT INTO opsi_jawaban (soal_id, huruf, teks, teks_html, is_benar) VALUES ($1,$2,$3,$4,$5)',
            [soalId, o.huruf, o.teks, o.teks, o.is_benar]
          )
        }
      }

      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }

    res.json({ success: true, message: `${parsed.length} questions uploaded successfully.`, data: null })
  } catch (err) {
    logger.error('[tryouts/:id/upload-docx]', { error: err })
    res.status(500).json({ success: false, error: 'Gagal memproses dokumen Word.' })
  }
})

// POST /tryouts/:id/import-questions — TRN-10: Super Try Out compilation.
// Clones the selected bank questions (with fresh ids) into this tryout so that
// editing/deleting the original teacher's question never affects the Super Tryout.
const ImportSchema = z.object({ questionIds: z.array(z.string().uuid()).min(1) })

router.post('/:id/import-questions', async (req: Request, res: Response) => {
  const client = await pool.connect()
  try {
    const { questionIds } = ImportSchema.parse(req.body)
    const targetId = req.params.id

    const target = await client.query('SELECT id FROM tryouts WHERE id = $1', [targetId])
    if (!target.rows[0]) return res.status(404).json({ success: false, error: 'Tryout tujuan tidak ditemukan' })

    const sourceRes = await client.query(
      `SELECT s.*,
              COALESCE(
                json_agg(json_build_object(
                  'huruf', o.huruf, 'teks', o.teks, 'teks_html', o.teks_html, 'is_benar', o.is_benar
                ) ORDER BY o.huruf) FILTER (WHERE o.id IS NOT NULL),
                '[]'::json
              ) AS opsi
         FROM soal s
         LEFT JOIN opsi_jawaban o ON o.soal_id = s.id
        WHERE s.id = ANY($1::uuid[])
        GROUP BY s.id`,
      [questionIds]
    )
    if (sourceRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Soal sumber tidak ditemukan' })
    }

    // Preserve the caller's selection order.
    const orderIndex = new Map(questionIds.map((id, i) => [id, i]))
    const sources = sourceRes.rows.sort(
      (a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0)
    )

    await client.query('BEGIN')
    const maxRes = await client.query(
      'SELECT COALESCE(MAX(nomor_soal),0) AS max FROM soal WHERE tryout_id = $1',
      [targetId]
    )
    let nomor = maxRes.rows[0].max as number
    let imported = 0

    for (const s of sources) {
      nomor += 1
      const ins = await client.query(
        `INSERT INTO soal
           (tryout_id, nomor_soal, tipe, pertanyaan, pertanyaan_html,
            gambar_url, gambar_base64, equation, equation_latex, panduan_essay, bobot,
            kode_soal, penyelesaian, penyelesaian_html, penyelesaian_gambar_url, penyelesaian_gambar_base64)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         RETURNING id`,
        [
          targetId, nomor, s.tipe, s.pertanyaan, s.pertanyaan_html,
          s.gambar_url, s.gambar_base64, s.equation, s.equation_latex, s.panduan_essay, s.bobot,
          s.kode_soal, s.penyelesaian, s.penyelesaian_html, s.penyelesaian_gambar_url, s.penyelesaian_gambar_base64,
        ]
      )
      const newId = ins.rows[0].id
      for (const o of s.opsi as { huruf: string; teks: string; teks_html: string | null; is_benar: boolean }[]) {
        await client.query(
          'INSERT INTO opsi_jawaban (soal_id, huruf, teks, teks_html, is_benar) VALUES ($1,$2,$3,$4,$5)',
          [newId, o.huruf, o.teks, o.teks_html ?? null, o.is_benar]
        )
      }
      imported += 1
    }
    await client.query('COMMIT')

    auditLog(req, {
      action: 'TRYOUT_IMPORT_QUESTIONS',
      target_id: targetId,
      description: `Imported ${imported} question(s) from Bank Soal into a Super Tryout`,
    })

    res.json({ success: true, data: { imported }, message: `${imported} soal diimpor.` })
  } catch (err) {
    await client.query('ROLLBACK').catch(() => null)
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message, code: 'VALIDATION_ERROR' })
    }
    logger.error('[tryouts/:id/import-questions]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  } finally {
    client.release()
  }
})

export default router
