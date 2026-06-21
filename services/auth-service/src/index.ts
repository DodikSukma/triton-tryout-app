import express from 'express'
import cors from 'cors'
import session from 'express-session'
import { createClient } from 'redis'
import RedisStore from 'connect-redis'
import logger from './lib/logger'
import authRoutes from './routes/auth.routes'

declare module 'express-session' {
  interface SessionData {
    userId: string
    role: string
    email: string
  }
}

const app = express()
app.set('trust proxy', 1) // Trust first proxy (Ngrok and API Gateway)
const PORT = process.env.PORT ?? 4001

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

// HTTP request logger
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip })
  next()
})

const redisClient = createClient({
  socket: {
    host: (process.env.REDIS_HOST || 'localhost').trim(),
    port: Number(process.env.REDIS_PORT || 6379),
  },
})

redisClient.connect().catch((err) => logger.error('Redis connection failed', { error: err }))
redisClient.on('error', (err) => logger.error('Redis error', { error: err }))
redisClient.on('connect', () => logger.info('Redis connected'))

const store = new RedisStore({ client: redisClient })

app.use(
  session({
    store,
    name: 'triton.sid',
    secret: process.env.SESSION_SECRET ?? 'fallback-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: Number(process.env.SESSION_MAX_AGE_MS ?? 28800000),
    },
  })
)

app.use('/auth', authRoutes)

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'auth-service' }))

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack })
  res.status(500).json({ success: false, error: 'Internal server error' })
})

app.listen(PORT, () => logger.info(`Auth service running on port ${PORT}`))
