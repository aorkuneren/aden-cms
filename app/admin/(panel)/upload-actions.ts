"use server"

import { getCurrentAdmin } from "@/lib/admin/auth"
import { saveUpload, type UploadTarget } from "@/lib/media/upload"
import { logAuditEvent } from "@/lib/audit"

export type UploadActionResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

/** FormData içindeki `scope` ve ilgili alanlardan yükleme hedefini çözer. */
function resolveTargetFromFormData(formData: FormData): UploadTarget {
  const scope = String(formData.get("scope") || "system")
  switch (scope) {
    case "bungalov":
      return { scope: "bungalov", id: String(formData.get("targetId") || "") }
    case "galeri":
      return { scope: "galeri", category: String(formData.get("category") || "") }
    case "slider":
      return { scope: "slider" }
    case "neden-aden":
      return { scope: "neden-aden" }
    case "hakkimizda":
      return { scope: "hakkimizda" }
    case "cta":
      return { scope: "cta" }
    default:
      return { scope: "system" }
  }
}

export async function uploadFileAction(formData: FormData): Promise<UploadActionResult> {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return { ok: false, error: "Yetkisiz erişim." }

    const file = formData.get("file") as File | null
    if (!file || file.size === 0) {
      return { ok: false, error: "Geçerli bir dosya seçilmedi." }
    }

    const target = resolveTargetFromFormData(formData)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result = await saveUpload(buffer, file.name, file.type, target)

    await logAuditEvent({
      actorUserId: admin.id,
      actorName: admin.name,
      action: "Dosya Yüklendi",
      entityType: "upload",
      entityId: result.filename,
      details: { url: result.url, scope: target.scope, originalName: result.originalName },
    })

    return { ok: true, url: result.url }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Dosya yüklenirken hata oluştu."
    return { ok: false, error: message }
  }
}
