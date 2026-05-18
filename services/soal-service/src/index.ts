import express from 'express'
import cors from 'cors'
import logger from './lib/logger'
import tryoutRoutes from './routes/tryout.routes'
import soalRoutes from './routes/soal.routes'

const app = express()
const PORT = process.env.PORT ?? 4003

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '10mb' })) // soal questions can include base64 images

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip })
  next()
})

app.use('/tryouts', tryoutRoutes)
app.use('/soal', soalRoutes)

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'soal-service' }))

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack })
  res.status(500).json({ success: false, error: 'Internal server error' })
})

app.listen(PORT, () => logger.info(`Soal service running on port ${PORT}`))
