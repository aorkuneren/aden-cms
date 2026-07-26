"use server"

import { requireCms } from "@/lib/admin/permissions"
import { logAuditEvent } from "@/lib/audit"
import { markDeleted } from "@/lib/cms/soft-delete"
import { mutateJson } from "@/lib/cms/store"
import { INQUIRY_STATUSES, type InquiryStatus } from "@/lib/site/inquiries"

const INQUIRIES_FILE = "inquiries.json"

type InquiryRecord = Record<string, unknown>

export type InquiryActionResult = { ok: true } | { ok: false; error: string }

/** Okundu/okunmadı işaretler. */
export async function setInquiryReadAction(
  id: string,
  isRead: boolean
): Promise<InquiryActionResult> {
  const gate = await requireCms("update")
  if (!gate.ok) return gate
  if (!id) return { ok: false, error: "Geçersiz mesaj." }

  await mutateJson<InquiryRecord[]>(INQUIRIES_FILE, (current) => {
    const list = Array.isArray(current) ? current : []
    return list.map((raw) =>
      String(raw?.id) === id ? { ...raw, isRead, updatedAt: new Date().toISOString() } : raw
    )
  })

  return { ok: true }
}

/** Mesaj durumunu (Yeni / İşlemde / Çözüldü) değiştirir. */
export async function setInquiryStatusAction(
  id: string,
  status: string
): Promise<InquiryActionResult> {
  const gate = await requireCms("update")
  if (!gate.ok) return gate
  if (!id) return { ok: false, error: "Geçersiz mesaj." }
  if (!INQUIRY_STATUSES.includes(status as InquiryStatus)) {
    return { ok: false, error: "Geçersiz durum." }
  }

  await mutateJson<InquiryRecord[]>(INQUIRIES_FILE, (current) => {
    const list = Array.isArray(current) ? current : []
    return list.map((raw) =>
      String(raw?.id) === id
        ? { ...raw, status, isRead: true, updatedAt: new Date().toISOString() }
        : raw
    )
  })

  await logAuditEvent({
    actorUserId: gate.admin.id,
    actorName: gate.admin.name,
    action: "İletişim mesajı durumu güncellendi",
    entityType: "inquiry",
    entityId: id,
    details: { status },
  })

  return { ok: true }
}

/** Mesajı yumuşak siler (geri dönüşüme düşer). */
export async function deleteInquiryAction(id: string): Promise<InquiryActionResult> {
  const gate = await requireCms("delete")
  if (!gate.ok) return gate
  if (!id) return { ok: false, error: "Geçersiz mesaj." }

  await mutateJson<InquiryRecord[]>(INQUIRIES_FILE, (current) => {
    const list = Array.isArray(current) ? current : []
    return list.map((raw) => (String(raw?.id) === id ? markDeleted(raw, gate.admin.id) : raw))
  })

  await logAuditEvent({
    actorUserId: gate.admin.id,
    actorName: gate.admin.name,
    action: "İletişim mesajı silindi",
    entityType: "inquiry",
    entityId: id,
  })

  return { ok: true }
}
