import fs from "fs/promises"
import path from "path"
import { resolveUploadRoot } from "@/lib/media/upload"

export type DeleteUploadResult = { deleted: boolean; reason?: string }

function isManagedUploadUrl(url: string): boolean {
  return typeof url === "string" && url.startsWith("/uploads/")
}

function urlToAbsolutePath(url: string): string | null {
  if (!isManagedUploadUrl(url)) return null
  const rel = url.slice("/uploads/".length)
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
