import { notFound } from "next/navigation"

import { readJson } from "@/lib/cms/store"
import { filterActive } from "@/lib/cms/soft-delete"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { SliderItemForm } from "@/components/admin/website/slider-item-form"
import { type CmsSliderItem } from "@/lib/site/website-cms-types"

export const dynamic = "force-dynamic"

function newBlankSlide(): CmsSliderItem {
  return {
    id: `slider-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    imageUrl: "",
    videoUrl: "",
    mediaType: "IMAGE",
    title: "",
    description: "",
    tags: [],
    isActive: true,
    badgeText: "",
    buttonText: "",
    buttonUrl: "",
    secondaryButtonText: "",
    secondaryButtonUrl: "",
    overlayOpacity: 50,
  }
}

export default async function SliderEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const isNew = id === "yeni"

  let initial: CmsSliderItem
  if (isNew) {
    initial = newBlankSlide()
  } else {
    const cfg = await readJson<any>("cms-config.json")
    const list = filterActive<any>(Array.isArray(cfg?.sliderManagement) ? cfg.sliderManagement : [])
    const found = list.find((s: any) => String(s.id) === id)
    if (!found) notFound()

    initial = {
      id: String(found.id),
      imageUrl: String(found.imageUrl ?? ""),
      videoUrl: found.videoUrl ? String(found.videoUrl) : "",
      mediaType: found.mediaType === "VIDEO" ? "VIDEO" : "IMAGE",
      title: String(found.title ?? ""),
      description: String(found.description ?? ""),
      tags: Array.isArray(found.tags) ? found.tags.map((t: unknown) => String(t)) : [],
      isActive: found.isActive !== false,
      badgeText: found.badgeText ? String(found.badgeText) : "",
      buttonText: found.buttonText ? String(found.buttonText) : "",
      buttonUrl: found.buttonUrl ? String(found.buttonUrl) : "",
      secondaryButtonText: found.secondaryButtonText ? String(found.secondaryButtonText) : "",
      secondaryButtonUrl: found.secondaryButtonUrl ? String(found.secondaryButtonUrl) : "",
      overlayOpacity: typeof found.overlayOpacity === "number" ? found.overlayOpacity : 50,
    }
  }

  return (
    <>
      <AdminPageHeader
        title={isNew ? "Yeni Hero Slayt Ekle" : initial.title || "Slayt Düzenle"}
        description={
          isNew
            ? "Anasayfa hero vitrin alanı için yeni bir slayt oluşturun."
            : "Slayt bilgilerini, medyasını ve buton aksiyonlarını düzenleyin."
        }
      />
      <SliderItemForm initial={initial} isNew={isNew} />
    </>
  )
}
