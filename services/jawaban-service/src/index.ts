import express from 'express'
import cors from 'cors'
import logger from './lib/logger'
import jawabanRoutes from './routes/jawaban.routes'

const app = express()
const PORT = process.env.PORT ?? 4004

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip })
  next()
})

app.use('/', jawabanRoutes)

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'jawaban-service' }))

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack })
  res.status(500).json({ success: false, error: 'Internal server error' })
})

app.listen(PORT, () => logger.info(`Jawaban service running on port ${PORT}`))
