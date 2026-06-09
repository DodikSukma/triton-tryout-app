import { Request } from 'express'

const USER_SERVICE_URL = process.env.USER_SERVICE_URL ?? 'http://localhost:4002'

export interface AuditData {
  user_id?: string | null
  email?: string | null
  role?: string | null
  action: string
  target_id?: string | null
  description: string
  ip_address?: string | null
  user_agent?: string | null
}

function clientIp(req?: Request): string | null {
  const xff = req?.headers?.['x-forwarded-for']
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim()
  return req?.ip ?? req?.socket?.remoteAddress ?? null
}

// Actor is resolved from the gateway-injected headers (x-user-*). Fire-and-forget.
export function auditLog(req: Request, data: AuditData): void {
  const payload = {
    user_id: data.user_id ?? (req.headers['x-user-id'] as string) ?? null,
    email: data.email ?? (req.headers['x-user-email'] as string) ?? 'unknown',
    role: data.role ?? (req.headers['x-user-role'] as string) ?? 'system',
    action: data.action,
    target_id: data.target_id ?? null,
    description: data.description,
    ip_address: data.ip_address ?? clientIp(req),
    user_agent: data.user_agent ?? (req.headers['user-agent'] as string) ?? null,
  }
  fetch(`${USER_SERVICE_URL}/internal/audit-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => { /* fire-and-forget */ })
}
