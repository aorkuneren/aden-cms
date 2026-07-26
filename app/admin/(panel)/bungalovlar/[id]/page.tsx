import { notFound } from "next/navigation"

import { readJson } from "@/lib/cms/store"
import { filterActive } from "@/lib/cms/soft-delete"
import { readFeatureCatalog } from "@/lib/bungalov-feature-catalog"
import { readContentCatalog } from "@/lib/bungalov-content-catalog"
import {
  mergeContentCatalogWithDefaults,
  normalizeBungalovContentItems,
  presetToContentItem,
} from "@/lib/bungalov-content"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { BungalovForm, type BungalovFormData } from "@/components/admin/bungalov/bungalov-form"

export const dynamic = "force-dynamic"

const rid = () => `bng-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

function toForm(raw: any): BungalovFormData {
  return {
    id: String(raw?.id ?? rid()),
    name: String(raw?.name ?? ""),
    slug: String(raw?.slug ?? ""),
    image: String(raw?.image ?? ""),
    galleryImages: Array.isArray(raw?.galleryImages)
      ? Array.from(new Set(raw.galleryImages.map(String).filter((url: string) => url.trim().length > 0)))
      : [],
    capacity: Number(raw?.capacity ?? 2) || 2,
    description: String(raw?.description ?? ""),
    nightlyPrice: Number(raw?.nightlyPrice ?? 0) || 0,
    status: String(raw?.status ?? "AKTIF"),
    features: Array.isArray(raw?.features) ? raw.features.map(String) : [],
    rules: normalizeBungalovContentItems(raw?.rules),
    nearbyPlaces: normalizeBungalovContentItems(raw?.nearbyPlaces, { splitLegacyDistance: true }),
    bedrooms: raw?.bedrooms ?? null,
    areaSqm: raw?.areaSqm ?? null,
    poolType: String(raw?.poolType ?? ""),
    internet: String(raw?.internet ?? ""),
    address: String(raw?.address ?? ""),
    seoTitle: String(raw?.seoTitle ?? ""),
    seoDescription: String(raw?.seoDescription ?? ""),
    isFeatured: Boolean(raw?.isFeatured),
    sortOrder: Number(raw?.sortOrder ?? 0) || 0,
  }
}

export default async function BungalovEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string; panel?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const isNew = id === "yeni"

  const initialTab =
    query.tab === "gorseller" ||
    query.tab === "detaylar" ||
    query.tab === "kurallar" ||
    query.tab === "seo" ||
    query.tab === "genel"
      ? query.tab
      : "genel"
  const initialPanel = query.panel === "nearby" ? "nearby" : "rules"

  let initial: BungalovFormData
  const [featureCatalog, contentCatalog] = await Promise.all([
    readFeatureCatalog(),
    readContentCatalog(),
  ])
  const mergedContentPresets = mergeContentCatalogWithDefaults(contentCatalog)

  if (isNew) {
    initial = toForm({
      id: rid(),
      status: "AKTIF",
      capacity: 2,
      poolType: "Özel Isıtmalı Havuz",
      internet: "Fiber Wi-Fi",
      rules: mergedContentPresets.rules.map(presetToContentItem),
      nearbyPlaces: mergedContentPresets.nearbyPlaces.map(presetToContentItem),
    })
  } else {
    const list = await readJson<any[]>("bungalovs.json")
    const found = filterActive(Array.isArray(list) ? list : []).find((b) => String(b.id) === id)
    if (!found) notFound()
    initial = toForm(found)
  }

  return (
    <>
      <AdminPageHeader
        title={isNew ? "Yeni Bungalov" : initial.name || "Bungalov düzenle"}
        description={isNew ? "Yeni bir bungalov oluşturun." : "Bungalov bilgilerini düzenleyin."}
      />
      <BungalovForm
        initial={initial}
        isNew={isNew}
        initialTab={initialTab}
        initialPanel={initialPanel}
        featureCatalog={featureCatalog}
        contentCatalog={contentCatalog}
      />
    </>
  )
}
