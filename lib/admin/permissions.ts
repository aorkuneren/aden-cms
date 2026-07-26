/**
 * Basit RBAC yetki katmanı (mevcut rol sistemine uyarlı).
 *
 * Admin auth rol tabanlıdır (SUPERADMIN/ADMIN/STAFF). Şartname gereği yetki
 * kontrolleri hem UI hem de sunucu tarafında uygulanır — bu modül sunucu
 * (server action) tarafındaki tek gate'tir. İzinler `modul.eylem` biçimindedir
 * ve lib/auth/rbac.ts katalogıyla uyumludur.
 */
import { getCurrentAdmin, type AdminRole, type AdminSessionUser } from "@/lib/admin/auth"

export type CmsAction = "view" | "create" | "update" | "delete" | "publish" | "approve"

const ROLE_CMS_ACTIONS: Record<AdminRole, CmsAction[] | "*"> = {
  SUPERADMIN: "*",
  ADMIN: "*",
  // İçerik editörü ve personel: içerik düzenler ama yayınlayamaz/silemez.
  CONTENT_EDITOR: ["view", "create", "update"],
  STAFF: ["view", "create", "update"],
}

export function roleCan(role: AdminRole, action: CmsAction): boolean {
  const allowed = ROLE_CMS_ACTIONS[role]
  return allowed === "*" || allowed.includes(action)
}

export function adminCan(admin: AdminSessionUser | null, action: CmsAction): boolean {
  if (!admin || !admin.isActive) return false
  return roleCan(admin.role, action)
}

export type PermissionResult =
  | { ok: true; admin: AdminSessionUser }
  | { ok: false; error: string }

/**
 * Server action'larda yetki kapısı. Oturum + rol kontrolü yapar.
 * Kullanım: `const gate = await requireCms("publish"); if (!gate.ok) return gate`
 */
export async function requireCms(action: CmsAction): Promise<PermissionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) return { ok: false, error: "Oturum süresi doldu. Lütfen tekrar giriş yapın." }
  if (!adminCan(admin, action)) {
    return { ok: false, error: `Bu işlem için yetkiniz yok (cms.${action}).` }
  }
  return { ok: true, admin }
}
