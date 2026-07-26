import { notFound } from "next/navigation"

import { readJson } from "@/lib/cms/store"
import { filterActive } from "@/lib/cms/soft-delete"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { GalleryItemForm } from "@/components/admin/website/gallery-item-form"
import { type CmsGalleryItem, type CmsGalleryCategory } from "@/lib/site/website-cms-types"

export const dynamic = "force-dynamic"

function newBlankItem(defaultCategoryId: string): CmsGalleryItem {
  return {
    id: `gal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    imageUrl: "",
    title: "",
    description: "",
    categoryId: defaultCategoryId,
    isActive: true,
    isFeatured: false,
  }
}

export default async function GalleryEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const isNew = id === "yeni"

  const cfg = await readJson<any>("cms-config.json")
  const gallery = cfg?.galleryManagement || {}
  const categories: CmsGalleryCategory[] = filterActive<any>(
    Array.isArray(gallery.categories) ? gallery.categories : []
  )
  const items: CmsGalleryItem[] = filterActive<any>(Array.isArray(gallery.items) ? gallery.items : [])

  const defaultCatId = categories[0]?.id ?? "genel"

  let initial: CmsGalleryItem
  if (isNew) {
    initial = newBlankItem(defaultCatId)
  } else {
    const found = items.find((g: any) => String(g.id) === id)
    if (!found) notFound()

    initial = {
      id: String(found.id),
      imageUrl: String(found.imageUrl ?? ""),
      title: String(found.title ?? ""),
      description: String(found.description ?? ""),
      categoryId: String(found.categoryId ?? defaultCatId),
      isActive: found.isActive !== false,
      isFeatured: found.isFeatured === true,
    }
  }

  // Get current featured count for validation (except the item being edited)
  const categoryFeaturedCounts = new Map<string, number>()
  for (const item of items) {
     if (item.isFeatured && item.id !== initial.id) {
        categoryFeaturedCounts.set(item.categoryId, (categoryFeaturedCounts.get(item.categoryId) || 0) + 1)
     }
  }
  const maxFeaturedItemsReached = Array.from(categoryFeaturedCounts.entries()).reduce((acc, [catId, count]) => {
     if (count >= 5) {
       acc[catId] = true
     }
     return acc
  }, {} as Record<string, boolean>)

  return (
    <>
      <AdminPageHeader
        title={isNew ? "Yeni Galeri Görseli Ekle" : initial.title || "Görsel Düzenle"}
        description={
          isNew
            ? "Tesis galerisine yeni bir yüksek çözünürlüklü fotoğraf ekleyin."
            : "Galeri fotoğrafını, kategorisini ve başlığını düzenleyin."
        }
      />
      <GalleryItemForm initial={initial} categories={categories} isNew={isNew} categoryFeaturedStatus={maxFeaturedItemsReached} />
    </>
  )
}