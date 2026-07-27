import fs from "fs/promises"
import path from "path"
import sharp from "sharp"
import { toSeoSlug } from "@/lib/media/slug"
import { resolveUploadRoot } from "@/lib/media/upload"
import {
  deleteUploadByUrl,
  isUploadUrlReferencedElsewhere,
  normalizeUploadUrl,
} from "@/lib/media/delete"

export type FinalizeGalleryInput = {
  imageUrl: string
  title: string
  categoryName: string
  /** Referans tarama için; eski dosya silinirken bu item hariç tutulur */
  itemId?: string
  /** Test/deterministik isim için opsiyonel; yoksa Date.now() */
  timestamp?: number
}

export type FinalizeGalleryResult = {
  imageUrl: string
  changed: boolean
}

export function buildGallerySeoBaseSlug(
  categoryName: string,
  title: string
): { categorySlug: string; baseSlug: string } {
  const categorySlug = toSeoSlug(categoryName, "genel")
  const titleTrim = String(title || "").trim()
  const baseSlug = titleTrim
    ? toSeoSlug(titleTrim, categorySlug, 40)
    : categorySlug
  return { categorySlug, baseSlug }
}

export function buildGallerySeoUrl(opts: {
  categoryName: string
  title: string
  timestamp: number
}): string {
  const { categorySlug, baseSlug } = buildGallerySeoBaseSlug(opts.categoryName, opts.title)
  return `/uploads/galeri/${categorySlug}/${baseSlug}-${opts.timestamp}.webp`
}

/** Zaten hedef SEO webp path'inde mi (staging / legacy klasör değil, slug eşleşiyor)? */
export function isAlreadyFinalizedGallerySeoPath(
  imageUrl: string,
  categoryName: string,
  title: string
): boolean {
  const normalized = normalizeUploadUrl(imageUrl) || String(imageUrl || "").trim()
  if (!normalized.startsWith("/uploads/galeri/")) return false

  const rest = normalized.slice("/uploads/galeri/".length)
  const slashIdx = rest.indexOf("/")
  if (slashIdx === -1) return false

  const folder = rest.slice(0, slashIdx)
  const filename = rest.slice(slashIdx + 1)

  if (folder === "_staging" || folder.startsWith("gallery-category-")) return false
  if (!filename.endsWith(".webp")) return false

  const { categorySlug, baseSlug } = buildGallerySeoBaseSlug(categoryName, title)
  if (folder !== categorySlug) return false
  if (!filename.startsWith(`${baseSlug}-`)) return false

  const suffix = filename.slice(`${baseSlug}-`.length)
  return /^\d+\.webp$/.test(suffix)
}

function isLocalUploadsUrl(url: string): boolean {
  const n = normalizeUploadUrl(url)
  return !!n && n.startsWith("/uploads/")
}

function urlToAbs(url: string): string | null {
  const n = normalizeUploadUrl(url)
  if (!n || !n.startsWith("/uploads/")) return null
  const rel = n.slice("/uploads/".length)
  const root = resolveUploadRoot()
  const abs = path.resolve(root, rel)
  const rootResolved = path.resolve(root)
  if (abs !== rootResolved && !abs.startsWith(rootResolved + path.sep)) return null
  return abs
}

export async function finalizeGalleryImage(
  input: FinalizeGalleryInput
): Promise<FinalizeGalleryResult> {
  const rawUrl = String(input.imageUrl || "").trim()
  if (!rawUrl) return { imageUrl: rawUrl, changed: false }
  if (/^https?:\/\//i.test(rawUrl)) return { imageUrl: rawUrl, changed: false }
  if (!isLocalUploadsUrl(rawUrl)) return { imageUrl: rawUrl, changed: false }

  const normalizedCurrent = normalizeUploadUrl(rawUrl) || rawUrl
  if (
    isAlreadyFinalizedGallerySeoPath(
      normalizedCurrent,
      input.categoryName,
      input.title
    )
  ) {
    return { imageUrl: normalizedCurrent, changed: false }
  }

  const timestamp = input.timestamp ?? Date.now()
  const targetUrl = buildGallerySeoUrl({
    categoryName: input.categoryName,
    title: input.title,
    timestamp,
  })

  const srcAbs = urlToAbs(rawUrl)
  if (!srcAbs) throw new Error("Geçersiz görsel yolu.")

  const root = resolveUploadRoot()
  const destRel = targetUrl.slice("/uploads/".length)
  const destAbs = path.join(root, destRel)
  await fs.mkdir(path.dirname(destAbs), { recursive: true })

  await sharp(srcAbs).webp({ quality: 82 }).toFile(destAbs)

  const referenced = await isUploadUrlReferencedElsewhere(rawUrl, {
    excludeEntityType: "cms_gallery",
    excludeId: input.itemId,
  })
  if (!referenced && normalizedCurrent !== targetUrl) {
    await deleteUploadByUrl(rawUrl)
  }

  return { imageUrl: targetUrl, changed: true }
}
