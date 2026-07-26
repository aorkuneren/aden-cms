import { readJson, mutateJson } from "@/lib/cms/store"
import { normalizeMetaTitleKey, normalizePath, normalizeSlugKey } from "@/lib/seo/path"
import { seoMetaListSchema } from "@/lib/seo/schemas"
import type { SeoEntityType, SeoLocale, SeoMetaRecord, SeoQualityWarning } from "@/lib/seo/types"

const FILE = "seo-meta.json"

export async function listSeoMeta(): Promise<SeoMetaRecord[]> {
  try {
    const raw = await readJson<unknown>(FILE)
    const parsed = seoMetaListSchema.safeParse(raw)
    return parsed.success ? (parsed.data as SeoMetaRecord[]) : []
  } catch {
    return []
  }
}

export async function findByEntity(
  entityType: SeoEntityType,
  entityId: string,
  locale: SeoLocale = "tr"
): Promise<SeoMetaRecord | null> {
  const rows = await listSeoMeta()
  return rows.find((r) => r.entityType === entityType && r.entityId === entityId && r.locale === locale) ?? null
}

export async function findBySlug(
  entityType: SeoEntityType,
  locale: SeoLocale,
  slug: string
): Promise<SeoMetaRecord | null> {
  const key = normalizeSlugKey(slug)
  if (!key) return null
  const rows = await listSeoMeta()
  return (
    rows.find(
      (r) =>
        r.entityType === entityType &&
        r.locale === locale &&
        r.slug &&
        normalizeSlugKey(r.slug) === key
    ) ?? null
  )
}

export function findDuplicateMetaTitle(
  rows: SeoMetaRecord[],
  metaTitle: string,
  locale: SeoLocale,
  excludeId?: string
): SeoMetaRecord | null {
  const key = normalizeMetaTitleKey(metaTitle)
  if (!key) return null
  return (
    rows.find(
      (r) =>
        r.locale === locale &&
        r.id !== excludeId &&
        normalizeMetaTitleKey(r.metaTitle) === key
    ) ?? null
  )
}

export function assertSlugUnique(
  rows: SeoMetaRecord[],
  entityType: SeoEntityType,
  locale: SeoLocale,
  slug: string,
  excludeId?: string
): void {
  const key = normalizeSlugKey(slug)
  const clash = rows.find(
    (r) =>
      r.entityType === entityType &&
      r.locale === locale &&
      r.id !== excludeId &&
      r.slug &&
      normalizeSlugKey(r.slug) === key
  )
  if (clash) {
    throw new Error(`Bu URL adresi (slug) aynı dilde zaten kullanılıyor: ${key}`)
  }
}

export type UpsertSeoMetaInput = Omit<
  SeoMetaRecord,
  "id" | "createdAt" | "updatedAt" | "updatedBy" | "revision"
> & {
  id?: string
  revision?: number
}

export async function upsertSeoMeta(
  input: UpsertSeoMetaInput,
  options: { expectedRevision?: number; actorId: string | null }
): Promise<{ record: SeoMetaRecord; warnings: SeoQualityWarning[] }> {
  const now = new Date().toISOString()
  const warnings: SeoQualityWarning[] = []

  const result = await mutateJson<SeoMetaRecord[]>(FILE, async (current) => {
    const rows = Array.isArray(current) ? [...current] : []
    const existingIdx = rows.findIndex(
      (r) =>
        r.entityType === input.entityType &&
        r.entityId === input.entityId &&
        r.locale === input.locale
    )
    const existing = existingIdx >= 0 ? rows[existingIdx] : null

    if (existing && options.expectedRevision !== undefined && existing.revision !== options.expectedRevision) {
      throw new Error("SEO_REVISION_CONFLICT")
    }

    if (input.entityType === "bungalow" && input.slug) {
      assertSlugUnique(rows, input.entityType, input.locale, input.slug, existing?.id)
    }

    if (input.entityType === "page" && input.path) {
      const path = normalizePath(input.path)
      const pathClash = rows.find(
        (r) =>
          r.entityType === "page" &&
          r.locale === input.locale &&
          r.id !== existing?.id &&
          r.path &&
          normalizePath(r.path) === path
      )
      if (pathClash) {
        throw new Error(`Bu sayfa yolu zaten kullanılıyor: ${path}`)
      }
    }

    const dup = findDuplicateMetaTitle(rows, input.metaTitle, input.locale, existing?.id)
    if (dup) {
      warnings.push({
        level: "warning",
        code: "DUPLICATE_META_TITLE",
        message: "Aynı dilde aynı meta başlık başka bir kayıtta kullanılıyor.",
      })
    }

    const record: SeoMetaRecord = {
      id: existing?.id ?? input.id ?? crypto.randomUUID(),
      entityType: input.entityType,
      entityId: input.entityId,
      locale: input.locale,
      path: input.path,
      slug: input.slug,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      focusKeyword: input.focusKeyword,
      canonicalUrl: input.canonicalUrl,
      robotsIndex: input.robotsIndex,
      robotsFollow: input.robotsFollow,
      ogTitle: input.ogTitle,
      ogDescription: input.ogDescription,
      ogImageUrl: input.ogImageUrl,
      schemaType: input.schemaType,
      schemaJson: input.schemaJson,
      priority: input.priority,
      changeFreq: input.changeFreq,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      updatedBy: options.actorId,
      revision: (existing?.revision ?? 0) + 1,
    }

    if (existingIdx >= 0) rows[existingIdx] = record
    else rows.push(record)

    return rows
  })

  const record =
    result.find(
      (r) =>
        r.entityType === input.entityType &&
        r.entityId === input.entityId &&
        r.locale === input.locale
    ) ?? null

  if (!record) throw new Error("SEO kaydı yazılamadı")
  return { record, warnings }
}

export async function replaceAllSeoMeta(rows: SeoMetaRecord[]): Promise<void> {
  await mutateJson<SeoMetaRecord[]>(FILE, () => rows)
}
