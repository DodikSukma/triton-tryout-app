// Generates frontend/public/template-tryout.docx — the downloadable Word import
// template (also used as the parser test fixture). Run: node scripts/gen-template-docx.js
const fs = require('fs')
const path = require('path')
const { Document, Packer, Paragraph, TextRun, ImageRun } = require('docx')

// 1x1 PNG (so the second question carries an embedded image for extraction).
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
)

const p = (text) => new Paragraph({ children: [new TextRun(text)] })

const children = [
  p('[SOAL]'),
  p('Tipe: pilihan_ganda'),
  p('Bobot: 2'),
  p('Pertanyaan: Jika fungsi f ditentukan oleh $$f(x) = 2x^2 - 3x + 5$$, tentukan nilai dari $$f(3)$$!'),
  p('A. 11'),
  p('B. 12'),
  p('C. 13'),
  p('*D. 14'),
  p('E. 15'),
  p(''),

  p('[SOAL]'),
  p('Tipe: pilihan_ganda'),
  p('Bobot: 3'),
  p('Pertanyaan: Perhatikan gambar di bawah ini. Apakah jenis organel sel utama yang terdapat pada organ sel respirasinya?'),
  new Paragraph({
    children: [new ImageRun({ type: 'png', data: PNG_1x1, transformation: { width: 80, height: 80 } })],
  }),
  p('A. Kloroplas'),
  p('*B. Mitokondria'),
  p('C. Ribosom'),
  p('D. Lisosom'),
  p(''),

  p('[SOAL]'),
  p('Tipe: essay'),
  p('Bobot: 5'),
  p('Pertanyaan: Buktikan teorema Pythagoras $$a^2 + b^2 = c^2$$!'),
  p('Rubrik: Bukti matematis segitiga siku-siku dengan luas persegi pada sisi miring sama dengan jumlah luas persegi pada kedua sisi tegaknya.'),
]

const doc = new Document({ sections: [{ children }] })

Packer.toBuffer(doc).then((buf) => {
  const out = path.resolve(__dirname, '..', 'frontend', 'public', 'template-tryout.docx')
  fs.writeFileSync(out, buf)
  console.log(`Wrote ${out} (${buf.length} bytes)`)
})
