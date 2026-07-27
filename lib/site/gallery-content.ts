import type { CmsGalleryItem, CmsGalleryManagement } from "@/lib/site/website-cms-types"

/**
 * Anasayfa galeri bölümünün kategori/görsel üretimi.
 *
 * Hem site (app/(site)/page.tsx) hem de yönetim panelindeki galeri bölümü
 * editörü buradan beslenir; böylece panel ile yayın arasında sapma olmaz.
 */

export type GalleryCategoryContent = {
  id: string
  label: string
  images: string[]
}

export const DEFAULT_GALLERY_CATEGORY_TABS: Array<{ id: string; label: string }> = [
  { id: "bungalovlar", label: "Bungalovlar" },
  { id: "odalar-suit", label: "Odalar/Suit" },
]

export function normalizeImages(images: string[]): string[] {
  return images.map((item) => String(item || "").trim()).filter((item) => item.length > 0)
}

/** CMS kategorisi yoksa görselleri iki varsayılan sekmeye bölerek gösterir. */
export function buildFallbackGalleryCategories(images: string[]): GalleryCategoryContent[] {
  const normalized = normalizeImages(images)
  if (normalized.length === 0) return []

  const first: string[] = []
  const second: string[] = []
  normalized.forEach((image, index) => {
    if (index % 2 === 0) first.push(image)
    else second.push(image)
  })

  return [
    {
      id: DEFAULT_GALLERY_CATEGORY_TABS[0].id,
      label: DEFAULT_GALLERY_CATEGORY_TABS[0].label,
      images: first.length > 0 ? first : normalized,
    },
    {
      id: DEFAULT_GALLERY_CATEGORY_TABS[1].id,
      label: DEFAULT_GALLERY_CATEGORY_TABS[1].label,
      images: second.length > 0 ? second : normalized,
    },
  ]
}

function groupImagesByCategory(
  items: CmsGalleryItem[],
  predicate: (item: CmsGalleryItem) => boolean
): Map<string, string[]> {
  const grouped = new Map<string, string[]>()
  items.filter(predicate).forEach((item) => {
    const imageUrl = String(item.imageUrl || "").trim()
    const categoryId = String(item.categoryId || "").trim()
    if (!imageUrl || !categoryId) return
    const list = grouped.get(categoryId) || []
    list.push(imageUrl)
    grouped.set(categoryId, list)
  })
  return grouped
}

/**
 * Anasayfa varyantı: önce "vitrin" (isFeatured) görseller kullanılır, yoksa
 * aktif olan diğer görsellerden kategori başına en fazla 5 tanesi alınır.
 * Hiçbiri yoksa yedek görsellerle iki varsayılan sekme üretilir.
 */
export function buildHomeGalleryCategories(
  galleryManagement: CmsGalleryManagement | CmsGalleryItem[] | null | undefined,
  fallbackImages: string[]
): GalleryCategoryContent[] {
  if (Array.isArray(galleryManagement)) {
    const legacyImages = normalizeImages(
      galleryManagement.filter((item) => item.isActive).map((item) => item.imageUrl)
    )
    return buildFallbackGalleryCategories(legacyImages.length > 0 ? legacyImages : fallbackImages)
  }

  const categories = (galleryManagement?.categories || [])
    .map((category) => ({
      id: String(category.id || "").trim(),
      label: String(category.name || "").trim(),
      isActive: category.isActive,
    }))
    .filter((category) => category.id.length > 0 && category.label.length > 0 && category.isActive)

  const items = galleryManagement?.items || []

  const featured = groupImagesByCategory(items, (item) => item.isActive && item.isFeatured === true)
  const featuredCategories = categories
    .map((category) => ({
      id: category.id,
      label: category.label,
      images: featured.get(category.id) || [],
    }))
    .filter((category) => category.images.length > 0)

  if (featuredCategories.length > 0) return featuredCategories

  const rest = groupImagesByCategory(items, (item) => item.isActive && item.isFeatured !== true)
  const restCategories = categories
    .map((category) => ({
      id: category.id,
      label: category.label,
      images: (rest.get(category.id) || []).slice(0, 5),
    }))
    .filter((category) => category.images.length > 0)

  if (restCategories.length > 0) return restCategories

  return buildFallbackGalleryCategories(fallbackImages)
}
