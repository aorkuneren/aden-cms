import { readJson } from "@/lib/cms/store"
import { filterActive } from "@/lib/cms/soft-delete"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { SliderEditor, type SliderItem } from "@/components/admin/website/slider-editor"

export const dynamic = "force-dynamic"

function normalize(raw: unknown): SliderItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map((it: any) => ({
    id: String(it?.id ?? `slider-${Math.random().toString(36).slice(2, 8)}`),
    imageUrl: String(it?.imageUrl ?? ""),
    videoUrl: it?.videoUrl ? String(it.videoUrl) : "",
    mediaType: it?.mediaType === "VIDEO" ? "VIDEO" : "IMAGE",
    title: String(it?.title ?? ""),
    description: String(it?.description ?? ""),
    tags: Array.isArray(it?.tags) ? it.tags.map((t: unknown) => String(t)) : [],
    isActive: it?.isActive !== false,
    badgeText: it?.badgeText ? String(it.badgeText) : "",
    buttonText: it?.buttonText ? String(it.buttonText) : "",
    buttonUrl: it?.buttonUrl ? String(it.buttonUrl) : "",
    secondaryButtonText: it?.secondaryButtonText ? String(it.secondaryButtonText) : "",
    secondaryButtonUrl: it?.secondaryButtonUrl ? String(it.secondaryButtonUrl) : "",
    overlayOpacity: typeof it?.overlayOpacity === "number" ? it.overlayOpacity : 50,
  }))
}

export default async function SliderAdminPage() {
  const cfg = await readJson<any>("cms-config.json")
  const items = normalize(filterActive(Array.isArray(cfg?.sliderManagement) ? cfg.sliderManagement : []))

  const raw = cfg?.sliderSettings ?? {}
  const settings = {
    autoplayEnabled: raw.autoplayEnabled !== false,
    autoplaySeconds: typeof raw.autoplaySeconds === "number" && raw.autoplaySeconds >= 2 ? raw.autoplaySeconds : 5,
    pauseOnHover: raw.pauseOnHover !== false,
  }

  return (
    <>
      <AdminPageHeader
        title="2026 Süper Hero Slider Yönetimi"
        description="Anasayfa hero vitrin slaytlarını, video kaplamalarını, fırsat rozetlerini ve CTA butonlarını yönetin."
      />
      <SliderEditor initial={items} settings={settings} />
    </>
  )
}
