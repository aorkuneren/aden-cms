import { getCmsPageContent } from "@/lib/site/page-content"
import { getPreviewBungalows } from "@/lib/admin/preview-data"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import {
  FeaturedBungalowsSectionEditor,
  type FeaturedBungalowsSectionData,
} from "@/components/admin/website/featured-bungalows-section-editor"

export const dynamic = "force-dynamic"

function boolField(value: string | undefined, fallback = true) {
  if (value === undefined || value === "") return fallback
  return value !== "false"
}

function intField(value: string | undefined, fallback: number, min: number, max: number) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

export default async function FeaturedBungalowsAdminPage() {
  const [content, bungalows] = await Promise.all([
    getCmsPageContent("ana-sayfa"),
    getPreviewBungalows(),
  ])
  const section = content["featured-bungalows"] ?? {}

  const initial: FeaturedBungalowsSectionData = {
    eyebrow: String(section.eyebrow ?? "Bungalovlarımız"),
    title: String(section.title ?? "Bungalovlarımız"),
    description: String(section.description ?? ""),
    emptyStateText: String(section.emptyStateText ?? "Şu anda yayında aktif bungalow bulunmuyor."),
    limit: intField(section.limit, 5, 1, 24),
    autoplayEnabled: boolField(section.autoplayEnabled, true),
    autoplaySeconds: intField(section.autoplaySeconds, 5, 2, 30),
    pauseOnHover: boolField(section.pauseOnHover, true),
    showDots: boolField(section.showDots, true),
    loop: boolField(section.loop, true),
  }

  return (
    <>
      <AdminPageHeader
        title="Bungalovlar Alanı"
        description="Vitrin metinlerini, kaç kart gösterileceğini ve carousel davranışını gerçek kayıtlar üzerinden yönetin."
      />
      <FeaturedBungalowsSectionEditor initial={initial} bungalows={bungalows} />
    </>
  )
}
