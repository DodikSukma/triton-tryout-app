import { Router, Request, Response } from 'express'
import { z } from 'zod'
import pool from '../db/pool'
import logger from '../lib/logger'

const router = Router()

const SOAL_SERVICE_URL = process.env.SOAL_SERVICE_URL ?? 'http://localhost:4003'
const USER_SERVICE_URL = process.env.USER_SERVICE_URL ?? 'http://localhost:4002'

const StartSesiSchema = z.object({ tryout_id: z.string().uuid() })

const JawabSchema = z.object({
  soal_id: z.string().uuid(),
  jawaban_teks: z.string().optional(),
  opsi_id: z.string().uuid().optional(),
})

// POST /sesi — start or resume
router.post('/sesi', async (req: Request, res: Response) => {
  try {
    const siswaId = req.headers['x-user-id'] as string
    const body = StartSesiSchema.parse(req.body)

    const existing = await pool.query(
      'SELECT * FROM sesi_tryout WHERE siswa_id=$1 AND tryout_id=$2',
      [siswaId, body.tryout_id]
    )

    if (existing.rows[0]) {
      const s = existing.rows[0]
      if (s.status === 'selesai') {
        return res.status(409).json({
          success: false,
          error: 'Tryout sudah dikerjakan dan tidak dapat diulang.',
          code: 'ALREADY_COMPLETED',
        })
      }
      return res.json({ success: true, data: s, message: 'Melanjutkan sesi yang sudah ada' })
    }

    const created = await pool.query(
      'INSERT INTO sesi_tryout (siswa_id, tryout_id) VALUES ($1,$2) RETURNING *',
      [siswaId, body.tryout_id]
    )
    res.status(201).json({ success: true, data: created.rows[0] })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message, code: 'VALIDATION_ERROR' })
    }
    logger.error('[sesi/create]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// GET /sesi/by-tryout/:tryoutId — check existing sesi for current siswa
router.get('/sesi/by-tryout/:tryoutId', async (req: Request, res: Response) => {
  try {
    const siswaId = req.headers['x-user-id'] as string
    const result = await pool.query(
      'SELECT * FROM sesi_tryout WHERE siswa_id=$1 AND tryout_id=$2',
      [siswaId, req.params.tryoutId]
    )
    res.json({ success: true, data: result.rows[0] ?? null })
  } catch (err) {
    logger.error('[sesi/by-tryout/:tryoutId]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// GET /sesi/:sesiId — sesi + answers keyed by soal_id
router.get('/sesi/:sesiId', async (req: Request, res: Response) => {
  try {
    const siswaId = req.headers['x-user-id'] as string
    const sesi = await pool.query('SELECT * FROM sesi_tryout WHERE id = $1', [req.params.sesiId])
    if (!sesi.rows[0]) return res.status(404).json({ success: false, error: 'Sesi tidak ditemukan' })
    if (sesi.rows[0].siswa_id !== siswaId) {
      return res.status(403).json({ success: false, error: 'Tidak diizinkan' })
    }

    const jawaban = await pool.query(
      'SELECT soal_id, opsi_id, jawaban_teks FROM jawaban WHERE sesi_id = $1',
      [req.params.sesiId]
    )

    const answers: Record<string, { opsi_id: string | null; jawaban_teks: string | null }> = {}
    for (const j of jawaban.rows) {
      answers[j.soal_id] = { opsi_id: j.opsi_id, jawaban_teks: j.jawaban_teks }
    }

    res.json({ success: true, data: { sesi: sesi.rows[0], answers } })
  } catch (err) {
    logger.error('[sesi/:sesiId]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// POST /sesi/:sesiId/jawab — upsert one answer
router.post('/sesi/:sesiId/jawab', async (req: Request, res: Response) => {
  try {
    const siswaId = req.headers['x-user-id'] as string
    const body = JawabSchema.parse(req.body)

    const sesi = await pool.query('SELECT * FROM sesi_tryout WHERE id = $1', [req.params.sesiId])
    if (!sesi.rows[0]) return res.status(404).json({ success: false, error: 'Sesi tidak ditemukan' })
    if (sesi.rows[0].siswa_id !== siswaId) {
      return res.status(403).json({ success: false, error: 'Tidak diizinkan' })
    }
    if (sesi.rows[0].status !== 'berlangsung') {
      return res.status(400).json({ success: false, error: 'Sesi sudah selesai, tidak dapat menjawab.' })
    }

    const result = await pool.query(
      `INSERT INTO jawaban (sesi_id, soal_id, jawaban_teks, opsi_id)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (sesi_id, soal_id) DO UPDATE SET
         jawaban_teks = EXCLUDED.jawaban_teks,
         opsi_id      = EXCLUDED.opsi_id,
         updated_at   = NOW()
       RETURNING *`,
      [req.params.sesiId, body.soal_id, body.jawaban_teks ?? null, body.opsi_id ?? null]
    )
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors[0].message, code: 'VALIDATION_ERROR' })
    }
    logger.error('[sesi/:sesiId/jawab]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

interface SoalRow {
  id: string
  tipe: 'pilihan_ganda' | 'essay'
  bobot: number
  opsi: { id: string; is_benar: boolean }[]
}

// POST /sesi/:sesiId/selesai — finish + auto-score
router.post('/sesi/:sesiId/selesai', async (req: Request, res: Response) => {
  const client = await pool.connect()
  try {
    const siswaId = req.headers['x-user-id'] as string
    const sesi = await client.query('SELECT * FROM sesi_tryout WHERE id = $1', [req.params.sesiId])
    if (!sesi.rows[0]) return res.status(404).json({ success: false, error: 'Sesi tidak ditemukan' })
    if (sesi.rows[0].siswa_id !== siswaId) {
      return res.status(403).json({ success: false, error: 'Tidak diizinkan' })
    }
    if (sesi.rows[0].status !== 'berlangsung') {
      const existing = await client.query('SELECT * FROM hasil WHERE sesi_id = $1', [req.params.sesiId])
      return res.json({ success: true, data: existing.rows[0] ?? null, message: 'Sesi sudah selesai' })
    }

    const tryoutId = sesi.rows[0].tryout_id

    // Use 'admin' role for service-to-service scoring call so is_benar is NOT stripped
    const soalRes = await fetch(`${SOAL_SERVICE_URL}/tryouts/${tryoutId}`, {
      headers: { 'x-user-id': siswaId, 'x-user-role': 'admin' },
    })
    if (!soalRes.ok) throw new Error('Gagal mengambil data soal')
    const soalJson = (await soalRes.json()) as { success: boolean; data: { soal: SoalRow[] } }
    const soalList: SoalRow[] = soalJson.data?.soal ?? []

    const answersRes = await client.query(
      'SELECT soal_id, opsi_id FROM jawaban WHERE sesi_id = $1',
      [req.params.sesiId]
    )
    const answersMap = new Map<string, string | null>()
    for (const a of answersRes.rows) answersMap.set(a.soal_id, a.opsi_id)

    let totalBobot = 0
    let bobotBenar = 0
    let totalBenar = 0
    for (const s of soalList) {
      totalBobot += s.bobot
      if (s.tipe !== 'pilihan_ganda') continue
      const correctOpsi = s.opsi.find((o) => o.is_benar)
      const studentOpsi = answersMap.get(s.id)
      if (correctOpsi && studentOpsi === correctOpsi.id) {
        bobotBenar += s.bobot
        totalBenar += 1
      }
    }

    const nilai = totalBobot > 0 ? (bobotBenar / totalBobot) * 100 : 0

    await client.query('BEGIN')

    await client.query(
      "UPDATE sesi_tryout SET status = 'selesai', selesai_at = NOW() WHERE id = $1",
      [req.params.sesiId]
    )

    const hasil = await client.query(
      `INSERT INTO hasil (sesi_id, siswa_id, tryout_id, total_benar, total_soal, nilai)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (sesi_id) DO UPDATE SET
         total_benar = EXCLUDED.total_benar,
         total_soal  = EXCLUDED.total_soal,
         nilai       = EXCLUDED.nilai,
         dihitung_at = NOW()
       RETURNING *`,
      [req.params.sesiId, siswaId, tryoutId, totalBenar, soalList.length, nilai.toFixed(2)]
    )

    await client.query('COMMIT')
    res.json({ success: true, data: hasil.rows[0] })
  } catch (err) {
    await client.query('ROLLBACK').catch(() => null)
    logger.error('[sesi/:sesiId/selesai]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  } finally {
    client.release()
  }
})

// GET /hasil/counts?tryout_ids=id1,id2,... — internal: batch peserta counts per tryout
// MUST be before /hasil/:sesiId to avoid Express treating 'counts' as a sesiId param
router.get('/hasil/counts', async (req: Request, res: Response) => {
  try {
    const idsParam = req.query.tryout_ids as string | undefined
    if (!idsParam) return res.json({ success: true, data: {} })
    const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean)
    if (ids.length === 0) return res.json({ success: true, data: {} })
    const result = await pool.query(
      'SELECT tryout_id::text, COUNT(*)::int AS jumlah FROM hasil WHERE tryout_id = ANY($1::uuid[]) GROUP BY tryout_id',
      [ids]
    )
    const counts: Record<string, number> = {}
    for (const row of result.rows) counts[row.tryout_id] = row.jumlah
    res.json({ success: true, data: counts })
  } catch (err) {
    logger.error('[hasil/counts]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

interface SoalDetail {
  id: string
  tipe: string
  bobot: number
  pertanyaan: string
  pertanyaan_html: string | null
  gambar_base64: string | null
  opsi: { id: string; huruf: string; teks: string; teks_html: string | null; is_benar: boolean }[]
}

// GET /hasil/:sesiId — full result with per-question detail
router.get('/hasil/:sesiId', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    const role = req.headers['x-user-role'] as string

    const hasil = await pool.query('SELECT * FROM hasil WHERE sesi_id = $1', [req.params.sesiId])
    if (!hasil.rows[0]) return res.status(404).json({ success: false, error: 'Hasil tidak ditemukan' })

    const sesi = await pool.query('SELECT * FROM sesi_tryout WHERE id = $1', [req.params.sesiId])
    if (role !== 'guru' && role !== 'admin' && sesi.rows[0].siswa_id !== userId) {
      return res.status(403).json({ success: false, error: 'Tidak diizinkan' })
    }

    // For hasil view, fetch with admin role so we have full opsi info (including is_benar) for marking
    const soalRes = await fetch(`${SOAL_SERVICE_URL}/tryouts/${hasil.rows[0].tryout_id}`, {
      headers: { 'x-user-id': userId, 'x-user-role': 'admin' },
    })
    const soalJson = (await soalRes.json()) as { success: boolean; data: { soal: SoalDetail[]; nama_tryout: string; mata_pelajaran: string; durasi_menit: number; id: string } }
    const tryout = soalJson.data
    const soalList = tryout?.soal ?? []

    const answers = await pool.query(
      'SELECT soal_id, opsi_id, jawaban_teks FROM jawaban WHERE sesi_id = $1',
      [req.params.sesiId]
    )
    const ansMap = new Map<string, { opsi_id: string | null; jawaban_teks: string | null }>()
    for (const a of answers.rows) {
      ansMap.set(a.soal_id, { opsi_id: a.opsi_id, jawaban_teks: a.jawaban_teks })
    }

    const detail = soalList.map((s: SoalDetail) => {
      const studentAns = ansMap.get(s.id) ?? null
      const correctOpsi = s.opsi.find((o) => o.is_benar) ?? null
      const studentOpsi = studentAns?.opsi_id ? s.opsi.find((o) => o.id === studentAns.opsi_id) : null
      const isCorrect =
        s.tipe === 'pilihan_ganda' && !!correctOpsi && studentAns?.opsi_id === correctOpsi.id
      const isSkipped = !studentAns?.opsi_id && !studentAns?.jawaban_teks
      return {
        soal: s,
        student_answer: studentAns,
        student_opsi: studentOpsi,
        correct_opsi: correctOpsi,
        is_correct: isCorrect,
        is_skipped: isSkipped,
      }
    })

    res.json({
      success: true,
      data: {
        hasil: hasil.rows[0],
        sesi: sesi.rows[0],
        tryout: tryout
          ? {
              id: tryout.id,
              nama_tryout: tryout.nama_tryout,
              mata_pelajaran: tryout.mata_pelajaran,
              durasi_menit: tryout.durasi_menit,
            }
          : null,
        detail,
      },
    })
  } catch (err) {
    logger.error('[hasil/:sesiId]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// GET /hasil/tryout/:tryoutId — siswa's own hasil for one tryout
router.get('/hasil/tryout/:tryoutId', async (req: Request, res: Response) => {
  try {
    const siswaId = req.headers['x-user-id'] as string
    const result = await pool.query(
      'SELECT * FROM hasil WHERE tryout_id = $1 AND siswa_id = $2',
      [req.params.tryoutId, siswaId]
    )
    res.json({ success: true, data: result.rows[0] ?? null })
  } catch (err) {
    logger.error('[hasil/tryout/:tryoutId]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// GET /hasil/rekap/:tryoutId — guru/admin: enriched recap of all students for one tryout
// Does NOT call soal-service; tryout meta is fetched separately by the frontend.
router.get('/hasil/rekap/:tryoutId', async (req: Request, res: Response) => {
  try {
    const role = req.headers['x-user-role'] as string

    if (role !== 'guru' && role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden' })
    }

    // 1. Fetch hasil rows joined with sesi for timing info
    const hasilRows = await pool.query<{
      siswa_id: string
      nilai: string
      total_benar: number
      total_soal: number
      mulai_at: string
      selesai_at: string | null
      durasi_menit: number | null
    }>(
      `SELECT h.siswa_id, h.nilai, h.total_benar, h.total_soal,
              s.mulai_at, s.selesai_at,
              ROUND(EXTRACT(EPOCH FROM (s.selesai_at - s.mulai_at)) / 60)::int AS durasi_menit
         FROM hasil h
         JOIN sesi_tryout s ON s.id = h.sesi_id
        WHERE h.tryout_id = $1
        ORDER BY h.nilai DESC NULLS LAST`,
      [req.params.tryoutId]
    )

    if (hasilRows.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          summary: { total_peserta: 0, rata_rata_nilai: 0, nilai_tertinggi: 0, nilai_terendah: 0 },
          hasil: [],
        },
      })
    }

    // 2. Fetch siswa profiles in parallel from user-service
    const siswaIds = [...new Set(hasilRows.rows.map((r) => r.siswa_id))]
    const profileEntries = await Promise.all(
      siswaIds.map(async (id) => {
        try {
          const pRes = await fetch(`${USER_SERVICE_URL}/users/${id}`)
          const pJson = (await pRes.json()) as { success: boolean; data?: { nama_lengkap: string; kelas: string | null } }
          return [id, pJson.success && pJson.data ? pJson.data : null] as const
        } catch {
          return [id, null] as const
        }
      })
    )
    const profileMap = new Map(profileEntries)

    // 3. Compute summary
    const nilaiList = hasilRows.rows.map((r) => parseFloat(r.nilai) || 0)
    const summary = {
      total_peserta:   hasilRows.rows.length,
      rata_rata_nilai: parseFloat((nilaiList.reduce((a, b) => a + b, 0) / nilaiList.length).toFixed(2)),
      nilai_tertinggi: Math.max(...nilaiList),
      nilai_terendah:  Math.min(...nilaiList),
    }

    const hasil = hasilRows.rows.map((r) => {
      const profile = profileMap.get(r.siswa_id)
      return {
        siswa_id:     r.siswa_id,
        nama_siswa:   profile?.nama_lengkap ?? 'Siswa',
        kelas:        profile?.kelas        ?? '—',
        nilai:        parseFloat(r.nilai) || 0,
        total_benar:  r.total_benar,
        total_soal:   r.total_soal,
        selesai_at:   r.selesai_at,
        durasi_menit: r.durasi_menit,
      }
    })

    res.json({ success: true, data: { summary, hasil } })
  } catch (err) {
    logger.error('[hasil/rekap/:tryoutId]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// GET /riwayat — siswa: all sessions
router.get('/riwayat', async (req: Request, res: Response) => {
  try {
    const siswaId = req.headers['x-user-id'] as string
    const result = await pool.query(
      `SELECT s.id AS sesi_id, s.tryout_id, s.mulai_at, s.selesai_at, s.status,
              h.nilai, h.total_benar, h.total_soal
         FROM sesi_tryout s
         LEFT JOIN hasil h ON h.sesi_id = s.id
        WHERE s.siswa_id = $1
        ORDER BY s.mulai_at DESC`,
      [siswaId]
    )
    res.json({ success: true, data: result.rows })
  } catch (err) {
    logger.error('[riwayat]', { error: err })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
