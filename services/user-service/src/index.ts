import express from 'express'
import cors from 'cors'
import logger from './lib/logger'
import userRoutes from './routes/user.routes'

const app = express()
const PORT = process.env.PORT ?? 4002

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '5mb' })) // 5mb to fit base64 avatars up to ~3.5MB

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip })
  next()
})

app.use('/users', userRoutes)

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'user-service' }))

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack })
  res.status(500).json({ success: false, error: 'Internal server error' })
})

app.listen(PORT, () => logger.info(`User service running on port ${PORT}`))
