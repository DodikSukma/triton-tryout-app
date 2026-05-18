# AI SOAL BUILDER — Static Demo Presets
# For demo purposes, these are static JSON presets that simulate AI generation.
# In production, replace the static JSON with real API calls to an LLM.

---

## IMPLEMENTATION GUIDE

### How the feature works (demo mode):
1. Guru clicks "Generate dengan AI" in question builder
2. Modal opens: select subject + quantity (1 or 5 questions)
3. Click "Generate" → simulate loading (1.5 seconds delay)
4. Return static JSON from presets below
5. Display questions for review/edit before saving
6. Guru can edit any field, then click "Simpan Semua"
7. All questions saved to DB via batch POST

### Component: `AIQuestionGeneratorModal.tsx`
```tsx
// State:
// subject: 'matematika' | 'fisika' | 'biologi'
// quantity: 1 | 5
// isGenerating: boolean (shows fake loading)
// generatedQuestions: Question[]
// editingIndex: number | null

// On "Generate" click:
// 1. setIsGenerating(true)
// 2. await new Promise(r => setTimeout(r, 1500)) // simulate API
// 3. const preset = AI_PRESETS[subject][quantity === 5 ? 'set_5' : 'set_1']
// 4. setGeneratedQuestions(preset)
// 5. setIsGenerating(false)
```

---

## STATIC PRESETS

### MATEMATIKA — 1 Soal

```json
[
  {
    "tipe": "pilihan_ganda",
    "pertanyaan_html": "Diketahui fungsi <strong>f(x) = 2x² + 3x - 5</strong>. Nilai dari <strong>f(3)</strong> adalah...",
    "equation_latex": "f(3) = 2(3)^2 + 3(3) - 5",
    "bobot": 2,
    "opsi": [
      { "huruf": "A", "teks_html": "16", "is_benar": false },
      { "huruf": "B", "teks_html": "22", "is_benar": false },
      { "huruf": "C", "teks_html": "26", "is_benar": true },
      { "huruf": "D", "teks_html": "28", "is_benar": false },
      { "huruf": "E", "teks_html": "30", "is_benar": false }
    ],
    "panduan_essay": null
  }
]
```

### MATEMATIKA — 5 Soal

```json
[
  {
    "tipe": "pilihan_ganda",
    "pertanyaan_html": "Nilai dari <strong>lim<sub>x→2</sub> (x² - 4) / (x - 2)</strong> adalah...",
    "equation_latex": "\\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2}",
    "bobot": 2,
    "opsi": [
      { "huruf": "A", "teks_html": "0", "is_benar": false },
      { "huruf": "B", "teks_html": "2", "is_benar": false },
      { "huruf": "C", "teks_html": "4", "is_benar": true },
      { "huruf": "D", "teks_html": "6", "is_benar": false },
      { "huruf": "E", "teks_html": "8", "is_benar": false }
    ],
    "panduan_essay": null
  },
  {
    "tipe": "pilihan_ganda",
    "pertanyaan_html": "Turunan pertama dari <strong>f(x) = 3x³ - 4x² + 2x - 7</strong> adalah...",
    "equation_latex": "f'(x) = ?",
    "bobot": 2,
    "opsi": [
      { "huruf": "A", "teks_html": "9x² - 8x + 2", "is_benar": true },
      { "huruf": "B", "teks_html": "9x² - 8x - 2", "is_benar": false },
      { "huruf": "C", "teks_html": "3x² - 4x + 2", "is_benar": false },
      { "huruf": "D", "teks_html": "9x² + 8x + 2", "is_benar": false },
      { "huruf": "E", "teks_html": "6x² - 8x + 2", "is_benar": false }
    ],
    "panduan_essay": null
  },
  {
    "tipe": "pilihan_ganda",
    "pertanyaan_html": "Hasil dari integral <strong>∫(4x³ - 6x) dx</strong> adalah...",
    "equation_latex": "\\int (4x^3 - 6x)\\,dx",
    "bobot": 3,
    "opsi": [
      { "huruf": "A", "teks_html": "x⁴ - 3x² + C", "is_benar": true },
      { "huruf": "B", "teks_html": "4x⁴ - 6x² + C", "is_benar": false },
      { "huruf": "C", "teks_html": "x⁴ - 3x + C", "is_benar": false },
      { "huruf": "D", "teks_html": "12x² - 6 + C", "is_benar": false },
      { "huruf": "E", "teks_html": "x⁴ + 3x² + C", "is_benar": false }
    ],
    "panduan_essay": null
  },
  {
    "tipe": "pilihan_ganda",
    "pertanyaan_html": "Persamaan kuadrat <strong>2x² - 5x - 3 = 0</strong> memiliki akar-akar x₁ dan x₂. Nilai dari <strong>x₁ · x₂</strong> adalah...",
    "equation_latex": "2x^2 - 5x - 3 = 0",
    "bobot": 2,
    "opsi": [
      { "huruf": "A", "teks_html": "-3", "is_benar": false },
      { "huruf": "B", "teks_html": "3/2", "is_benar": false },
      { "huruf": "C", "teks_html": "-3/2", "is_benar": true },
      { "huruf": "D", "teks_html": "5/2", "is_benar": false },
      { "huruf": "E", "teks_html": "-5/2", "is_benar": false }
    ],
    "panduan_essay": null
  },
  {
    "tipe": "essay",
    "pertanyaan_html": "Sebuah peluru ditembakkan vertikal ke atas dengan kecepatan awal <strong>v₀ = 40 m/s</strong>. Jika percepatan gravitasi <strong>g = 10 m/s²</strong>, tentukan:<br/><br/>a) Waktu yang diperlukan peluru untuk mencapai titik tertinggi<br/>b) Ketinggian maksimum yang dicapai peluru<br/>c) Waktu total peluru berada di udara",
    "equation_latex": "v_0 = 40 \\text{ m/s}, \\quad g = 10 \\text{ m/s}^2",
    "bobot": 5,
    "opsi": [],
    "panduan_essay": "a) t = v₀/g = 40/10 = 4 detik\nb) h_max = v₀²/(2g) = 1600/20 = 80 meter\nc) t_total = 2t = 8 detik\n\nRubrik: a=2pts, b=2pts, c=1pt"
  }
]
```

---

### FISIKA — 1 Soal

```json
[
  {
    "tipe": "pilihan_ganda",
    "pertanyaan_html": "Sebuah benda bermassa <strong>5 kg</strong> dikenai gaya sebesar <strong>20 N</strong>. Berapakah percepatan yang dialami benda tersebut? (Gunakan Hukum Newton II: <em>F = ma</em>)",
    "equation_latex": "F = ma \\Rightarrow a = \\frac{F}{m} = \\frac{20}{5}",
    "bobot": 2,
    "opsi": [
      { "huruf": "A", "teks_html": "2 m/s²", "is_benar": false },
      { "huruf": "B", "teks_html": "4 m/s²", "is_benar": true },
      { "huruf": "C", "teks_html": "5 m/s²", "is_benar": false },
      { "huruf": "D", "teks_html": "10 m/s²", "is_benar": false },
      { "huruf": "E", "teks_html": "100 m/s²", "is_benar": false }
    ],
    "panduan_essay": null
  }
]
```

### FISIKA — 5 Soal

```json
[
  {
    "tipe": "pilihan_ganda",
    "pertanyaan_html": "Sebuah benda bergerak dengan kecepatan awal <strong>10 m/s</strong> dan mengalami perlambatan <strong>2 m/s²</strong>. Berapa jarak yang ditempuh benda hingga berhenti?",
    "equation_latex": "v^2 = v_0^2 - 2as \\Rightarrow s = \\frac{v_0^2}{2a}",
    "bobot": 2,
    "opsi": [
      { "huruf": "A", "teks_html": "20 m", "is_benar": false },
      { "huruf": "B", "teks_html": "25 m", "is_benar": true },
      { "huruf": "C", "teks_html": "30 m", "is_benar": false },
      { "huruf": "D", "teks_html": "40 m", "is_benar": false },
      { "huruf": "E", "teks_html": "50 m", "is_benar": false }
    ],
    "panduan_essay": null
  },
  {
    "tipe": "pilihan_ganda",
    "pertanyaan_html": "Sebuah pegas dengan konstanta pegas <strong>k = 200 N/m</strong> ditarik sejauh <strong>x = 0,05 m</strong>. Berapakah energi potensial pegas tersebut?",
    "equation_latex": "E_p = \\frac{1}{2}kx^2 = \\frac{1}{2}(200)(0{,}05)^2",
    "bobot": 2,
    "opsi": [
      { "huruf": "A", "teks_html": "0,05 J", "is_benar": false },
      { "huruf": "B", "teks_html": "0,25 J", "is_benar": true },
      { "huruf": "C", "teks_html": "0,5 J", "is_benar": false },
      { "huruf": "D", "teks_html": "2,5 J", "is_benar": false },
      { "huruf": "E", "teks_html": "5 J", "is_benar": false }
    ],
    "panduan_essay": null
  },
  {
    "tipe": "pilihan_ganda",
    "pertanyaan_html": "Dua muatan listrik masing-masing <strong>q₁ = 2 μC</strong> dan <strong>q₂ = 4 μC</strong> terpisah sejauh <strong>r = 2 cm</strong>. Besar gaya Coulomb antara kedua muatan adalah... (k = 9×10⁹ Nm²/C²)",
    "equation_latex": "F = k\\frac{q_1 q_2}{r^2}",
    "bobot": 3,
    "opsi": [
      { "huruf": "A", "teks_html": "90 N", "is_benar": true },
      { "huruf": "B", "teks_html": "9 N", "is_benar": false },
      { "huruf": "C", "teks_html": "180 N", "is_benar": false },
      { "huruf": "D", "teks_html": "45 N", "is_benar": false },
      { "huruf": "E", "teks_html": "0,9 N", "is_benar": false }
    ],
    "panduan_essay": null
  },
  {
    "tipe": "pilihan_ganda",
    "pertanyaan_html": "Sebuah transformator memiliki kumparan primer <strong>N₁ = 1000 lilitan</strong> dan kumparan sekunder <strong>N₂ = 200 lilitan</strong>. Jika tegangan primer <strong>V₁ = 220 V</strong>, berapakah tegangan sekunder?",
    "equation_latex": "\\frac{V_2}{V_1} = \\frac{N_2}{N_1}",
    "bobot": 2,
    "opsi": [
      { "huruf": "A", "teks_html": "11 V", "is_benar": false },
      { "huruf": "B", "teks_html": "22 V", "is_benar": false },
      { "huruf": "C", "teks_html": "44 V", "is_benar": true },
      { "huruf": "D", "teks_html": "110 V", "is_benar": false },
      { "huruf": "E", "teks_html": "440 V", "is_benar": false }
    ],
    "panduan_essay": null
  },
  {
    "tipe": "essay",
    "pertanyaan_html": "Jelaskan perbedaan antara <strong>gelombang transversal</strong> dan <strong>gelombang longitudinal</strong>! Berikan masing-masing <strong>2 contoh</strong> dalam kehidupan sehari-hari dan jelaskan karakteristik utama masing-masing jenis gelombang.",
    "equation_latex": null,
    "bobot": 5,
    "opsi": [],
    "panduan_essay": "Gelombang Transversal: arah getar tegak lurus arah rambat. Contoh: gelombang cahaya, gelombang tali. Karakteristik: memiliki puncak dan lembah.\n\nGelombang Longitudinal: arah getar sejajar arah rambat. Contoh: gelombang bunyi, gelombang pegas. Karakteristik: memiliki rapatan dan regangan.\n\nRubrik: definisi=2pts, contoh=2pts, karakteristik=1pt"
  }
]
```

---

### BIOLOGI — 1 Soal

```json
[
  {
    "tipe": "pilihan_ganda",
    "pertanyaan_html": "Organel sel yang berperan sebagai <strong>pusat respirasi seluler</strong> dan penghasil energi dalam bentuk ATP adalah...",
    "equation_latex": null,
    "bobot": 2,
    "opsi": [
      { "huruf": "A", "teks_html": "Ribosom", "is_benar": false },
      { "huruf": "B", "teks_html": "Kloroplas", "is_benar": false },
      { "huruf": "C", "teks_html": "Mitokondria", "is_benar": true },
      { "huruf": "D", "teks_html": "Nukleus", "is_benar": false },
      { "huruf": "E", "teks_html": "Retikulum Endoplasma", "is_benar": false }
    ],
    "panduan_essay": null
  }
]
```

### BIOLOGI — 5 Soal

```json
[
  {
    "tipe": "pilihan_ganda",
    "pertanyaan_html": "Proses <strong>fotosintesis</strong> terjadi di dalam organel sel yang disebut...",
    "equation_latex": "6CO_2 + 6H_2O \\xrightarrow{\\text{cahaya}} C_6H_{12}O_6 + 6O_2",
    "bobot": 1,
    "opsi": [
      { "huruf": "A", "teks_html": "Mitokondria", "is_benar": false },
      { "huruf": "B", "teks_html": "Kloroplas", "is_benar": true },
      { "huruf": "C", "teks_html": "Ribosom", "is_benar": false },
      { "huruf": "D", "teks_html": "Lisosom", "is_benar": false },
      { "huruf": "E", "teks_html": "Aparatus Golgi", "is_benar": false }
    ],
    "panduan_essay": null
  },
  {
    "tipe": "pilihan_ganda",
    "pertanyaan_html": "Dalam pewarisan sifat Mendel, persilangan antara tanaman berbunga merah (<strong>MM</strong>) dengan tanaman berbunga putih (<strong>mm</strong>) menghasilkan F1. Jika F1 disilangkan sesamanya, persentase tanaman berbunga <strong>putih</strong> pada F2 adalah...",
    "equation_latex": "Mm \\times Mm \\rightarrow MM : Mm : mm = 1:2:1",
    "bobot": 2,
    "opsi": [
      { "huruf": "A", "teks_html": "0%", "is_benar": false },
      { "huruf": "B", "teks_html": "25%", "is_benar": true },
      { "huruf": "C", "teks_html": "50%", "is_benar": false },
      { "huruf": "D", "teks_html": "75%", "is_benar": false },
      { "huruf": "E", "teks_html": "100%", "is_benar": false }
    ],
    "panduan_essay": null
  },
  {
    "tipe": "pilihan_ganda",
    "pertanyaan_html": "Urutan tahapan <strong>mitosis</strong> yang benar adalah...",
    "equation_latex": null,
    "bobot": 2,
    "opsi": [
      { "huruf": "A", "teks_html": "Profase → Metafase → Anafase → Telofase", "is_benar": true },
      { "huruf": "B", "teks_html": "Metafase → Profase → Anafase → Telofase", "is_benar": false },
      { "huruf": "C", "teks_html": "Anafase → Profase → Metafase → Telofase", "is_benar": false },
      { "huruf": "D", "teks_html": "Telofase → Anafase → Metafase → Profase", "is_benar": false },
      { "huruf": "E", "teks_html": "Profase → Anafase → Metafase → Telofase", "is_benar": false }
    ],
    "panduan_essay": null
  },
  {
    "tipe": "pilihan_ganda",
    "pertanyaan_html": "Enzim yang berperan dalam proses <strong>replikasi DNA</strong> dengan cara memutus ikatan hidrogen antar basa nitrogen sehingga double helix terbuka adalah...",
    "equation_latex": null,
    "bobot": 2,
    "opsi": [
      { "huruf": "A", "teks_html": "DNA Polimerase", "is_benar": false },
      { "huruf": "B", "teks_html": "RNA Polimerase", "is_benar": false },
      { "huruf": "C", "teks_html": "Helikase", "is_benar": true },
      { "huruf": "D", "teks_html": "Ligase", "is_benar": false },
      { "huruf": "E", "teks_html": "Primase", "is_benar": false }
    ],
    "panduan_essay": null
  },
  {
    "tipe": "essay",
    "pertanyaan_html": "Jelaskan mekanisme <strong>sistem imun tubuh manusia</strong> dalam melawan infeksi bakteri! Uraikan peran dari:<br/><br/>a) Sel darah putih (leukosit) — sebutkan jenisnya<br/>b) Antibodi — bagaimana cara kerjanya<br/>c) Perbedaan imunitas <em>aktif</em> dan imunitas <em>pasif</em>",
    "equation_latex": null,
    "bobot": 5,
    "opsi": [],
    "panduan_essay": "a) Leukosit: neutrofil (fagositosis), limfosit B (antibodi), limfosit T (serang sel terinfeksi), monosit (fagosit besar), eosinofil.\nb) Antibodi: protein Y yang diproduksi limfosit B, berikatan dengan antigen spesifik, menetralkan atau menandai untuk dihancurkan.\nc) Aktif: tubuh memproduksi antibodi sendiri (infeksi alami / vaksin). Pasif: menerima antibodi dari luar (ASI, injeksi imunoglobulin).\n\nRubrik: a=2pts, b=2pts, c=1pt"
  }
]
```

---

## HOW TO USE IN CODE

```typescript
// src/data/ai-presets.ts

export const AI_PRESETS = {
  matematika: {
    set_1: [...], // paste Matematika 1 soal JSON here
    set_5: [...], // paste Matematika 5 soal JSON here
  },
  fisika: {
    set_1: [...], // paste Fisika 1 soal JSON here
    set_5: [...], // paste Fisika 5 soal JSON here
  },
  biologi: {
    set_1: [...], // paste Biologi 1 soal JSON here
    set_5: [...], // paste Biologi 5 soal JSON here
  },
}

// In AIGeneratorModal:
const handleGenerate = async () => {
  setIsGenerating(true)
  setGeneratedQuestions([])
  await new Promise(r => setTimeout(r, 1500)) // fake API delay
  const key = quantity === 5 ? 'set_5' : 'set_1'
  const questions = AI_PRESETS[subject][key]
  setGeneratedQuestions(questions)
  setIsGenerating(false)
}
```
