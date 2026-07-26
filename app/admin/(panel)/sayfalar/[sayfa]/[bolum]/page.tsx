import { notFound } from "next/navigation"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { SectionForm } from "@/components/admin/cms/section-form"
import { CtaSectionEditor, type CtaSectionData } from "@/components/admin/website/cta-section-editor"
import {
  GallerySectionEditor,
  type GallerySectionData,
} from "@/components/admin/website/gallery-section-editor"
import { getPreviewCompanyPhone, getPreviewGalleryCategories } from "@/lib/admin/preview-data"
import { readJson } from "@/lib/cms/store"
import { getSection, sectionDefaults } from "@/lib/cms/registry"

export const dynamic = "force-dynamic"

type SectionValues = Record<string, string>

function bool(value: string | undefined, fallback = true) {
  if (value === undefined || value === "") return fallback
  return value !== "false"
}

function int(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, Math.round(parsed)))
}

/**
 * Bölüm düzenleme ekranı.
 *
 * Çoğu bölüm kayıt defterindeki (registry) alan tanımlarından üretilen genel
 * forma düşer. Anasayfa galeri ve CTA bölümleri gibi görsel etkisi yüksek
 * olanlar ise kendi özel editörlerini kullanır.
 */
export default async function SectionEditPage({
  params,
}: {
  params: Promise<{ sayfa: string; bolum: string }>
}) {
  const { sayfa, bolum } = await params
  const section = getSection(sayfa, bolum)
  if (!section || section.kind !== "fields") notFound()

  const pageContent = await readJson<Record<string, Record<string, SectionValues>>>(
    "page-content.json"
  )
  const values = {
    ...sectionDefaults(section),
    ...(pageContent?.[sayfa]?.[bolum] ?? {}),
  } as SectionValues

  if (sayfa === "ana-sayfa" && bolum === "gallery") {
    const categories = await getPreviewGalleryCategories()
    const initial: GallerySectionData = {
      eyebrow: String(values.eyebrow ?? "Galeri"),
      title: String(values.title ?? ""),
      description: String(values.description ?? ""),
      maxImagesPerCategory: int(values.maxImagesPerCategory, 5, 1, 24),
      showViewAllButton: bool(values.showViewAllButton, true),
      viewAllLabel: String(values.viewAllLabel ?? "Tümünü Görüntüle"),
    }

    return (
      <>
        <AdminPageHeader
          title="Galeri Alanı"
          description="Anasayfa galeri bloğunun metinlerini ve ızgara davranışını yönetin."
        />
        <GallerySectionEditor initial={initial} categories={categories} />
      </>
    )
  }

  if (sayfa === "ana-sayfa" && bolum === "cta") {
    const companyPhone = await getPreviewCompanyPhone()

    const initial: CtaSectionData = {
      eyebrow: String(values.eyebrow ?? "Rezervasyon"),
      title: String(values.title ?? ""),
      description: String(values.description ?? ""),
      responseTitle: String(values.responseTitle ?? "Hızlı Dönüş"),
      responseDescription: String(values.responseDescription ?? ""),
      reservationButtonEnabled: bool(values.reservationButtonEnabled, true),
      reservationButtonLabel: String(values.reservationButtonLabel ?? "Hızlı Rezervasyon"),
      reservationButtonHref: String(values.reservationButtonHref ?? "/bungalovlarimiz"),
      phoneButtonEnabled: bool(values.phoneButtonEnabled, true),
      phoneButtonPrefix: String(values.phoneButtonPrefix ?? "Bizi Arayın:"),
      imageUrl1: String(values.imageUrl1 ?? ""),
      imageUrl2: String(values.imageUrl2 ?? ""),
    }

    return (
      <>
        <AdminPageHeader
          title="CTA Alanı"
          description="Anasayfa çağrı bloğunun metinlerini, butonlarını ve görsellerini yönetin."
        />
        <CtaSectionEditor initial={initial} companyPhone={companyPhone} />
      </>
    )
  }

  return (
    <>
      <AdminPageHeader
        title={section.label}
        description="Bu bölümün içerik alanlarını düzenleyin ve değişiklikleri siteye yansıtın."
      />
      <SectionForm
        pageSlug={sayfa}
        sectionKey={bolum}
        fields={section.fields ?? []}
        initialValues={values}
      />
    </>
  )
}
