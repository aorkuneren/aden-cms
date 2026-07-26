import { readJson } from "@/lib/cms/store"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { SeoEditor, type SeoData, type PageSeoItem } from "@/components/admin/website/seo-editor"

export const dynamic = "force-dynamic"

export default async function SeoAdminPage() {
  const cfg = await readJson<any>("cms-config.json")
  const sm = cfg?.siteManagement ?? {}

  const pageSeoItems: PageSeoItem[] = Array.isArray(sm.pageSeoItems)
    ? sm.pageSeoItems.map((it: any) => ({
        id: String(it?.id ?? `seo-${Math.random().toString(36).slice(2, 8)}`),
        slug: String(it?.slug ?? ""),
        label: String(it?.label ?? ""),
        title: String(it?.title ?? ""),
        description: String(it?.description ?? ""),
        keywords: String(it?.keywords ?? ""),
      }))
    : []

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
      <AdminPageHeader title="SEO" description="Arama motoru başlık/açıklama ve logo ayarları." />
      <SeoEditor initial={initial} />
    </>
  )
}
