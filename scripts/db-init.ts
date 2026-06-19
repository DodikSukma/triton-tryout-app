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

const services = [
  {
    name: 'auth-service',
    dbName: 'db_auth',
    schema: 'auth_svc',
    sqlPath: path.join(rootDir, 'services/auth-service/src/db/schema.sql')
  },
  {
    name: 'user-service',
    dbName: 'db_user',
    schema: 'user_svc',
    sqlPath: path.join(rootDir, 'services/user-service/src/db/schema.sql')
  },
  {
    name: 'sd-service',
    dbName: 'db_sd',
    schema: 'sd',
    sqlPath: path.join(rootDir, 'services/sd-service/src/db/schema.sql')
  },
  {
    name: 'smp-service',
    dbName: 'db_smp',
    schema: 'smp',
    sqlPath: path.join(rootDir, 'services/smp-service/src/db/schema.sql')
  },
  {
    name: 'sma-service',
    dbName: 'db_sma',
    schema: 'sma',
    sqlPath: path.join(rootDir, 'services/sma-service/src/db/schema.sql')
  }
]

async function run() {
  console.log('⚡ Starting database initialization...')
  console.log(`Connecting to: ${host}:${port} as ${user}`)

  if (sharedDb) {
    console.log(`Using shared database: ${sharedDb} (Supabase/multi-schema mode)`)
    
    // Connect to the shared database to create schemas first
    const client = new Client({
      host,
      port,
      user,
      password,
      database: sharedDb,
      ssl: isSupabase ? { rejectUnauthorized: false } : false
    })
    await client.connect()

    for (const svc of services) {
      console.log(`  Creating schema "${svc.schema}" if not exists...`)
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${svc.schema};`)
    }
    await client.end()

    // Now connect and run schemas inside their respective search_path
    for (const svc of services) {
      console.log(`  Applying schema for ${svc.name} inside schema "${svc.schema}"...`)
      const svcClient = new Client({
        host,
        port,
        user,
        password,
        database: sharedDb,
        ssl: isSupabase ? { rejectUnauthorized: false } : false,
        options: `-c search_path=${svc.schema}`
      })
      await svcClient.connect()

      const sql = fs.readFileSync(svc.sqlPath, 'utf-8')
      await svcClient.query(sql)
      console.log(`  ✅ ${svc.name} schema applied successfully.`)
      await svcClient.end()
    }
  } else {
    console.log('Using separate databases (local/Docker mode)')
    for (const svc of services) {
      console.log(`  Applying schema for ${svc.name} in database "${svc.dbName}"...`)
      const svcClient = new Client({
        host,
        port,
        user,
        password,
        database: svc.dbName
      })
      await svcClient.connect()

      const sql = fs.readFileSync(svc.sqlPath, 'utf-8')
      await svcClient.query(sql)
      console.log(`  ✅ ${svc.name} schema applied successfully.`)
      await svcClient.end()
    }
  }
  console.log('✅ All databases/schemas initialized successfully!')
}

run().catch(err => {
  console.error('❌ Error initializing database schemas:', err)
  process.exit(1)
})
