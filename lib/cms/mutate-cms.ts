import { requireCms, type CmsAction } from "@/lib/admin/permissions"
import type { AdminSessionUser } from "@/lib/admin/auth"
import { mutateJson, revalidateSite } from "@/lib/cms/store"
import { logAuditEvent } from "@/lib/audit"

export type MutateCmsResult<T> =
  | { ok: true; data: T; admin: AdminSessionUser }
  | { ok: false; error: string }

export async function mutateCms<T>(options: {
  action: CmsAction
  file: string
  entityType: string
  entityId?: string
  auditAction: string
  details?: Record<string, unknown>
  updater: (current: T, admin: AdminSessionUser) => T | Promise<T>
  revalidate?: boolean
}): Promise<MutateCmsResult<T>> {
  const gate = await requireCms(options.action)
  if (!gate.ok) return gate

  const data = await mutateJson<T>(options.file, (current) => options.updater(current, gate.admin))

  await logAuditEvent({
    actorUserId: gate.admin.id,
    actorName: gate.admin.name,
    action: options.auditAction,
    entityType: options.entityType,
    entityId: options.entityId,
    details: options.details,
  })

  if (options.revalidate !== false) revalidateSite()

  return { ok: true, data, admin: gate.admin }
}
