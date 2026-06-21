import { Pool } from 'pg'

const pool = new Pool({
  host: (process.env.POSTGRES_HOST || 'localhost').trim(),
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: (process.env.POSTGRES_USER || 'triton_user').trim(),
  password: (process.env.POSTGRES_PASSWORD || '').trim(),
  database: (process.env.POSTGRES_DB || 'db_user').trim(),
  options: (process.env.POSTGRES_OPTIONS || '-c search_path=user_svc').trim(),
})

export default pool