import { createClient } from 'redis'
import logger from './logger'

// TRN-26 — Redis caching layer for high-concurrency exam starts.
//
// A single shared client is used on purpose: node-redis multiplexes every
// command over one TCP socket, so thousands of concurrent reads cannot exhaust
// sockets the way a per-request connection (or an undersized pool) would. That
// directly satisfies the "no socket exhaustion under load" requirement for the
// Node runtime — a Go-style connection pool is unnecessary here.
//
// Caching is an OPTIMIZATION, never a hard dependency: if Redis is unreachable,
// every helper degrades gracefully (get → null ⇒ cache miss ⇒ DB) so the
// service keeps serving from PostgreSQL.

const redisClient = createClient({
  socket: {
    host: (process.env.REDIS_HOST || 'localhost').trim(),
    port: Number(process.env.REDIS_PORT || 6379),
    // Don't wedge the event loop reconnecting forever if Redis is down.
    reconnectStrategy: (retries) => Math.min(retries * 200, 3000),
  },
})

let ready = false
redisClient.on('ready', () => { ready = true; logger.info('Redis cache connected') })
redisClient.on('end', () => { ready = false })
redisClient.on('error', (err) => { ready = false; logger.error('Redis cache error', { error: (err as Error)?.message }) })
redisClient.connect().catch((err) => logger.error('Redis cache connect failed', { error: (err as Error)?.message }))

/** Cache key for a tryout's full detail (tryout row + questions + options). */
export const tryoutDetailKey = (id: string) => `tryout_detail:${id}`

/** Read a cached value. Returns null on miss or if Redis is unavailable. */
export async function cacheGet(key: string): Promise<string | null> {
  if (!ready) return null
  try {
    return await redisClient.get(key)
  } catch (err) {
    logger.error('cacheGet failed', { key, error: (err as Error)?.message })
    return null
  }
}

/** Store a value with a TTL (seconds). Best-effort — failures are swallowed. */
export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  if (!ready) return
  try {
    await redisClient.set(key, value, { EX: ttlSeconds })
  } catch (err) {
    logger.error('cacheSet failed', { key, error: (err as Error)?.message })
  }
}

/** Delete one or more keys (cache invalidation). Best-effort. */
export async function cacheDel(key: string | string[]): Promise<void> {
  if (!ready) return
  try {
    await redisClient.del(key)
  } catch (err) {
    logger.error('cacheDel failed', { key, error: (err as Error)?.message })
  }
}

export default redisClient
