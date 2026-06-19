import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  // Tambahkan ini agar dapat mengatur skema search_path database secara dinamis
  options: process.env.POSTGRES_OPTIONS ?? '-c search_path=user_svc',
})

export default pool