import { readJson, mutateJson } from "@/lib/cms/store"

const AUDIT_LOGS_FILE = "audit-logs.json"

export type AuditLogInput = {
  actorUserId?: string | null
  actorName?: string | null
  action: string
  entityType?: string
  entity?: string
  entityId?: string | null
  details?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
  ip?: string | null
  userAgent?: string | null
}

export type AuditLogEntry = {
  id: string
  createdAt: string
  actorUserId: string
  actorName: string
  action: string
  entityType: string
  entityId: string
  details?: Record<string, unknown> | null
  ip?: string
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  try {
    const list = await readJson<AuditLogEntry[]>(AUDIT_LOGS_FILE)
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export async function logAuditEvent(input: AuditLogInput): Promise<void> {
  const entry: AuditLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    actorUserId: input.actorUserId || "system",
    actorName: input.actorName || "Sistem / Anonim",
    action: input.action,
    entityType: input.entityType || input.entity || "genel",
    entityId: input.entityId || "",
    details: input.details || input.newValues || null,
    ip: input.ip || undefined,
  }

  try {
    await mutateJson<AuditLogEntry[]>(AUDIT_LOGS_FILE, (current = []) => {
      const list = Array.isArray(current) ? current : []
      // En yeni 500 kaydı sakla
      return [entry, ...list].slice(0, 500)
    })
  } catch (err) {
    console.error("[audit] Audit log kaydedilemedi:", err)
  }
}

export async function writeAudit(input: AuditLogInput): Promise<void> {
  await logAuditEvent(input)
}
