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

// Fire-and-forget POST to the user-service audit pipeline. Never throws.
export function auditLog(req: Request | undefined, data: AuditData): void {
  const payload = {
    user_id: data.user_id ?? null,
    email: data.email ?? 'unknown',
    role: data.role ?? 'system',
    action: data.action,
    target_id: data.target_id ?? null,
    description: data.description,
    ip_address: data.ip_address ?? clientIp(req),
    user_agent: data.user_agent ?? (req?.headers?.['user-agent'] as string) ?? null,
  }
  fetch(`${USER_SERVICE_URL}/internal/audit-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => { /* fire-and-forget */ })
}
