// Parses mammoth-converted Word HTML into structured questions following the
// Triton import template:
//
//   [SOAL]
//   Tipe: pilihan_ganda | essay
//   Bobot: <int>
//   Pertanyaan: <text, may contain $$latex$$ / $latex$ and an inline image>
//   A. ...
//   *B. ...        (the * prefix marks the correct option)
//   C. ...
//   Rubrik: <essay grading guide>           (essay only)
//
// The function is pure (HTML in → questions out) so it can be unit-tested
// without a real .docx or a running mammoth.

export interface ParsedOpsi {
  huruf: string
  teks: string
  is_benar: boolean
}

export interface ParsedSoal {
  tipe: 'pilihan_ganda' | 'essay'
  bobot: number
  pertanyaan: string
  pertanyaan_html: string
  equation: string | null
  equation_latex: string | null
  gambar_base64: string | null
  panduan_essay: string | null
  opsi: ParsedOpsi[]
  warning?: string
}

const IMG_MARKER = '@@TRITON_IMG@@'

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&amp;/g, '&')
}

// First LaTeX equation in the text. Block ($$…$$) preferred over inline ($…$).
export function extractEquation(text: string): string | null {
  const block = text.match(/\$\$([\s\S]+?)\$\$/)
  if (block) return block[1].trim()
  const inline = text.match(/\$([^$\n]+?)\$/)
  if (inline) return inline[1].trim()
  return null
}

export function parseDocxHtml(html: string): ParsedSoal[] {
  // 1. Pull base64 images out into an ordered queue, leaving a marker in place.
  const images: string[] = []
  let work = html.replace(/<img\b[^>]*\bsrc="(data:[^"]+)"[^>]*>/gi, (_m, src: string) => {
    images.push(src)
    return `\n${IMG_MARKER}\n`
  })

  // 2. Block-level tags → newlines, strip the rest, decode entities.
  work = work
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
  work = decodeEntities(work)

  const lines = work.split('\n').map((l) => l.trim())

  // 3. Group lines into [SOAL] blocks.
  const blocks: string[][] = []
  let current: string[] | null = null
  for (const line of lines) {
    if (/^\[SOAL\]$/i.test(line)) {
      current = []
      blocks.push(current)
      continue
    }
    if (current && line !== '') current.push(line)
  }

  // 4. Parse each block.
  let imgCursor = 0
  const soalList: ParsedSoal[] = []

  for (const block of blocks) {
    let tipe: 'pilihan_ganda' | 'essay' = 'pilihan_ganda'
    let bobot = 1
    let pertanyaan = ''
    let rubrik = ''
    let gambar: string | null = null
    const opsi: ParsedOpsi[] = []
    let mode: 'question' | 'rubrik' | 'none' = 'none'

    for (const line of block) {
      if (line === IMG_MARKER) {
        gambar = images[imgCursor++] ?? gambar
        continue
      }
      const mTipe = line.match(/^Tipe\s*:\s*(.+)$/i)
      if (mTipe) { tipe = /essay/i.test(mTipe[1]) ? 'essay' : 'pilihan_ganda'; mode = 'none'; continue }

      const mBobot = line.match(/^Bobot\s*:\s*(\d+)/i)
      if (mBobot) { bobot = parseInt(mBobot[1], 10) || 1; mode = 'none'; continue }

      const mPert = line.match(/^Pertanyaan\s*:\s*(.*)$/i)
      if (mPert) { pertanyaan = mPert[1].trim(); mode = 'question'; continue }

      const mRubrik = line.match(/^Rubrik\s*:\s*(.*)$/i)
      if (mRubrik) { rubrik = mRubrik[1].trim(); mode = 'rubrik'; continue }

      const mOpsi = line.match(/^(\*?)\s*([A-Ea-e])[.)]\s*(.+)$/)
      if (mOpsi) {
        opsi.push({ huruf: mOpsi[2].toUpperCase(), teks: mOpsi[3].trim(), is_benar: mOpsi[1] === '*' })
        mode = 'none'
        continue
      }

      // Continuation of a multi-line question / rubric.
      if (mode === 'question') pertanyaan = pertanyaan ? `${pertanyaan} ${line}` : line
      else if (mode === 'rubrik') rubrik = rubrik ? `${rubrik} ${line}` : line
    }

    if (!pertanyaan && opsi.length === 0 && !rubrik) continue

    const latex = extractEquation(pertanyaan)

    let warning: string | undefined
    if (tipe === 'pilihan_ganda') {
      const correctCount = opsi.filter((o) => o.is_benar).length
      if (opsi.length < 2) warning = 'Pilihan ganda perlu minimal 2 opsi (A–E).'
      else if (correctCount !== 1) warning = 'Harus ada tepat satu jawaban benar (tandai dengan *).'
    }

    soalList.push({
      tipe,
      bobot,
      pertanyaan,
      // Keep math delimiters so the frontend (KaTeX) renders them. The image is
      // stored separately in gambar_base64, never inlined into the paragraph.
      pertanyaan_html: pertanyaan,
      equation: latex,
      equation_latex: latex,
      gambar_base64: gambar,
      panduan_essay: tipe === 'essay' ? (rubrik || null) : null,
      opsi: tipe === 'pilihan_ganda' ? opsi : [],
      warning,
    })
  }

  return soalList
}
