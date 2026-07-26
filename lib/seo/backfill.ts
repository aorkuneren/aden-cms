import { readJson } from "@/lib/cms/store"
import { bungalowPathFromSlug, normalizePath, slugifyTr } from "@/lib/seo/path"
import { listPageDefs } from "@/lib/seo/page-ids"
import { replaceAllSeoMeta, listSeoMeta } from "@/lib/seo/seo-meta-repository"
import type { BackfillReport, SeoMetaRecord, SeoSchemaType } from "@/lib/seo/types"

type PageSeoItem = {
  id: string
  slug: string
  label: string
  title: string
  description: string
}

type BungalowRow = {
  id: string
  name: string
  slug?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  description?: string
  image?: string
  status?: string
}

function nowIso() {
  return new Date().toISOString()
}

export async function runSeoBackfill(): Promise<BackfillReport> {
  const report: BackfillReport = {
    totalProcessed: 0,
    created: 0,
    skipped: 0,
    conflicts: 0,
    warnings: [],
  }

  const existing = await listSeoMeta()
  const byKey = new Map(existing.map((r) => [`${r.entityType}:${r.entityId}:${r.locale}`, r]))
  const next: SeoMetaRecord[] = [...existing]
  const slugSeen = new Map<string, string>() // locale|slug -> entityId

  for (const r of existing) {
    if (r.slug) slugSeen.set(`bungalow:tr:${slugifyTr(r.slug)}`, r.entityId)
  }

  // Pages
  let pageItems: PageSeoItem[] = []
  try {
    const config = await readJson<{ siteManagement?: { pageSeoItems?: PageSeoItem[] } }>(
      "cms-config.json"
    )
    pageItems = config.siteManagement?.pageSeoItems ?? []
  } catch {
    pageItems = []
  }

  const pageDefs = listPageDefs()
  const pageSources = new Map<string, PageSeoItem>()
  for (const item of pageItems) pageSources.set(item.id, item)

  for (const def of pageDefs) {
    report.totalProcessed++
    const key = `page:${def.entityId}:tr`
    if (byKey.has(key)) {
      report.skipped++
      continue
    }
    const src = pageSources.get(def.entityId)
    const ts = nowIso()
    const record: SeoMetaRecord = {
      id: crypto.randomUUID(),
      entityType: "page",
      entityId: def.entityId,
      locale: "tr",
      path: def.path,
      slug: null,
      metaTitle: src?.title?.trim() || "",
      metaDescription: src?.description?.trim() || "",
      focusKeyword: null,
      canonicalUrl: null,
      robotsIndex: true,
      robotsFollow: true,
      ogTitle: null,
      ogDescription: null,
      ogImageUrl: null,
      schemaType: def.schemaType as SeoSchemaType,
      schemaJson: null,
      priority: def.priority,
      changeFreq: def.changeFreq,
      createdAt: ts,
      updatedAt: ts,
      updatedBy: "backfill",
      revision: 1,
    }
    next.push(record)
    byKey.set(key, record)
    report.created++
  }

  // Bungalows
  let bungalows: BungalowRow[] = []
  try {
    bungalows = await readJson<BungalowRow[]>("bungalovs.json")
  } catch {
    bungalows = []
  }

  for (const b of bungalows) {
    report.totalProcessed++
    const key = `bungalow:${b.id}:tr`
    if (byKey.has(key)) {
      report.skipped++
      continue
    }
    let slug = (b.slug || "").trim() || slugifyTr(b.name)
    const slugKey = `bungalow:tr:${slug}`
    if (slugSeen.has(slugKey) && slugSeen.get(slugKey) !== b.id) {
      let n = 2
      while (slugSeen.has(`bungalow:tr:${slug}-${n}`)) n++
      report.conflicts++
      report.warnings.push(`Slug çakışması: ${slug} → ${slug}-${n} (${b.id})`)
      slug = `${slug}-${n}`
    }
    slugSeen.set(`bungalow:tr:${slug}`, b.id)

    const ts = nowIso()
    const record: SeoMetaRecord = {
      id: crypto.randomUUID(),
      entityType: "bungalow",
      entityId: b.id,
      locale: "tr",
      path: bungalowPathFromSlug(slug),
      slug,
      metaTitle: b.seoTitle?.trim() || "",
      metaDescription: b.seoDescription?.trim() || "",
      focusKeyword: null,
      canonicalUrl: null,
      robotsIndex: b.status !== "PASIF",
      robotsFollow: true,
      ogTitle: null,
      ogDescription: null,
      ogImageUrl: b.image || null,
      schemaType: "LodgingBusiness",
      schemaJson: null,
      priority: 0.8,
      changeFreq: "weekly",
      createdAt: ts,
      updatedAt: ts,
      updatedBy: "backfill",
      revision: 1,
    }
    next.push(record)
    byKey.set(key, record)
    report.created++
  }

  // Duplicate meta title warnings
  const titleMap = new Map<string, string[]>()
  for (const r of next) {
    const t = r.metaTitle.trim().toLocaleLowerCase("tr-TR")
    if (!t) continue
    const list = titleMap.get(t) ?? []
    list.push(r.entityId)
    titleMap.set(t, list)
  }
  for (const [title, ids] of titleMap) {
    if (ids.length > 1) {
      report.conflicts++
      report.warnings.push(`Yinelenen meta başlık "${title}": ${ids.join(", ")}`)
    }
  }

  await replaceAllSeoMeta(next)
  return report
}

export function normalizePathExport(path: string) {
  return normalizePath(path)
}
