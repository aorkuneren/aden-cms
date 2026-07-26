import { readJson } from "@/lib/cms/store"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { SeoEditor, type SeoData, type PageSeoItem } from "@/components/admin/website/seo-editor"
import { listPageDefs } from "@/lib/seo/page-ids"
import { listSeoMeta } from "@/lib/seo/seo-meta-repository"

export const dynamic = "force-dynamic"

export default async function SeoAdminPage() {
  const cfg = await readJson<any>("cms-config.json")
  const sm = cfg?.siteManagement ?? {}
  const seoRows = await listSeoMeta().catch(() => [])
  const pageSeoById = new Map(
    seoRows.filter((r) => r.entityType === "page").map((r) => [r.entityId, r])
  )

  const legacyItems: PageSeoItem[] = Array.isArray(sm.pageSeoItems)
    ? sm.pageSeoItems.map((it: any) => ({
        id: String(it?.id ?? `seo-${Math.random().toString(36).slice(2, 8)}`),
        slug: String(it?.slug ?? ""),
        label: String(it?.label ?? ""),
        title: String(it?.title ?? ""),
        description: String(it?.description ?? ""),
        keywords: String(it?.keywords ?? ""),
      }))
    : []

  const pageSeoItems: PageSeoItem[] = listPageDefs().map((def) => {
    const fromMeta = pageSeoById.get(def.entityId)
    const legacy = legacyItems.find((i) => i.id === def.entityId)
    return {
      id: def.entityId,
      slug: def.path,
      label: def.label,
      title: fromMeta?.metaTitle || legacy?.title || "",
      description: fromMeta?.metaDescription || legacy?.description || "",
      keywords: legacy?.keywords || "",
    }
  })

  const initial: SeoData = {
    seoTitle: String(sm.seoTitle ?? ""),
    seoDescription: String(sm.seoDescription ?? ""),
    seoKeywords: String(sm.seoKeywords ?? ""),
    logoDarkUrl: String(sm.logoDarkUrl ?? ""),
    logoLightUrl: String(sm.logoLightUrl ?? ""),
    pageSeoItems,
  }

  return (
    <>
      <AdminPageHeader
        title="SEO"
        description="Arama motoru başlık/açıklama ve logo ayarları. Sayfa SEO’su merkezi seo-meta deposuna yazılır."
      />
      <SeoEditor initial={initial} />
    </>
  )
}
