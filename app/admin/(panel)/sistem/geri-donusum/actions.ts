"use server"

import { requireCms } from "@/lib/admin/permissions"
import { mutateCms } from "@/lib/cms/mutate-cms"
import { restoreDeleted } from "@/lib/cms/soft-delete"
import { collectMediaUrls, deleteUploadByUrl } from "@/lib/media/delete"

const CMS_CONFIG_FILE = "cms-config.json"
const BUNGALOVS_FILE = "bungalovs.json"

export type TrashEntityType = "cms_slider" | "cms_faq" | "cms_why_aden" | "cms_gallery" | "bungalow"
export type TrashActionResult = { ok: true } | { ok: false; error: string }

type EntitySource = {
  file: string
  collection: (config: Record<string, any>) => any[]
  replaceCollection: (config: Record<string, any>, items: any[]) => Record<string, any>
}

const CMS_ENTITY_SOURCES: Record<Exclude<TrashEntityType, "bungalow">, EntitySource> = {
  cms_slider: {
    file: CMS_CONFIG_FILE,
    collection: (config) => (Array.isArray(config.sliderManagement) ? config.sliderManagement : []),
    replaceCollection: (config, items) => ({ ...config, sliderManagement: items }),
  },
  cms_faq: {
    file: CMS_CONFIG_FILE,
    collection: (config) => (Array.isArray(config.faqManagement) ? config.faqManagement : []),
    replaceCollection: (config, items) => ({ ...config, faqManagement: items }),
  },
  cms_why_aden: {
    file: CMS_CONFIG_FILE,
    collection: (config) => (Array.isArray(config.whyAdenManagement) ? config.whyAdenManagement : []),
    replaceCollection: (config, items) => ({ ...config, whyAdenManagement: items }),
  },
  cms_gallery: {
    file: CMS_CONFIG_FILE,
    collection: (config) => (Array.isArray(config.galleryManagement?.items) ? config.galleryManagement.items : []),
    replaceCollection: (config, items) => ({
      ...config,
      galleryManagement: { ...(config.galleryManagement ?? {}), items },
    }),
  },
}

function isTrashEntityType(value: string): value is TrashEntityType {
  return value === "cms_slider" || value === "cms_faq" || value === "cms_why_aden" || value === "cms_gallery" || value === "bungalow"
}

function sourceFor(entityType: TrashEntityType): EntitySource {
  if (entityType === "bungalow") {
    return {
      file: BUNGALOVS_FILE,
      collection: (items) => (Array.isArray(items) ? items : []),
      replaceCollection: (_items, nextItems) => nextItems,
    }
  }
  return CMS_ENTITY_SOURCES[entityType]
}

export async function restoreTrashItemAction(entityType: string, id: string): Promise<TrashActionResult> {
  if (!isTrashEntityType(entityType) || !id) return { ok: false, error: "Geçersiz geri dönüşüm kaydı." }

  const source = sourceFor(entityType)
  const result = await mutateCms<any>({
    action: "update",
    file: source.file,
    entityType,
    entityId: id,
    auditAction: "Geri Dönüşüm Kaydı Geri Yüklendi",
    updater: (current) => {
      const items = source.collection(current)
      const nextItems = items.map((item) => (String(item.id) === String(id) ? restoreDeleted(item) : item))
      return source.replaceCollection(current, nextItems)
    },
  })

  return result.ok ? { ok: true } : result
}

export async function purgeTrashItemAction(entityType: string, id: string): Promise<TrashActionResult> {
  if (!isTrashEntityType(entityType) || !id) return { ok: false, error: "Geçersiz geri dönüşüm kaydı." }

  const gate = await requireCms("delete")
  if (!gate.ok) return gate
  if (gate.admin.role !== "SUPERADMIN") {
    return { ok: false, error: "Kalıcı silme işlemi yalnızca süper yönetici tarafından yapılabilir." }
  }

  const source = sourceFor(entityType)
  let mediaUrls: string[] = []
  const result = await mutateCms<any>({
    action: "delete",
    file: source.file,
    entityType,
    entityId: id,
    auditAction: "Geri Dönüşüm Kaydı Kalıcı Olarak Silindi",
    updater: (current) => {
      const items = source.collection(current)
      const target = items.find((item) => String(item.id) === String(id))
      if (target) {
        mediaUrls = collectMediaUrls(entityType, target)
      }
      return source.replaceCollection(
        current,
        items.filter((item) => String(item.id) !== String(id))
      )
    },
  })

  if (result.ok) {
    for (const url of mediaUrls) {
      await deleteUploadByUrl(url)
    }
  }

  return result.ok ? { ok: true } : result
}
