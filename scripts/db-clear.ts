import { Client } from 'pg'
import fs from 'fs'
import path from 'path'

let rootDir = process.cwd()
if (rootDir.endsWith('scripts') || rootDir.endsWith('scripts/')) {
  rootDir = path.dirname(rootDir)
}

// Custom dotenv loader to load environment variables from the root .env file
function loadEnv() {
  const envPath = path.join(rootDir, '.env')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const firstEq = trimmed.indexOf('=')
    if (firstEq === -1) continue
    const key = trimmed.substring(0, firstEq).trim()
    const val = trimmed.substring(firstEq + 1).trim()
    const cleanVal = val.replace(/^["']|["']$/g, '')
    process.env[key] = cleanVal
  }
}

loadEnv()

const host = process.env.POSTGRES_HOST || 'localhost'
const port = Number(process.env.POSTGRES_PORT) || 5432
const user = process.env.POSTGRES_USER || 'triton_user'
const password = process.env.POSTGRES_PASSWORD || 'triton_secret_2024'
const sharedDb = process.env.POSTGRES_DB // e.g. 'postgres' on Supabase

const isSupabase = host.includes('supabase')

const targetLevels = [
  { name: 'SD Service', dbName: 'db_sd', schema: 'sd' },
  { name: 'SMP Service', dbName: 'db_smp', schema: 'smp' },
  { name: 'SMA Service', dbName: 'db_sma', schema: 'sma' }
]

async function clearDb() {
  console.log('🧹 Starting tryout data cleanup script...')
  console.log(`Connecting to: ${host}:${port} as ${user}`)

  if (sharedDb) {
    console.log(`Using shared database: ${sharedDb} (Supabase/multi-schema mode)`)
    for (const lvl of targetLevels) {
      console.log(`  Clearing tryout tables in schema "${lvl.schema}"...`)
      const client = new Client({
        host,
        port,
        user,
        password,
        database: sharedDb,
        ssl: isSupabase ? { rejectUnauthorized: false } : false,
        options: `-c search_path=${lvl.schema}`
      })
      await client.connect()
      // Use CASCADE to clear all foreign key constraints references properly
      await client.query(`TRUNCATE TABLE hasil, jawaban, sesi_tryout, opsi_jawaban, soal, tryouts CASCADE;`)
      console.log(`  ✅ Schema "${lvl.schema}" tryout data cleared.`)
      await client.end()
    }
  } else {
    console.log('Using separate databases (local/Docker mode)')
    for (const lvl of targetLevels) {
      console.log(`  Clearing tryout tables in database "${lvl.dbName}"...`)
      const client = new Client({
        host,
        port,
        user,
        password,
        database: lvl.dbName
      })
      await client.connect()
      await client.query(`TRUNCATE TABLE hasil, jawaban, sesi_tryout, opsi_jawaban, soal, tryouts CASCADE;`)
      console.log(`  ✅ Database "${lvl.dbName}" tryout data cleared.`)
      await client.end()
    }
  }
  console.log('✅ Tryout data cleanup completed successfully!')
}

clearDb().catch(err => {
  console.error('❌ Error during tryout data cleanup:', err)
  process.exit(1)
})
