import fs from "fs/promises"
import path from "path"
import { mutateJson, readJson } from "@/lib/cms/store"
import { finalizeGalleryImage } from "@/lib/media/finalize-gallery"
import { toSeoSlug, uniqueCategoryId } from "@/lib/media/slug"
import { resolveUploadRoot } from "@/lib/media/upload"
import type { CmsGalleryCategory, CmsGalleryItem, WebsiteCmsConfig } from "@/lib/site/website-cms-types"

const CMS_CONFIG_FILE = "cms-config.json"

export type GalleryMigrateResult = {
  categoriesRemapped: number
  filesMigrated: number
  errors: string[]
}

type CategoryLike = { id: string; name: string; [k: string]: unknown }
type ItemLike = { categoryId: string; [k: string]: unknown }

export function remapGalleryCategoryIds<C extends CategoryLike, I extends ItemLike>(
  categories: C[],
  items: I[]
): {
  categories: C[]
  items: I[]
  idMap: Record<string, string>
} {
  const idMap: Record<string, string> = {}
  const used = new Set<string>()

  const nextCategories = categories.map((c) => {
    const desired = toSeoSlug(String(c.name || ""), "kategori")
    let nextId = desired
    if (used.has(nextId) && String(c.id) !== nextId) {
      nextId = uniqueCategoryId(String(c.name || ""), used)
    }
    if (String(c.id) !== nextId) {
      if (used.has(nextId)) {
        nextId = uniqueCategoryId(String(c.name || ""), used)
      }
      idMap[String(c.id)] = nextId
    }
    used.add(nextId)
    return { ...c, id: nextId }
  })

  const nextItems = items.map((it) => ({
    ...it,
    categoryId: idMap[String(it.categoryId)] ?? it.categoryId,
  }))

  return { categories: nextCategories, items: nextItems, idMap }
}

function isLocalGaleriUrl(url: string): boolean {
  const raw = String(url || "").trim()
  if (!raw || /^https?:\/\//i.test(raw)) return false
  const normalized = raw.startsWith("/") ? raw : `/${raw}`
  return normalized.startsWith("/uploads/galeri/")
}

function resolveCategoryName(
  categoryId: string,
  categories: CmsGalleryCategory[]
): string {
  const cat = categories.find((c) => String(c.id) === String(categoryId))
  return String(cat?.name || categoryId || "genel")
}

async function removeEmptyLegacyCategoryDirs(): Promise<void> {
  const galeriRoot = path.join(resolveUploadRoot(), "galeri")
  let entries: Awaited<ReturnType<typeof fs.readdir>>
  try {
    entries = await fs.readdir(galeriRoot, { withFileTypes: true })
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return
    throw err
  }

  for (const ent of entries) {
    if (!ent.isDirectory() || !ent.name.startsWith("gallery-category-")) continue
    const dir = path.join(galeriRoot, ent.name)
    const left = await fs.readdir(dir)
    if (left.length === 0) {
      await fs.rmdir(dir)
    }
  }
}

export async function migrateGallerySeoPaths(): Promise<GalleryMigrateResult> {
  const errors: string[] = []
  let filesMigrated = 0

  const cfg = await readJson<WebsiteCmsConfig>(CMS_CONFIG_FILE)
  const gallery = cfg.galleryManagement ?? { categories: [], items: [] }
  const categories = Array.isArray(gallery.categories) ? gallery.categories : []
  const items = Array.isArray(gallery.items) ? gallery.items : []

  const remapped = remapGalleryCategoryIds(categories, items)
  let workingCategories = remapped.categories
  let workingItems = remapped.items

  if (Object.keys(remapped.idMap).length > 0) {
    await mutateJson<WebsiteCmsConfig>(CMS_CONFIG_FILE, (current) => ({
      ...current,
      galleryManagement: {
        ...(current.galleryManagement ?? { categories: [], items: [] }),
        categories: remapped.categories,
        items: remapped.items,
      },
    }))
  }

  const baseTs = Date.now()
  let itemsChanged = false

  workingItems = await Promise.all(
    workingItems.map(async (item, index) => {
      const galleryItem = item as CmsGalleryItem
      if (!isLocalGaleriUrl(galleryItem.imageUrl)) {
        return item
      }

      try {
        const finalized = await finalizeGalleryImage({
          imageUrl: galleryItem.imageUrl,
          title: galleryItem.title,
          categoryName: resolveCategoryName(galleryItem.categoryId, workingCategories),
          itemId: galleryItem.id,
          timestamp: baseTs + index,
        })
        if (finalized.changed) {
          filesMigrated += 1
          itemsChanged = true
          return { ...item, imageUrl: finalized.imageUrl }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        errors.push(`${galleryItem.id}: ${message}`)
      }

      return item
    })
  )

  try {
    await removeEmptyLegacyCategoryDirs()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    errors.push(`Klasör temizliği: ${message}`)
  }

  if (itemsChanged) {
    await mutateJson<WebsiteCmsConfig>(CMS_CONFIG_FILE, (current) => ({
      ...current,
      galleryManagement: {
        ...(current.galleryManagement ?? { categories: [], items: [] }),
        categories: workingCategories,
        items: workingItems as CmsGalleryItem[],
      },
    }))
  }

  return {
    categoriesRemapped: Object.keys(remapped.idMap).length,
    filesMigrated,
    errors,
  }
}
