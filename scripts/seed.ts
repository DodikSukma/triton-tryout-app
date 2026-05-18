import { Pool } from 'pg'
import bcrypt from 'bcrypt'

const authPool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'triton_user',
  password: 'triton_secret_2024',
  database: 'db_auth',
})

const userPool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'triton_user',
  password: 'triton_secret_2024',
  database: 'db_user',
})

const users = [
  { email: 'admin@triton.id', password: 'admin123', role: 'admin', nama: 'Administrator' },
  { email: 'guru1@triton.id', password: 'guru123', role: 'guru', nama: 'Bapak Agus' },
  { email: 'guru2@triton.id', password: 'guru123', role: 'guru', nama: 'Ibu Dewi' },
  { email: 'siswa1@triton.id', password: 'siswa123', role: 'siswa', nama: 'Budi Santoso', kelas: 'XII IPA 1' },
  { email: 'siswa2@triton.id', password: 'siswa123', role: 'siswa', nama: 'Ani Rahayu', kelas: 'XII IPA 2' },
  { email: 'siswa3@triton.id', password: 'siswa123', role: 'siswa', nama: 'Candra Wijaya', kelas: 'XII IPS 1' },
  { email: 'siswa4@triton.id', password: 'siswa123', role: 'siswa', nama: 'Dina Puspita', kelas: 'XII IPS 2' },
  { email: 'siswa5@triton.id', password: 'siswa123', role: 'siswa', nama: 'Eko Prasetyo', kelas: 'XII IPA 1' },
]

async function seed() {
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
        'INSERT INTO profiles (user_id, nama_lengkap, kelas) VALUES ($1,$2,$3) ON CONFLICT (user_id) DO NOTHING',
        [userId, u.nama, (u as { kelas?: string }).kelas ?? null]
      )
      console.log(`  ✓ ${u.email} (${u.role})`)
    }
  }
  await authPool.end()
  await userPool.end()
  console.log('Seeding selesai!')
}

seed().catch(console.error)
