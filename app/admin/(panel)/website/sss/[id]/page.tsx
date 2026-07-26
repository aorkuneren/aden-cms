import { notFound } from "next/navigation"

import { readJson } from "@/lib/cms/store"
import { filterActive } from "@/lib/cms/soft-delete"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { FaqItemForm } from "@/components/admin/website/faq-item-form"
import { type CmsFaqItem } from "@/lib/site/website-cms-types"

export const dynamic = "force-dynamic"

function newBlankFaq(): CmsFaqItem {
  return {
    id: `faq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    question: "",
    answer: "",
    category: "Genel",
    isActive: true,
    isFeatured: false,
  }
}

export default async function FaqEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const isNew = id === "yeni"

  let initial: CmsFaqItem
  if (isNew) {
    initial = newBlankFaq()
  } else {
    const cfg = await readJson<any>("cms-config.json")
    const list = filterActive<any>(Array.isArray(cfg?.faqManagement) ? cfg.faqManagement : [])
    const found = list.find((f: any) => String(f.id) === id)
    if (!found) notFound()

    initial = {
      id: String(found.id),
      question: String(found.question ?? ""),
      answer: String(found.answer ?? ""),
      category: String(found.category ?? "Genel"),
      isActive: found.isActive !== false,
      isFeatured: Boolean(found.isFeatured),
    }
  }

  return (
    <>
      <AdminPageHeader
        title={isNew ? "Yeni SSS Sorusu Ekle" : initial.question || "Soru Düzenle"}
        description={
          isNew
            ? "Müşterilerinizin sık sorduğu yeni bir soruyu ve cevabını ekleyin."
            : "Sıkça sorulan soru cümlesini, cevap metnini ve kategorisini düzenleyin."
        }
      />
      <FaqItemForm initial={initial} isNew={isNew} />
    </>
  )
}
