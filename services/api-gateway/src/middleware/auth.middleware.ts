import { Request, Response, NextFunction } from 'express'

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL ?? 'http://localhost:4001'

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const r = await fetch(`${AUTH_SERVICE_URL}/auth/me`, {
      headers: { cookie: req.headers.cookie ?? '' },
    })
    if (!r.ok) return res.status(401).json({ success: false, error: 'Unauthorized' })
    const { data } = (await r.json()) as { data: { userId: string; role: string } }
    req.headers['x-user-id'] = data.userId
    req.headers['x-user-role'] = data.role
    next()
  } catch {
    res.status(503).json({ success: false, error: 'Auth service unavailable' })
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.headers['x-user-role'] as string)) {
      return res.status(403).json({ success: false, error: 'Forbidden' })
    }
    next()
  }
}
