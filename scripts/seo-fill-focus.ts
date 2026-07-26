import { readJson, mutateJson } from "../lib/cms/store"
import type { SeoMetaRecord } from "../lib/seo/types"

async function main() {
  const bungalows = await readJson<Array<Record<string, unknown>>>("bungalovs.json")
  const byId = new Map(bungalows.map((b) => [String(b.id), b]))

  await mutateJson<SeoMetaRecord[]>("seo-meta.json", (rows) =>
    rows.map((r) => {
      if (r.entityType !== "bungalow" || (r.focusKeyword && r.focusKeyword.trim())) return r
      const b = byId.get(r.entityId)
      const name = String(b?.name || r.slug || "bungalov")
      const kw = name.split(/\s+/)[0] || "bungalov"
      const title = r.metaTitle.trim() || `${name} | Aden Bungalov`
      const desc =
        r.metaDescription.trim() || String(b?.description || title).replace(/\s+/g, " ").slice(0, 155)
      return {
        ...r,
        focusKeyword: kw,
        metaTitle: title,
        metaDescription: desc,
        updatedAt: new Date().toISOString(),
        revision: r.revision + 1,
      }
    })
  )
  console.log("focusKeyword backfill done")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
