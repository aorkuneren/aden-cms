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
  // .svg bilinçli olarak eşlenmez: inline servis edilen SVG script çalıştırabilir (XSS).
  // octet-stream + attachment ile indirilmeye zorlanır.
}

const INLINE_UNSAFE_EXTENSIONS = new Set([".svg", ".svgz", ".xml", ".html", ".htm"])

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
    // ENOTDIR/ELOOP/EACCES de erişilemeyen kaynak demektir — 404 gibi ele alınır.
    if (code === "ENOENT" || code === "ENOTDIR" || code === "ELOOP" || code === "EACCES" || code === "EPERM") {
      return null
    }
    throw err
  }

  if (!assertPathInsideRoot(rootReal, fileReal)) return null
  return fileReal
}

export function guessMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  return MIME[ext] || "application/octet-stream"
}

/** Tarayıcıda inline render edilmesi riskli uzantılar için indirme zorunlu kılınır. */
export function shouldForceDownload(filename: string): boolean {
  return INLINE_UNSAFE_EXTENSIONS.has(path.extname(filename).toLowerCase())
}

export type ByteRange = { start: number; end: number }

/** Tek aralıklı `bytes=` başlığını çözer. Geçersiz/yok ise null, karşılanamıyorsa "unsatisfiable". */
export function parseByteRange(header: string | null | undefined, size: number): ByteRange | "unsatisfiable" | null {
  if (!header) return null
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim())
  if (!match) return null

  const [, rawStart, rawEnd] = match
  if (!rawStart && !rawEnd) return null

  let start: number
  let end: number

  if (!rawStart) {
    const suffixLength = Number(rawEnd)
    if (!suffixLength) return "unsatisfiable"
    start = Math.max(0, size - suffixLength)
    end = size - 1
  } else {
    start = Number(rawStart)
    end = rawEnd ? Number(rawEnd) : size - 1
  }

  if (!Number.isFinite(start) || !Number.isFinite(end)) return null
  if (size <= 0 || start >= size || start > end) return "unsatisfiable"
  return { start, end: Math.min(end, size - 1) }
}
