import { Pool } from 'pg'
import bcrypt from 'bcrypt'

const PG = { host: 'localhost', port: 5432, user: 'triton_user', password: 'triton_secret_2024' }

const authPool = new Pool({ ...PG, database: 'db_auth' })
const userPool = new Pool({ ...PG, database: 'db_user' })

// One pool per education-level database (formerly a single db_soal + db_jawaban).
const levelPools = {
  sd:  new Pool({ ...PG, database: 'db_sd' }),
  smp: new Pool({ ...PG, database: 'db_smp' }),
  sma: new Pool({ ...PG, database: 'db_sma' }),
}

const users = [
  { email: 'admin@triton.id', password: 'admin123', role: 'admin', nama: 'Administrator' },
  { email: 'guru1@triton.id', password: 'guru123', role: 'guru', nama: 'Bapak Agus' },
  { email: 'guru2@triton.id', password: 'guru123', role: 'guru', nama: 'Ibu Dewi' },
  { email: 'siswa1@triton.id', password: 'siswa123', role: 'siswa', nama: 'Budi Santoso', kelas: 'XII IPA 1' },
  { email: 'siswa2@triton.id', password: 'siswa123', role: 'siswa', nama: 'Ani Rahayu', kelas: 'XII IPA 2' },
  { email: 'siswa3@triton.id', password: 'siswa123', role: 'siswa', nama: 'Candra Wijaya', kelas: 'XII IPS 1' },
  { email: 'siswa4@triton.id', password: 'siswa123', role: 'siswa', nama: 'Dina Puspita', kelas: 'XII IPS 2' },
  { email: 'siswa5@triton.id', password: 'siswa123', role: 'siswa', nama: 'Eko Prasetyo', kelas: 'XII IPA 1' },

  // ── TRN-02: dedicated guru + siswa per education level ──
  // SD Accounts
  { email: 'guru.sd@triton.id',  password: 'guru123',  role: 'guru',  nama: 'Ibu Sastro (SD)' },
  { email: 'siswa.sd@triton.id', password: 'siswa123', role: 'siswa', nama: 'Budi Kecil (SD)', kelas: '6 SD', education_level: 'SD' },
  // SMP Accounts
  { email: 'guru.smp@triton.id',  password: 'guru123',  role: 'guru',  nama: 'Bapak Hartono (SMP)' },
  { email: 'siswa.smp@triton.id', password: 'siswa123', role: 'siswa', nama: 'Rian Pratama (SMP)', kelas: '9 SMP', education_level: 'SMP' },
  // SMA Accounts
  { email: 'guru.sma@triton.id',  password: 'guru123',  role: 'guru',  nama: 'Ibu Lestari (SMA)' },
  { email: 'siswa.sma@triton.id', password: 'siswa123', role: 'siswa', nama: 'Siti Rahma (SMA)', kelas: '12 SMA', education_level: 'SMA' },
]

// Each level tryout is authored by that level's dedicated guru.
const guruEmailByLevel: Record<'sd' | 'smp' | 'sma', string> = {
  sd:  'guru.sd@triton.id',
  smp: 'guru.smp@triton.id',
  sma: 'guru.sma@triton.id',
}

interface SeedSoal {
  pertanyaan: string
  bobot: number
  opsi: { huruf: string; teks: string; is_benar: boolean }[]
}

interface SeedTryout {
  nama_tryout: string
  mata_pelajaran: string
  durasi_menit: number
  soal: SeedSoal[]
}

// Subject + level-appropriate question sets, isolated per level database.
const levelTryouts: Record<'sd' | 'smp' | 'sma', SeedTryout> = {
  sd: {
    nama_tryout: 'Tryout Matematika SD Kelas 6',
    mata_pelajaran: 'Matematika',
    durasi_menit: 60,
    soal: [
      {
        pertanyaan: 'Berapakah hasil dari 7 + 8?',
        bobot: 1,
        opsi: [
          { huruf: 'A', teks: '13', is_benar: false },
          { huruf: 'B', teks: '14', is_benar: false },
          { huruf: 'C', teks: '15', is_benar: true },
          { huruf: 'D', teks: '16', is_benar: false },
        ],
      },
      {
        pertanyaan: 'Hasil dari 9 × 6 adalah ...',
        bobot: 1,
        opsi: [
          { huruf: 'A', teks: '54', is_benar: true },
          { huruf: 'B', teks: '45', is_benar: false },
          { huruf: 'C', teks: '63', is_benar: false },
          { huruf: 'D', teks: '56', is_benar: false },
        ],
      },
      {
        pertanyaan: 'Bilangan genap di bawah ini adalah ...',
        bobot: 1,
        opsi: [
          { huruf: 'A', teks: '7', is_benar: false },
          { huruf: 'B', teks: '12', is_benar: true },
          { huruf: 'C', teks: '15', is_benar: false },
          { huruf: 'D', teks: '21', is_benar: false },
        ],
      },
    ],
  },
  smp: {
    nama_tryout: 'Tryout IPA SMP Kelas 9',
    mata_pelajaran: 'IPA',
    durasi_menit: 75,
    soal: [
      {
        pertanyaan: 'Satuan Internasional (SI) untuk besaran gaya adalah ...',
        bobot: 1,
        opsi: [
          { huruf: 'A', teks: 'Joule', is_benar: false },
          { huruf: 'B', teks: 'Newton', is_benar: true },
          { huruf: 'C', teks: 'Watt', is_benar: false },
          { huruf: 'D', teks: 'Pascal', is_benar: false },
        ],
      },
      {
        pertanyaan: 'Proses tumbuhan membuat makanannya sendiri disebut ...',
        bobot: 1,
        opsi: [
          { huruf: 'A', teks: 'Respirasi', is_benar: false },
          { huruf: 'B', teks: 'Transpirasi', is_benar: false },
          { huruf: 'C', teks: 'Fotosintesis', is_benar: true },
          { huruf: 'D', teks: 'Fermentasi', is_benar: false },
        ],
      },
      {
        pertanyaan: 'Zat yang memiliki pH lebih kecil dari 7 bersifat ...',
        bobot: 2,
        opsi: [
          { huruf: 'A', teks: 'Basa', is_benar: false },
          { huruf: 'B', teks: 'Netral', is_benar: false },
          { huruf: 'C', teks: 'Asam', is_benar: true },
          { huruf: 'D', teks: 'Garam', is_benar: false },
        ],
      },
    ],
  },
  sma: {
    nama_tryout: 'Tryout Fisika SMA Kelas 12',
    mata_pelajaran: 'Fisika',
    durasi_menit: 90,
    soal: [
      {
        pertanyaan: 'Sebuah benda bergerak dengan kecepatan tetap 20 m/s selama 5 sekon. Jarak yang ditempuh adalah ...',
        bobot: 1,
        opsi: [
          { huruf: 'A', teks: '4 m', is_benar: false },
          { huruf: 'B', teks: '25 m', is_benar: false },
          { huruf: 'C', teks: '100 m', is_benar: true },
          { huruf: 'D', teks: '200 m', is_benar: false },
        ],
      },
      {
        pertanyaan: 'Hukum Newton II dinyatakan dengan persamaan ...',
        bobot: 1,
        opsi: [
          { huruf: 'A', teks: 'F = m·a', is_benar: true },
          { huruf: 'B', teks: 'F = m/a', is_benar: false },
          { huruf: 'C', teks: 'F = a/m', is_benar: false },
          { huruf: 'D', teks: 'F = m·v', is_benar: false },
        ],
      },
      {
        pertanyaan: 'Besaran yang merupakan besaran vektor adalah ...',
        bobot: 2,
        opsi: [
          { huruf: 'A', teks: 'Massa', is_benar: false },
          { huruf: 'B', teks: 'Waktu', is_benar: false },
          { huruf: 'C', teks: 'Suhu', is_benar: false },
          { huruf: 'D', teks: 'Kecepatan', is_benar: true },
        ],
      },
    ],
  },
}

async function seedUsers(): Promise<void> {
  console.log('Seeding users...')
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 12)
    const res = await authPool.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1,$2,$3) ON CONFLICT (email) DO NOTHING RETURNING id',
      [u.email, hash, u.role]
    )
    const userId = res.rows[0]?.id
    if (userId) {
      await userPool.query(
        'INSERT INTO profiles (user_id, nama_lengkap, kelas, education_level) VALUES ($1,$2,$3,$4) ON CONFLICT (user_id) DO NOTHING',
        [userId, u.nama, (u as { kelas?: string }).kelas ?? null, (u as { education_level?: string }).education_level ?? null]
      )
      console.log(`  ✓ ${u.email} (${u.role})`)
    }
  }

  // Reconcile education_level for users whose accounts already existed (TRN-04).
  for (const u of users) {
    const level = (u as { education_level?: string }).education_level
    if (!level) continue
    const id = await getUserId(u.email)
    await userPool.query('UPDATE profiles SET education_level = $1 WHERE user_id = $2', [level, id])
  }
}

// Resolve a user id by email (works whether or not it was freshly inserted).
async function getUserId(email: string): Promise<string> {
  const r = await authPool.query('SELECT id FROM users WHERE email = $1', [email])
  if (!r.rows[0]) throw new Error(`User ${email} not found after seeding`)
  return r.rows[0].id as string
}

async function seedLevel(level: 'sd' | 'smp' | 'sma', guruId: string) {
  const pool = levelPools[level]
  const t = levelTryouts[level]

  // Idempotent: if this tryout already exists, just make sure it is attributed
  // to this level's dedicated guru, then skip re-inserting the questions.
  const existing = await pool.query('SELECT id FROM tryouts WHERE nama_tryout = $1', [t.nama_tryout])
  if (existing.rows[0]) {
    await pool.query('UPDATE tryouts SET dibuat_oleh = $1 WHERE id = $2', [guruId, existing.rows[0].id])
    console.log(`  • [${level}] "${t.nama_tryout}" already seeded — author set to ${guruEmailByLevel[level]}`)
    return
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const tryoutRes = await client.query(
      `INSERT INTO tryouts (nama_tryout, mata_pelajaran, durasi_menit, dibuat_oleh, status)
       VALUES ($1,$2,$3,$4,'published') RETURNING id`,
      [t.nama_tryout, t.mata_pelajaran, t.durasi_menit, guruId]
    )
    const tryoutId = tryoutRes.rows[0].id

    let nomor = 1
    for (const s of t.soal) {
      const soalRes = await client.query(
        `INSERT INTO soal (tryout_id, nomor_soal, tipe, pertanyaan, bobot)
         VALUES ($1,$2,'pilihan_ganda',$3,$4) RETURNING id`,
        [tryoutId, nomor++, s.pertanyaan, s.bobot]
      )
      const soalId = soalRes.rows[0].id
      for (const o of s.opsi) {
        await client.query(
          'INSERT INTO opsi_jawaban (soal_id, huruf, teks, is_benar) VALUES ($1,$2,$3,$4)',
          [soalId, o.huruf, o.teks, o.is_benar]
        )
      }
    }
    await client.query('COMMIT')
    console.log(`  ✓ [${level}] "${t.nama_tryout}" (${t.soal.length} soal, published)`)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ── Master data registry (TRN-03), seeded into db_user ──
const masterKelas: { nama: string; level: 'SD' | 'SMP' | 'SMA' }[] = [
  { nama: '4 SD', level: 'SD' }, { nama: '5 SD', level: 'SD' }, { nama: '6 SD', level: 'SD' },
  { nama: '7 SMP', level: 'SMP' }, { nama: '8 SMP', level: 'SMP' }, { nama: '9 SMP', level: 'SMP' },
  { nama: '10 SMA', level: 'SMA' }, { nama: '11 SMA', level: 'SMA' }, { nama: '12 SMA', level: 'SMA' },
]

// `nama` is globally unique, so each subject belongs to a single level.
const masterMapel: { nama: string; level: 'SD' | 'SMP' | 'SMA'; sub: string[] }[] = [
  { nama: 'Matematika',       level: 'SD',  sub: ['Penjumlahan', 'Pecahan', 'Geometri Dasar'] },
  { nama: 'IPA',              level: 'SD',  sub: ['Tumbuhan', 'Hewan'] },
  { nama: 'Bahasa Indonesia', level: 'SD',  sub: ['Membaca', 'Menulis'] },
  { nama: 'Bahasa Inggris',   level: 'SMP', sub: ['Grammar', 'Vocabulary'] },
  { nama: 'IPS',              level: 'SMP', sub: ['Sejarah', 'Geografi'] },
  { nama: 'Fisika',           level: 'SMA', sub: ['Mekanika', 'Listrik', 'Optik'] },
  { nama: 'Kimia',            level: 'SMA', sub: ['Asam Basa', 'Ikatan Kimia'] },
  { nama: 'Biologi',          level: 'SMA', sub: ['Sel', 'Genetika'] },
]

async function seedMaster() {
  console.log('Seeding master data (kelas / mata pelajaran / sub)...')
  for (const k of masterKelas) {
    await userPool.query(
      'INSERT INTO master_kelas (nama, level) VALUES ($1,$2) ON CONFLICT (nama) DO NOTHING',
      [k.nama, k.level]
    )
  }
  for (const m of masterMapel) {
    const r = await userPool.query(
      `INSERT INTO master_mata_pelajaran (nama, level) VALUES ($1,$2)
       ON CONFLICT (nama) DO UPDATE SET level = EXCLUDED.level RETURNING id`,
      [m.nama, m.level]
    )
    const mapelId = r.rows[0].id
    for (const sub of m.sub) {
      await userPool.query(
        `INSERT INTO master_sub_mata_pelajaran (mata_pelajaran_id, nama) VALUES ($1,$2)
         ON CONFLICT (mata_pelajaran_id, nama) DO NOTHING`,
        [mapelId, sub]
      )
    }
  }
  console.log(`  ✓ ${masterKelas.length} kelas, ${masterMapel.length} mata pelajaran (+ sub)`)
}

async function seed() {
  await seedUsers()
  await seedMaster()

  // Author each level's tryout with that level's dedicated guru.
  const guruByLevel = {
    sd:  await getUserId(guruEmailByLevel.sd),
    smp: await getUserId(guruEmailByLevel.smp),
    sma: await getUserId(guruEmailByLevel.sma),
  }

  console.log('Seeding per-level tryouts (SD / SMP / SMA)...')
  await seedLevel('sd', guruByLevel.sd)
  await seedLevel('smp', guruByLevel.smp)
  await seedLevel('sma', guruByLevel.sma)

  await Promise.all([
    authPool.end(),
    userPool.end(),
    levelPools.sd.end(),
    levelPools.smp.end(),
    levelPools.sma.end(),
  ])
  console.log('Seeding selesai!')
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
