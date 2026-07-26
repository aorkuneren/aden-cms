import fs from "fs/promises"
import path from "path"
import { readJson } from "@/lib/cms/store"
import { resolveUploadRoot } from "@/lib/media/upload"

export type DeleteUploadResult = { deleted: boolean; reason?: string }

function isManagedUploadUrl(url: string): boolean {
  return typeof url === "string" && url.startsWith("/uploads/")
}

/** Query/hash parçalarını atar ve percent-encoding'i çözer — aynı dosyanın farklı yazımlarını eşitler. */
export function normalizeUploadUrl(url: unknown): string | null {
  if (typeof url !== "string") return null
  const trimmed = url.trim()
  if (!trimmed) return null
  const withoutQuery = trimmed.split(/[?#]/)[0]
  if (!withoutQuery) return null
  try {
    return decodeURIComponent(withoutQuery)
  } catch {
    return withoutQuery
  }
}

function urlToAbsolutePath(url: string): string | null {
  const normalized = normalizeUploadUrl(url)
  if (!normalized || !isManagedUploadUrl(normalized)) return null
  const rel = normalized.slice("/uploads/".length)
  if (!rel || rel.includes("\0")) return null
  const root = resolveUploadRoot()
  const abs = path.resolve(root, rel)
  const rootResolved = path.resolve(root)
  if (abs !== rootResolved && !abs.startsWith(rootResolved + path.sep)) {
    return null
  }
  return abs
}

export async function deleteUploadByUrl(url: string): Promise<DeleteUploadResult> {
  if (!url || typeof url !== "string") return { deleted: false, reason: "empty" }
  if (/^https?:\/\//i.test(url)) return { deleted: false, reason: "external" }
  if (url.startsWith("/upload/") && !url.startsWith("/uploads/")) {
    return { deleted: false, reason: "not-managed" }
  }
  if (!isManagedUploadUrl(url)) return { deleted: false, reason: "not-managed" }

  const abs = urlToAbsolutePath(url)
  if (!abs) return { deleted: false, reason: "invalid-path" }

  try {
    await fs.unlink(abs)
    return { deleted: true }
  } catch (err: any) {
    if (err?.code === "ENOENT") return { deleted: true }
    console.error("[media] deleteUploadByUrl failed", url, err)
    return { deleted: false, reason: "io-error" }
  }
}

export function collectMediaUrls(entityType: string, record: Record<string, unknown>): string[] {
  const urls: string[] = []
  const push = (v: unknown) => {
    if (typeof v === "string" && v.trim()) urls.push(v.trim())
  }

  switch (entityType) {
    case "cms_gallery":
    case "cms_why_aden":
      push(record.imageUrl)
      break
    case "cms_slider":
      push(record.imageUrl)
      push(record.videoUrl)
      break
    case "bungalow":
      push(record.image)
      if (Array.isArray(record.galleryImages)) {
        for (const u of record.galleryImages) push(u)
      }
      break
    default:
      break
  }
  return urls
}

const CMS_CONFIG_FILE = "cms-config.json"
const BUNGALOVS_FILE = "bungalovs.json"

export type ReferenceScanOptions = {
  excludeEntityType?: string
  excludeId?: string
}

/**
 * Bir upload URL'inin başka bir kayıt tarafından hâlâ kullanılıp kullanılmadığını söyler.
 * Kopyalanan galeri kayıtları aynı dosyayı paylaştığı için purge sırasında dosyayı
 * silmeden önce bu kontrol yapılmalıdır.
 */
export async function isUploadUrlReferencedElsewhere(
  url: string,
  opts: ReferenceScanOptions = {}
): Promise<boolean> {
  const target = normalizeUploadUrl(url)
  if (!target || !isManagedUploadUrl(target)) return false

  const [config, bungalows] = await Promise.all([
    readJson<Record<string, any>>(CMS_CONFIG_FILE).catch(() => null),
    readJson<any[]>(BUNGALOVS_FILE).catch(() => null),
  ])

  const matches = (entityType: string, records: unknown): boolean => {
    if (!Array.isArray(records)) return false
    return records.some((record) => {
      if (!record || typeof record !== "object") return false
      const isExcluded =
        opts.excludeEntityType === entityType &&
        opts.excludeId != null &&
        String((record as Record<string, unknown>).id) === String(opts.excludeId)
      if (isExcluded) return false
      return collectMediaUrls(entityType, record as Record<string, unknown>).some(
        (candidate) => normalizeUploadUrl(candidate) === target
      )
    })
  }

  return (
    matches("cms_slider", config?.sliderManagement) ||
    matches("cms_why_aden", config?.whyAdenManagement) ||
    matches("cms_gallery", config?.galleryManagement?.items) ||
    matches("bungalow", bungalows)
  )
}
