import type { Metadata } from "next"
import { GalleryPageContent } from "@/components/site/gallery-page-content"
import { PageIntro } from "@/components/site/page-intro"
import { bungalovQueries, websiteCmsQueries } from "@/lib/data/queries"
import { getCmsField, getCmsPageContent } from "@/lib/site/page-content"
import type { CmsGalleryManagement, CmsGalleryItem } from "@/lib/site/website-cms-types"
import { buildPageMetadata } from "@/lib/seo/resolve-metadata"
import { PAGE_ENTITY_IDS } from "@/lib/seo/page-ids"
import { getUiStrings, t } from "@/lib/cms/ui-strings"

import { BreadcrumbJsonLd } from "@/components/site/json-ld"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("page", PAGE_ENTITY_IDS.galeri.entityId, {
    title: "Foto Galeri | Sapanca Aden Bungalov Görselleri",
    description:
      "Sapanca Aden Bungalov fotoğraf galerisi: özel havuzlu ve jakuzili bungalovlar, doğa manzaralı teraslar, iç mekân ve tesis olanaklarından kareler.",
  })
}

const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1800&q=80"

const DEFAULT_GALLERY_CATEGORY_TABS: Array<{ id: string; label: string }> = [
  { id: "bungalovlar", label: "Bungalovlar" },
  { id: "odalar-suit", label: "Odalar/Suit" },
]

type GalleryCategoryContent = {
  id: string
  label: string
  images: string[]
}

function normalizeImages(images: string[]) {
  const seen = new Set<string>()
  return images
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .filter((item) => {
      if (seen.has(item)) return false
      seen.add(item)
      return true
    })
}

function buildFallbackGalleryCategories(images: string[]) {
  const normalized = normalizeImages(images)
  if (normalized.length === 0) return [] as GalleryCategoryContent[]

  const first: string[] = []
  const second: string[] = []
  normalized.forEach((image, index) => {
    if (index % 2 === 0) {
      first.push(image)
    } else {
      second.push(image)
    }
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

function buildGalleryCategories(
  galleryManagement: CmsGalleryManagement | CmsGalleryItem[] | null | undefined,
  fallbackImages: string[]
) {
  if (Array.isArray(galleryManagement)) {
    const legacyImages = galleryManagement
      .filter((item) => item.isActive)
      .map((item) => item.imageUrl.trim())
      .filter((item) => item.length > 0)
    return buildFallbackGalleryCategories(legacyImages.length > 0 ? legacyImages : fallbackImages)
  }

  const categories = (galleryManagement?.categories || [])
    .map((category) => ({
      id: category.id?.trim() || "",
      label: category.name?.trim() || "",
      isActive: category.isActive,
    }))
    .filter((category) => category.id.length > 0 && category.label.length > 0 && category.isActive)

  const groupedImages = new Map<string, string[]>()
  ;(galleryManagement?.items || [])
    .filter((item) => item.isActive)
    .forEach((item) => {
      const imageUrl = item.imageUrl.trim()
      if (!imageUrl) return
      const categoryId = item.categoryId?.trim()
      if (!categoryId) return
      const list = groupedImages.get(categoryId) || []
      list.push(imageUrl)
      groupedImages.set(categoryId, list)
    })

  const cmsCategories = categories
    .map((category) => ({
      id: category.id,
      label: category.label,
      images: normalizeImages(groupedImages.get(category.id) || []),
    }))
    .filter((category) => category.images.length > 0)

  if (cmsCategories.length > 0) {
    return cmsCategories
  }

  return buildFallbackGalleryCategories(fallbackImages)
}

export default async function GaleriPage() {
  const [rawBungalovs, cmsConfig, cmsPageContent, uiStrings] = await Promise.all([
    bungalovQueries.findMany({ status: "AKTIF" }, { orderBy: { name: "asc" } }),
    websiteCmsQueries.getConfig().catch(() => null),
    getCmsPageContent("galeri"),
    getUiStrings(),
  ])

  const bungalowImages = rawBungalovs
    .map((item) => String(item.image || "").trim())
    .filter((value) => value.length > 0)
  const fallbackImages = bungalowImages.length > 0 ? bungalowImages : [HERO_FALLBACK]

  const galleryCategories = buildGalleryCategories(cmsConfig?.galleryManagement, fallbackImages)
  const galleryTitle = getCmsField(cmsPageContent, "page-hero", "title", "Foto Galeri")
  const galleryDescription = getCmsField(
    cmsPageContent,
    "page-hero",
    "description",
    "Aden Bungalov galerisi: tüm kategorilerdeki görselleri keşfedin."
  )

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 pb-24 sm:px-6 md:pb-12">
      <BreadcrumbJsonLd
        items={[
          { name: "Ana Sayfa", url: "https://www.adenbungalov.com" },
          { name: "Foto Galeri", url: "https://www.adenbungalov.com/galeri" },
        ]}
      />
      <PageIntro title={galleryTitle} description={galleryDescription} />
      <GalleryPageContent
        categories={galleryCategories}
        filterAllLabel={t(uiStrings, "gallery.filterAll", "Tümü")}
        zoomLabel={t(uiStrings, "gallery.zoom", "Büyüt")}
        emptyLabel={t(uiStrings, "gallery.empty", "Bu kategori için henüz herhangi bir galeri görseli eklenmemiş.")}
        viewGridLabel={t(uiStrings, "gallery.viewGrid", "Izgara Görünümü")}
        viewListLabel={t(uiStrings, "gallery.viewList", "Liste Görünümü")}
      />
    </div>
  )
}
