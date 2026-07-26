import { readJson } from "@/lib/cms/store"
import { filterActive } from "@/lib/cms/soft-delete"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { FaqEditor, type FaqItem } from "@/components/admin/website/faq-editor"

export const dynamic = "force-dynamic"

function normalize(raw: unknown): FaqItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map((it: any) => ({
    id: String(it?.id ?? `faq-${Math.random().toString(36).slice(2, 8)}`),
    question: String(it?.question ?? ""),
    answer: String(it?.answer ?? ""),
    isActive: it?.isActive !== false,
    category: String(it?.category ?? "Genel"),
    isFeatured: Boolean(it?.isFeatured),
  }))
}

export default async function FaqAdminPage() {
  const cfg = await readJson<any>("cms-config.json")
  return (
    <>
      <AdminPageHeader
        title="Sıkça Sorulan Sorular (SSS) Yönetimi"
        description="Müşteri sorularını, kategorileri, cevap içeriklerini ve akordiyon görünümünü yönetin."
      />
      <FaqEditor initial={normalize(filterActive(Array.isArray(cfg?.faqManagement) ? cfg.faqManagement : []))} />
    </>
  )
}
