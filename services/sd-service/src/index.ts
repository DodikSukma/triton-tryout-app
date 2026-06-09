import express from 'express'
import cors from 'cors'
import logger from './lib/logger'
import tryoutRoutes from './routes/tryout.routes'
import soalRoutes from './routes/soal.routes'
import jawabanRoutes from './routes/jawaban.routes'

const SERVICE = 'sd-service'
const app = express()
const PORT = process.env.PORT ?? 4005

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '10mb' })) // soal questions can include base64 images

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip })
  next()
})

// Question bank (soal-service heritage)
app.use('/tryouts', tryoutRoutes)
app.use('/soal', soalRoutes)
// Exam runner & scoring (jawaban-service heritage): /sesi, /hasil, /riwayat
app.use('/', jawabanRoutes)

app.get('/health', (_req, res) => res.json({ status: 'ok', service: SERVICE }))

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack })
  res.status(500).json({ success: false, error: 'Internal server error' })
})

app.listen(PORT, () => logger.info(`${SERVICE} running on port ${PORT}`))
