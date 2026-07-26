import { notFound } from "next/navigation"

import { readJson } from "@/lib/cms/store"
import { filterActive } from "@/lib/cms/soft-delete"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { WhyAdenItemForm } from "@/components/admin/website/why-aden-item-form"
import { type CmsWhyAdenItem } from "@/lib/site/website-cms-types"

export const dynamic = "force-dynamic"

function newBlankItem(): CmsWhyAdenItem {
  return {
    id: `why-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "",
    description: "",
    icon: "Sparkles",
    imageUrl: "",
    isActive: true,
  }
}

export default async function WhyAdenEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const isNew = id === "yeni"

  let initial: CmsWhyAdenItem
  if (isNew) {
    initial = newBlankItem()
  } else {
    const cfg = await readJson<any>("cms-config.json")
    const list = filterActive<any>(Array.isArray(cfg?.whyAdenManagement) ? cfg.whyAdenManagement : [])
    const found = list.find((w: any) => String(w.id) === id)
    if (!found) notFound()

    initial = {
      id: String(found.id),
      title: String(found.title ?? ""),
      description: String(found.description ?? ""),
      icon: String(found.icon ?? "Sparkles"),
      imageUrl: String(found.imageUrl ?? ""),
      isActive: found.isActive !== false,
    }
  }

  return (
    <>
      <AdminPageHeader
        title={isNew ? "Yeni Tesis Avantajı Ekle" : initial.title || "Özellik Düzenle"}
        description={
          isNew
            ? "Anasayfada gösterilecek yeni bir Neden Aden avantaj kartı ekleyin."
            : "Tesis avantaj bilgilerini, ikonunu ve görselini düzenleyin."
        }
      />
      <WhyAdenItemForm initial={initial} isNew={isNew} />
    </>
  )
}
