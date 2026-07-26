import { withFileLock } from "@/lib/cms/file-lock"
import { mutateJson, readJson, revalidateSite } from "@/lib/cms/store"
import {
  applySeoFallbacks,
  buildLengthWarnings,
  normalizeCanonicalUrl,
  resolveAbsoluteCanonical,
} from "@/lib/seo/fallback"
import { logLegacyFallback } from "@/lib/seo/legacy-log"
import { bungalowPathFromSlug, normalizePath, slugifyTr } from "@/lib/seo/path"
import { getPageDefByEntityId } from "@/lib/seo/page-ids"
import { buildSchemaJson } from "@/lib/seo/schema-templates"
import { validateSchemaJson } from "@/lib/seo/schema-validate"
import { assertPublishable, calculateSeoScore, type ScoreContext } from "@/lib/seo/score"
import {
  findByEntity,
  listSeoMeta,
  upsertSeoMeta,
  type UpsertSeoMetaInput,
} from "@/lib/seo/seo-meta-repository"
import { createRedirect } from "@/lib/seo/seo-redirect-service"
import type {
  FallbackContext,
  ResolvedSeo,
  SeoEntityType,
  SeoLocale,
  SeoMetaRecord,
  SeoQualityWarning,
  SeoSchemaType,
} from "@/lib/seo/types"

export type SaveSeoPatch = Partial<{
  metaTitle: string
  metaDescription: string
  focusKeyword: string | null
  slug: string | null
  path: string | null
  canonicalUrl: string | null
  robotsIndex: boolean
  robotsFollow: boolean
  ogTitle: string | null
  ogDescription: string | null
  ogImageUrl: string | null
  schemaType: SeoSchemaType
  schemaJson: Record<string, unknown> | null
  priority: number
  changeFreq: SeoMetaRecord["changeFreq"]
}>

function defaultRecord(
  entityType: SeoEntityType,
  entityId: string,
  locale: SeoLocale
): SeoMetaRecord {
  const page = entityType === "page" ? getPageDefByEntityId(entityId) : null
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    entityType,
    entityId,
    locale,
    path: page?.path ?? null,
    slug: null,
    metaTitle: "",
    metaDescription: "",
    focusKeyword: null,
    canonicalUrl: null,
    robotsIndex: true,
    robotsFollow: true,
    ogTitle: null,
    ogDescription: null,
    ogImageUrl: null,
    schemaType: page?.schemaType ?? (entityType === "bungalow" ? "LodgingBusiness" : "WebPage"),
    schemaJson: null,
    priority: page?.priority ?? (entityType === "bungalow" ? 0.8 : 0.5),
    changeFreq: page?.changeFreq ?? "weekly",
    createdAt: now,
    updatedAt: now,
    updatedBy: null,
    revision: 0,
  }
}

async function loadLegacyHints(
  entityType: SeoEntityType,
  entityId: string
): Promise<Partial<SeoMetaRecord>> {
  if (entityType === "bungalow") {
    try {
      const rows = await readJson<Array<{
        id: string
        seoTitle?: string | null
        seoDescription?: string | null
        slug?: string | null
        name?: string
      }>>("bungalovs.json")
      const row = rows.find((r) => r.id === entityId)
      if (!row) return {}
      const hints: Partial<SeoMetaRecord> = {}
      if (row.seoTitle?.trim()) {
        hints.metaTitle = row.seoTitle.trim()
        await logLegacyFallback({ entityType, entityId, field: "seoTitle" })
      }
      if (row.seoDescription?.trim()) {
        hints.metaDescription = row.seoDescription.trim()
        await logLegacyFallback({ entityType, entityId, field: "seoDescription" })
      }
      if (row.slug?.trim()) {
        hints.slug = row.slug.trim()
        await logLegacyFallback({ entityType, entityId, field: "slug" })
      }
      return hints
    } catch {
      return {}
    }
  }

  if (entityType === "page") {
    try {
      const config = await readJson<{
        siteManagement?: {
          pageSeoItems?: Array<{
            id: string
            slug: string
            title?: string
            description?: string
          }>
        }
      }>("cms-config.json")
      const item = config.siteManagement?.pageSeoItems?.find((i) => i.id === entityId)
      if (!item) return {}
      const hints: Partial<SeoMetaRecord> = {}
      if (item.title?.trim()) {
        hints.metaTitle = item.title.trim()
        await logLegacyFallback({ entityType, entityId, field: "pageSeoItems.title" })
      }
      if (item.description?.trim()) {
        hints.metaDescription = item.description.trim()
        await logLegacyFallback({ entityType, entityId, field: "pageSeoItems.description" })
      }
      if (item.slug) hints.path = normalizePath(item.slug)
      return hints
    } catch {
      return {}
    }
  }

  return {}
}

async function siteDefaults(): Promise<{ siteName: string; baseUrl: string; defaultOg?: string }> {
  let siteName = "Aden Bungalov"
  let baseUrl = "https://www.adenbungalov.com"
  let defaultOg: string | undefined
  try {
    const config = await readJson<{
      siteManagement?: { seoTitle?: string; logoDarkUrl?: string }
    }>("cms-config.json")
    if (config.siteManagement?.seoTitle?.trim()) siteName = config.siteManagement.seoTitle.trim()
    if (config.siteManagement?.logoDarkUrl) defaultOg = config.siteManagement.logoDarkUrl
  } catch {
    /* ignore */
  }
  try {
    const settings = await readJson<{ website?: string }>("settings.json")
    if (settings.website) baseUrl = settings.website.replace(/\/+$/, "")
  } catch {
    /* ignore */
  }
  return { siteName, baseUrl, defaultOg }
}

export async function resolveSeo(
  entityType: SeoEntityType,
  entityId: string,
  options: {
    locale?: SeoLocale
    fallback?: Partial<FallbackContext>
    scoreContext?: ScoreContext
  } = {}
): Promise<ResolvedSeo> {
  const locale = options.locale ?? "tr"
  let record = await findByEntity(entityType, entityId, locale)
  if (!record) {
    const base = defaultRecord(entityType, entityId, locale)
    const legacy = await loadLegacyHints(entityType, entityId)
    record = { ...base, ...legacy, id: base.id, revision: 0 }
  }

  const defaults = await siteDefaults()
  const page = entityType === "page" ? getPageDefByEntityId(entityId) : null
  const ctx: FallbackContext = {
    title: options.fallback?.title || page?.label || entityId,
    siteName: options.fallback?.siteName || defaults.siteName,
    bodyHtml: options.fallback?.bodyHtml,
    featuredImageUrl: options.fallback?.featuredImageUrl,
    defaultOgImageUrl: options.fallback?.defaultOgImageUrl || defaults.defaultOg,
    path: options.fallback?.path || record.path || page?.path || "/",
    baseUrl: options.fallback?.baseUrl || defaults.baseUrl,
  }

  const filled = applySeoFallbacks(record, ctx)
  if (filled.slug && !filled.path) {
    filled.path = bungalowPathFromSlug(filled.slug)
  }

  let canonicalUrl = filled.canonicalUrl
  const { canonicalPath, absoluteCanonical } = resolveAbsoluteCanonical(filled, ctx.baseUrl)
  try {
    canonicalUrl = normalizeCanonicalUrl(canonicalUrl, absoluteCanonical)
  } catch {
    canonicalUrl = null
  }
  filled.canonicalUrl = canonicalUrl

  const warnings = buildLengthWarnings(filled)
  const score = calculateSeoScore(filled, options.scoreContext)

  return {
    ...filled,
    canonicalPath,
    absoluteCanonical: filled.canonicalUrl || absoluteCanonical,
    warnings,
    score,
  }
}

export async function saveSeo(input: {
  entityType: SeoEntityType
  entityId: string
  locale?: SeoLocale
  revision?: number
  patch: SaveSeoPatch
  actorId: string | null
  allowAdvanced?: boolean
  fallbackTitle?: string
  bodyHtml?: string
  featuredImageUrl?: string
}): Promise<{ record: SeoMetaRecord; warnings: SeoQualityWarning[] }> {
  const locale = input.locale ?? "tr"
  const existing = await findByEntity(input.entityType, input.entityId, locale)
  const base = existing ?? defaultRecord(input.entityType, input.entityId, locale)

  const patch = { ...input.patch }
  if (!input.allowAdvanced) {
    delete patch.canonicalUrl
    delete patch.robotsIndex
    delete patch.robotsFollow
    delete patch.schemaJson
  }

  if (patch.schemaJson !== undefined && patch.schemaJson !== null) {
    const validated = validateSchemaJson(patch.schemaJson)
    if (!validated.ok) throw new Error(validated.error)
    patch.schemaJson = Object.keys(validated.value).length ? validated.value : null
  }

  let slug = patch.slug !== undefined ? patch.slug : base.slug
  let path = patch.path !== undefined ? patch.path : base.path

  if (input.entityType === "bungalow") {
    if (slug) slug = slugifyTr(slug)
    path = slug ? bungalowPathFromSlug(slug) : null
  } else {
    const page = getPageDefByEntityId(input.entityId)
    path = page?.path ?? (path ? normalizePath(path) : null)
    slug = null
  }

  const defaults = await siteDefaults()
  const selfPath = path || (slug ? bungalowPathFromSlug(slug) : "/")
  const selfAbsolute =
    normalizePath(selfPath) === "/"
      ? `${defaults.baseUrl}/`
      : `${defaults.baseUrl}${normalizePath(selfPath)}`

  let canonicalUrl =
    patch.canonicalUrl !== undefined ? patch.canonicalUrl : base.canonicalUrl
  if (canonicalUrl !== undefined) {
    canonicalUrl = normalizeCanonicalUrl(canonicalUrl, selfAbsolute)
  }

  const next: UpsertSeoMetaInput = {
    entityType: input.entityType,
    entityId: input.entityId,
    locale,
    path,
    slug,
    metaTitle: patch.metaTitle ?? base.metaTitle,
    metaDescription: patch.metaDescription ?? base.metaDescription,
    focusKeyword:
      patch.focusKeyword !== undefined ? patch.focusKeyword : base.focusKeyword,
    canonicalUrl: canonicalUrl ?? null,
    robotsIndex: patch.robotsIndex ?? base.robotsIndex,
    robotsFollow: patch.robotsFollow ?? base.robotsFollow,
    ogTitle: patch.ogTitle !== undefined ? patch.ogTitle : base.ogTitle,
    ogDescription:
      patch.ogDescription !== undefined ? patch.ogDescription : base.ogDescription,
    ogImageUrl: patch.ogImageUrl !== undefined ? patch.ogImageUrl : base.ogImageUrl,
    schemaType: patch.schemaType !== undefined ? patch.schemaType : base.schemaType,
    schemaJson: patch.schemaJson !== undefined ? patch.schemaJson : base.schemaJson,
    priority: patch.priority ?? base.priority,
    changeFreq: patch.changeFreq ?? base.changeFreq,
  }

  // Slug change → redirect (bungalow)
  const oldSlug = base.slug
  const newSlug = next.slug
  if (
    input.entityType === "bungalow" &&
    oldSlug &&
    newSlug &&
    slugifyTr(oldSlug) !== slugifyTr(newSlug)
  ) {
    return changeBungalowSlug({
      entityId: input.entityId,
      newSlug: newSlug,
      actorId: input.actorId,
      revision: input.revision ?? base.revision,
      patch: next,
    })
  }

  const { record, warnings } = await upsertSeoMeta(next, {
    expectedRevision: input.revision ?? (existing ? existing.revision : undefined),
    actorId: input.actorId,
  })

  // Sync bungalow.slug
  if (input.entityType === "bungalow" && record.slug) {
    await syncBungalowSlug(input.entityId, record.slug)
  }

  revalidateSite()
  return {
    record,
    warnings: [...warnings, ...buildLengthWarnings(record)],
  }
}

async function syncBungalowSlug(bungalowId: string, slug: string): Promise<void> {
  await mutateJson<Array<{ id: string; slug?: string | null }>>("bungalovs.json", (rows) => {
    if (!Array.isArray(rows)) return rows
    return rows.map((r) => (r.id === bungalowId ? { ...r, slug } : r))
  })
}

export async function changeBungalowSlug(input: {
  entityId: string
  newSlug: string
  actorId: string | null
  revision?: number
  patch?: UpsertSeoMetaInput
}): Promise<{ record: SeoMetaRecord; warnings: SeoQualityWarning[] }> {
  const newSlug = slugifyTr(input.newSlug)
  if (!newSlug) throw new Error("Slug boş olamaz.")

  return withFileLock("seo-transaction", async () => {
    const existing = await findByEntity("bungalow", input.entityId, "tr")
    if (!existing) {
      // create fresh then return
      const path = bungalowPathFromSlug(newSlug)
      const base = input.patch ?? {
        ...defaultRecord("bungalow", input.entityId, "tr"),
        slug: newSlug,
        path,
      }
      const { record, warnings } = await upsertSeoMeta(
        { ...base, slug: newSlug, path, entityType: "bungalow", entityId: input.entityId, locale: "tr" },
        { expectedRevision: input.revision, actorId: input.actorId }
      )
      await syncBungalowSlug(input.entityId, newSlug)
      revalidateSite()
      return { record, warnings }
    }

    const oldPath = existing.path || (existing.slug ? bungalowPathFromSlug(existing.slug) : null)
    const newPath = bungalowPathFromSlug(newSlug)

    const next: UpsertSeoMetaInput = {
      ...(input.patch ?? existing),
      entityType: "bungalow",
      entityId: input.entityId,
      locale: "tr",
      slug: newSlug,
      path: newPath,
    }

    const { record, warnings } = await upsertSeoMeta(next, {
      expectedRevision: input.revision ?? existing.revision,
      actorId: input.actorId,
    })

    if (oldPath && normalizePath(oldPath) !== normalizePath(newPath)) {
      await createRedirect({
        fromPath: oldPath,
        toPath: newPath,
        statusCode: 301,
        entityType: "bungalow",
        entityId: input.entityId,
        reason: "slug-change",
        actorId: input.actorId,
      })
    }

    await syncBungalowSlug(input.entityId, newSlug)
    revalidateSite()
    return { record, warnings: [...warnings, ...buildLengthWarnings(record)] }
  })
}

export function checkPublishable(
  record: Pick<SeoMetaRecord, "entityType" | "metaTitle" | "metaDescription" | "focusKeyword" | "slug">
) {
  return assertPublishable(record)
}

export async function ensureSchemaJson(record: SeoMetaRecord, ctx: {
  name: string
  description: string
  url: string
  imageUrl?: string | null
}): Promise<Record<string, unknown> | null> {
  if (record.schemaJson) {
    const v = validateSchemaJson(record.schemaJson)
    return v.ok ? v.value : null
  }
  return buildSchemaJson(record.schemaType, ctx)
}

export { listSeoMeta, findByEntity }
