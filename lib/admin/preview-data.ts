import { bungalovQueries, settingsQueries, websiteCmsQueries } from "@/lib/data/queries"
import { buildHomeGalleryCategories, normalizeImages } from "@/lib/site/gallery-content"
import type { GalleryCategoryContent } from "@/lib/site/gallery-content"

/**
 * Bölüm editörlerinin ihtiyaç duyduğu gerçek site verisi.
 *
 * Editörde doğru kararı verebilmek için içeriğin sitedeki karşılığı gerekir:
 * hangi bungalovlar vitrine girecek, galeri sekmelerinde kaç görsel var,
 * telefon butonu görünecek mi. Bu modül o veriyi tek yerden toplar.
 */

export type PreviewBungalow = {
  id: string
  name: string
  description: string
  image: string
  capacity: number
  nightlyPrice: number
  isFeatured: boolean
}

/** Sitedeki vitrin sıralamasının aynısı: önce öne çıkanlar, sonra sıra no, sonra ad. */
export async function getPreviewBungalows(): Promise<PreviewBungalow[]> {
  const rows = await bungalovQueries.findMany({ status: "AKTIF" }, { orderBy: { name: "asc" } })

  return [...rows]
    .sort((a, b) => {
      const aFeatured = (a as { isFeatured?: boolean }).isFeatured ? 1 : 0
      const bFeatured = (b as { isFeatured?: boolean }).isFeatured ? 1 : 0
      if (bFeatured !== aFeatured) return bFeatured - aFeatured
      const aOrder = Number((a as { sortOrder?: number }).sortOrder) || 0
      const bOrder = Number((b as { sortOrder?: number }).sortOrder) || 0
      if (aOrder !== bOrder) return aOrder - bOrder
      return String(a.name || "").localeCompare(String(b.name || ""), "tr")
    })
    .map((row) => ({
      id: String(row.id || ""),
      name: String(row.name || ""),
      description: String(row.description || ""),
      image: String(row.image || "").trim(),
      capacity: Number(row.capacity) || 2,
      nightlyPrice: Number(row.nightlyPrice) || 0,
      isFeatured: Boolean((row as { isFeatured?: boolean }).isFeatured),
    }))
}

/** Anasayfa galeri bölümünün sekmeleri — site ile birebir aynı mantık. */
export async function getPreviewGalleryCategories(): Promise<GalleryCategoryContent[]> {
  const [cmsConfig, bungalows] = await Promise.all([
    websiteCmsQueries.getConfig().catch(() => null),
    bungalovQueries.findMany({ status: "AKTIF" }, { orderBy: { name: "asc" } }),
  ])

  const bungalowImages = normalizeImages(bungalows.map((item) => String(item.image || "")))
  return buildHomeGalleryCategories(cmsConfig?.galleryManagement, bungalowImages)
}

/** CTA telefon butonu ayarlardaki numaraya bağlı; numara yoksa buton çizilmez. */
export async function getPreviewCompanyPhone(): Promise<string> {
  const settings = await settingsQueries.findFirst()
  return String(settings?.phone || "").trim()
}
