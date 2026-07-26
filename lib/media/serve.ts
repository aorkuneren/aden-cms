import fs from "fs/promises"
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

/** Canonical root altında mı — prefix tuzağına karşı path.sep ile sınır kontrolü. */
export function assertPathInsideRoot(rootReal: string, candidateReal: string): boolean {
  if (candidateReal === rootReal) return true
  return candidateReal.startsWith(rootReal + path.sep)
}

/** Segment yolunu çözer; symlink/realpath sonrası hâlâ upload root içindeyse canonical yolu döner. */
export async function resolveSafeUploadFilePath(segments: string[]): Promise<string | null> {
  const abs = resolveUploadFilePath(segments)
  if (!abs) return null

  const root = path.resolve(resolveUploadRoot())
  let rootReal: string
  let fileReal: string

  try {
    await fs.mkdir(root, { recursive: true })
    rootReal = await fs.realpath(root)
    fileReal = await fs.realpath(abs)
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException)?.code
    if (code === "ENOENT") return null
    throw err
  }

  if (!assertPathInsideRoot(rootReal, fileReal)) return null
  return fileReal
}

export function guessMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  return MIME[ext] || "application/octet-stream"
}
