import type { MetadataRoute } from "next"
import { bungalovQueries, settingsQueries } from "@/lib/data/queries"
import { listSeoMeta } from "@/lib/seo/seo-meta-repository"
import { bungalowPathFromSlug, normalizePath } from "@/lib/seo/path"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await settingsQueries.findFirst().catch(() => null)
  const baseUrl = (settings?.website || "https://www.adenbungalov.com").replace(/\/+$/, "")

  const seoRows = await listSeoMeta().catch(() => [])
  const entries: MetadataRoute.Sitemap = []

  for (const row of seoRows) {
    if (!row.robotsIndex) continue
    if (row.entityType === "page") {
      const path = row.path ? normalizePath(row.path) : null
      if (!path) continue
      entries.push({
        url: path === "/" ? baseUrl : `${baseUrl}${path}`,
        lastModified: new Date(row.updatedAt),
        changeFrequency: row.changeFreq,
        priority: row.priority,
      })
    }
  }

  try {
    const bungalows = await bungalovQueries.findMany({ status: "AKTIF" })
    const seoByEntity = new Map(
      seoRows.filter((r) => r.entityType === "bungalow").map((r) => [r.entityId, r])
    )

    for (const b of bungalows) {
      const seo = seoByEntity.get(b.id)
      if (seo && !seo.robotsIndex) continue
      const slug = (seo?.slug || b.slug || b.id).trim()
      const path = bungalowPathFromSlug(slug)
      entries.push({
        url: `${baseUrl}${path}`,
        lastModified: new Date(seo?.updatedAt || b.updatedAt || Date.now()),
        changeFrequency: seo?.changeFreq || "weekly",
        priority: seo?.priority ?? 0.8,
      })
    }
  } catch (error) {
    console.error("Failed to fetch bungalows for sitemap:", error)
  }

  // Deduplicate by URL
  const seen = new Set<string>()
  return entries.filter((e) => {
    if (seen.has(e.url)) return false
    seen.add(e.url)
    return true
  })
}
