import { Request } from 'express'
import pool from '../db/pool'
import logger from './logger'

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

export function clientIp(req?: Request): string | null {
  const xff = req?.headers?.['x-forwarded-for']
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim()
  return req?.ip ?? req?.socket?.remoteAddress ?? null
}

// Resolve actor/context fields from the request (headers injected by the gateway)
// when not provided explicitly.
export function buildAuditPayload(req: Request | undefined, data: AuditData) {
  return {
    user_id: data.user_id ?? (req?.headers?.['x-user-id'] as string) ?? null,
    email: data.email ?? (req?.headers?.['x-user-email'] as string) ?? 'unknown',
    role: data.role ?? (req?.headers?.['x-user-role'] as string) ?? 'system',
    action: data.action,
    target_id: data.target_id ?? null,
    description: data.description,
    ip_address: data.ip_address ?? clientIp(req),
    user_agent: data.user_agent ?? (req?.headers?.['user-agent'] as string) ?? null,
  }
}

// Direct DB insert (used by the internal endpoint and local user-service events).
export async function insertAuditLog(p: ReturnType<typeof buildAuditPayload>): Promise<void> {
  await pool.query(
    `INSERT INTO audit_logs (user_id, email, role, action, target_id, description, ip_address, user_agent)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [p.user_id, p.email, p.role, p.action, p.target_id, p.description, p.ip_address, p.user_agent]
  )
}

// Fire-and-forget audit from within user-service (writes to its own DB).
export function auditLog(req: Request, data: AuditData): void {
  insertAuditLog(buildAuditPayload(req, data)).catch((err) => logger.error('[audit]', { error: err }))
}
