"use server"

import { z } from "zod"

import { getCurrentAdmin } from "@/lib/admin/auth"
import { mutateJson, revalidateSite } from "@/lib/cms/store"
import { corporateFieldPrefix } from "@/lib/site/corporate-content"
import { logAuditEvent } from "@/lib/audit"

export type ActionResult = { ok: true } | { ok: false; error: string }

const PAGE_CONTENT_FILE = "page-content.json"
const PAGE_SLUG = "kurumsal"
const SECTION = "corporate-legal"

const legalPageSchema = z.object({
  slug: z.string().min(1),
  title: z.string(),
  description: z.string(),
  content: z.string(),
})

/**
 * Kurumsal/yasal sayfaların içeriğini SİTENİN GERÇEKTEN OKUDUĞU yere yazar:
 * page-content.json → "kurumsal" → "corporate-legal" → <prefix>_title/description/content.
 * (Public sayfalar bubuild-time terms.json değil, bu alanları okuyor.)
 */
export async function saveCorporateLegalAction(pages: unknown): Promise<ActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) return { ok: false, error: "Oturum süresi doldu. Lütfen tekrar giriş yapın." }

  const parsed = z.array(legalPageSchema).safeParse(pages)
  if (!parsed.success) {
    return { ok: false, error: "Yasal içerik verisi geçersiz." }
  }

  await mutateJson<Record<string, any>>(PAGE_CONTENT_FILE, (data = {}) => {
    const next = { ...data }
    const page = { ...(next[PAGE_SLUG] ?? {}) }
    const section = { ...(page[SECTION] ?? {}) }

    for (const item of parsed.data) {
      const prefix = corporateFieldPrefix(item.slug as any)
      section[`${prefix}_title`] = item.title
      section[`${prefix}_description`] = item.description
      section[`${prefix}_content`] = item.content
    }

    page[SECTION] = section
    next[PAGE_SLUG] = page
    return next
  })

  revalidateSite()

  await logAuditEvent({
    actorUserId: admin.id,
    actorName: admin.name,
    action: "Yasal Metinler Güncellendi",
    entityType: "cms_legal",
    details: { count: parsed.data.length },
  })

  return { ok: true }
}
