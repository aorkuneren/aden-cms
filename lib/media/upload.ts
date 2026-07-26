import fs from "fs/promises"
import path from "path"

/**
 * Yükleme dosyalarının fiziksel kök dizini. Public altında tutulur ki
 * `/uploads/...` adresiyle statik olarak sunulabilsin.
 */
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./public/uploads"

/** Yükleme bağlamı — dosyanın hangi klasör altında tutulacağını belirler. */
export type UploadTarget =
  | { scope: "bungalov"; id: string }
  | { scope: "galeri"; category: string }
  | { scope: "slider" }
  | { scope: "neden-aden" }
  | { scope: "hakkimizda" }
  | { scope: "cta" }
  | { scope: "system" }

export type UploadScope = UploadTarget["scope"]

export interface UploadedFile {
  url: string
  filename: string
  originalName: string
  mimeType: string
  size: number
}

function resolveUploadRoot(): string {
  return path.isAbsolute(UPLOAD_DIR)
    ? UPLOAD_DIR
    : path.join(process.cwd(), UPLOAD_DIR.replace(/^\.\//, ""))
}

/**
 * Klasör/dosya adı için güvenli bir segment üretir. Path traversal ("..", "/")
 * gibi girişleri temizler; boşsa verilen fallback'e düşer.
 */
function safeSegment(input: string, fallback: string): string {
  const cleaned = String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 60)
  return cleaned || fallback
}

/**
 * Yükleme hedefine göre uploads köküne göreli klasör yolunu döndürür.
 * - bungalov -> `bungalov/{id}`
 * - galeri   -> `galeri/{kategori}`
 * - slider   -> `slider`
 * - neden-aden -> `neden-aden`
 * - hakkimizda -> `hakkimizda`
 * - cta      -> `cta`
 * - system   -> `` (uploads kökü; logo, favicon vb.)
 */
function resolveSubdir(target: UploadTarget): string {
  switch (target.scope) {
    case "bungalov":
      return path.join("bungalov", safeSegment(target.id, "genel"))
    case "galeri":
      return path.join("galeri", safeSegment(target.category, "genel"))
    case "slider":
      return "slider"
    case "neden-aden":
      return "neden-aden"
    case "hakkimizda":
      return "hakkimizda"
    case "cta":
      return "cta"
    case "system":
    default:
      return ""
  }
}

/**
 * Yüklenen dosyayı hedef bağlamın klasörüne kaydeder ve public URL'ini döndürür.
 * Medya kütüphanesi kaldırıldığı için ayrıca bir kayıt/JSON tutulmaz.
 */
export async function saveUpload(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
  target: UploadTarget
): Promise<UploadedFile> {
  const root = resolveUploadRoot()
  const subdir = resolveSubdir(target)
  const targetDir = subdir ? path.join(root, subdir) : root

  await fs.mkdir(targetDir, { recursive: true })

  const fileExt = path.extname(originalName).toLowerCase() || ".jpg"
  const baseSlug = safeSegment(path.basename(originalName, path.extname(originalName)), "dosya").slice(0, 40)
  const timestamp = Date.now()
  const rand = Math.random().toString(36).slice(2, 7)
  const filename = `${baseSlug}-${timestamp}-${rand}${fileExt}`
  const filePath = path.join(targetDir, filename)

  await fs.writeFile(filePath, fileBuffer)

  const urlSubdir = subdir ? subdir.split(path.sep).join("/") : ""
  const url = urlSubdir ? `/uploads/${urlSubdir}/${filename}` : `/uploads/${filename}`

  return {
    url,
    filename,
    originalName,
    mimeType,
    size: fileBuffer.length,
  }
}
