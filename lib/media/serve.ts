import path from "path"
import { resolveUploadRoot } from "@/lib/media/upload"

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".svg": "image/svg+xml",
}

export function resolveUploadFilePath(segments: string[]): string | null {
  if (!segments.length) return null
  if (segments.some((s) => !s || s === "." || s === ".." || s.includes("\0") || s.includes("/") || s.includes("\\"))) {
    return null
  }
  const root = path.resolve(resolveUploadRoot())
  const abs = path.resolve(root, ...segments)
  if (abs !== root && !abs.startsWith(root + path.sep)) return null
  return abs
}

export function guessMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  return MIME[ext] || "application/octet-stream"
}
