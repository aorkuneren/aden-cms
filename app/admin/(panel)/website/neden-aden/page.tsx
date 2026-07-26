import { readJson } from "@/lib/cms/store"
import { filterActive } from "@/lib/cms/soft-delete"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { WhyAdenEditor, type WhyItem } from "@/components/admin/website/why-aden-editor"

export const dynamic = "force-dynamic"

function normalize(raw: unknown): WhyItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map((it: any) => ({
    id: String(it?.id ?? `why-${Math.random().toString(36).slice(2, 8)}`),
    title: String(it?.title ?? ""),
    description: String(it?.description ?? ""),
    icon: String(it?.icon ?? "Sparkles"),
    imageUrl: String(it?.imageUrl ?? ""),
    isActive: it?.isActive !== false,
  }))
}

export default async function WhyAdenAdminPage() {
  const cfg = await readJson<any>("cms-config.json")
  return (
    <>
      <AdminPageHeader
        title="Neden Aden Avantaj Yönetimi"
        description="Anasayfadaki tesis avantajlarını, ikonlarını ve özellik kartlarını yönetin."
      />
      <WhyAdenEditor initial={normalize(filterActive(Array.isArray(cfg?.whyAdenManagement) ? cfg.whyAdenManagement : []))} />
    </>
  )
}
