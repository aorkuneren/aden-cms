"use server"

import { getCurrentAdmin, type AdminRole } from "@/lib/admin/auth"
import { revalidateSite } from "@/lib/cms/store"
import { runSeoBackfill } from "@/lib/seo/backfill"
import { calculateSeoScore } from "@/lib/seo/score"
import {
  saveSeo,
  resolveSeo,
  checkPublishable,
  type SaveSeoPatch,
} from "@/lib/seo/seo-meta-service"
import type { SeoEntityType } from "@/lib/seo/types"

function canEditAdvanced(role: AdminRole): boolean {
  return role === "SUPERADMIN" || role === "ADMIN"
}

async function requireLoggedInAdmin() {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return {
      ok: false as const,
      error: "Oturum süresi doldu. Lütfen tekrar giriş yapın.",
    }
  }
  return { ok: true as const, admin }
}

function parsePatch(raw: Record<string, unknown>): SaveSeoPatch {
  const patch: SaveSeoPatch = {}

  if (typeof raw.metaTitle === "string") patch.metaTitle = raw.metaTitle
  if (typeof raw.metaDescription === "string") patch.metaDescription = raw.metaDescription
  if (raw.focusKeyword !== undefined) {
    patch.focusKeyword =
      typeof raw.focusKeyword === "string" && raw.focusKeyword.trim()
        ? raw.focusKeyword.trim()
        : null
  }
  if (raw.slug !== undefined) {
    patch.slug = typeof raw.slug === "string" && raw.slug.trim() ? raw.slug.trim() : null
  }
  if (raw.path !== undefined) {
    patch.path = typeof raw.path === "string" && raw.path.trim() ? raw.path.trim() : null
  }
  if (raw.canonicalUrl !== undefined) {
    patch.canonicalUrl =
      typeof raw.canonicalUrl === "string" && raw.canonicalUrl.trim()
        ? raw.canonicalUrl.trim()
        : null
  }
  if (typeof raw.robotsIndex === "boolean") patch.robotsIndex = raw.robotsIndex
  if (typeof raw.robotsFollow === "boolean") patch.robotsFollow = raw.robotsFollow
  if (raw.ogTitle !== undefined) {
    patch.ogTitle =
      typeof raw.ogTitle === "string" && raw.ogTitle.trim() ? raw.ogTitle.trim() : null
  }
  if (raw.ogDescription !== undefined) {
    patch.ogDescription =
      typeof raw.ogDescription === "string" && raw.ogDescription.trim()
        ? raw.ogDescription.trim()
        : null
  }
  if (raw.ogImageUrl !== undefined) {
    patch.ogImageUrl =
      typeof raw.ogImageUrl === "string" && raw.ogImageUrl.trim()
        ? raw.ogImageUrl.trim()
        : null
  }
  if (raw.schemaType !== undefined) {
    patch.schemaType = (raw.schemaType as SaveSeoPatch["schemaType"]) ?? null
  }
  if (raw.schemaJsonText !== undefined && typeof raw.schemaJsonText === "string") {
    const text = raw.schemaJsonText.trim()
    if (!text) {
      patch.schemaJson = null
    } else {
      try {
        patch.schemaJson = JSON.parse(text) as Record<string, unknown>
      } catch {
        throw new Error("Schema JSON geçerli bir JSON değil.")
      }
    }
  } else if (raw.schemaJson !== undefined) {
    patch.schemaJson = raw.schemaJson as Record<string, unknown> | null
  }

  return patch
}

export async function saveEntitySeoAction(input: {
  entityType: SeoEntityType
  entityId: string
  revision: number
  patch: Record<string, unknown>
}): Promise<{ ok: true; record: unknown; warnings: unknown[] } | { ok: false; error: string }> {
  const auth = await requireLoggedInAdmin()
  if (!auth.ok) return auth

  try {
    const patch = parsePatch(input.patch)
    const allowAdvanced = canEditAdvanced(auth.admin.role)

    const { record, warnings } = await saveSeo({
      entityType: input.entityType,
      entityId: input.entityId,
      revision: input.revision,
      patch,
      actorId: auth.admin.id,
      allowAdvanced,
    })

    const publishCheck = checkPublishable(record)
    const score = calculateSeoScore(record)

    return {
      ok: true,
      record: { ...record, score, publishable: publishCheck.ok },
      warnings,
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "SEO kaydı başarısız.",
    }
  }
}

export async function getEntitySeoAction(
  entityType: SeoEntityType,
  entityId: string
): Promise<{ ok: true; seo: unknown } | { ok: false; error: string }> {
  const auth = await requireLoggedInAdmin()
  if (!auth.ok) return auth

  try {
    const seo = await resolveSeo(entityType, entityId)
    return { ok: true, seo }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "SEO verisi alınamadı.",
    }
  }
}

export async function runSeoBackfillAction(): Promise<
  { ok: true; report: unknown } | { ok: false; error: string }
> {
  const auth = await requireLoggedInAdmin()
  if (!auth.ok) return auth

  if (!canEditAdvanced(auth.admin.role)) {
    return { ok: false, error: "Bu işlem için yönetici yetkisi gerekli." }
  }

  try {
    const report = await runSeoBackfill()
    revalidateSite()
    return { ok: true, report }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "SEO backfill başarısız.",
    }
  }
}
