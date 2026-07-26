import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { CorporateLegalEditor, type LegalPage } from "@/components/admin/legal/corporate-legal-editor"
import { getCmsPageContent } from "@/lib/site/page-content"
import { buildCorporatePageContent } from "@/lib/site/corporate-content"
import { CORPORATE_PAGES } from "@/lib/site/b2c"

export const dynamic = "force-dynamic"

export default async function YasalAdminPage() {
  // Public sayfaların okuduğu kaynağın AYNISINDAN besle (page-content.json → kurumsal).
  const cmsPageContent = await getCmsPageContent("kurumsal")
  const built = buildCorporatePageContent(cmsPageContent)
  const byslug = new Map(built.map((p) => [p.slug, p]))

  const pages: LegalPage[] = CORPORATE_PAGES.map((cp) => {
    const b = byslug.get(cp.slug)
    return {
      slug: cp.slug,
      label: cp.title,
      title: b?.title ?? cp.title,
      description: b?.description ?? cp.description,
      content: b?.content ?? "",
    }
  })

  return (
    <>
      <AdminPageHeader
        title="Yasal Metinler"
        description="Kurumsal sayfaların içerikleri (Kiralama Şartları, KVKK, İptal, Gizlilik…). Kaydettiğiniz an /kurumsal/… sayfalarında yayınlanır."
      />
      <CorporateLegalEditor initial={pages} />
    </>
  )
}
