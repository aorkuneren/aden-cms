import fs from "node:fs/promises"
import path from "node:path"
import { revalidatePath } from "next/cache"
import { withFileLock } from "@/lib/cms/file-lock"

/**
 * Runtime JSON içerik deposu (dosya tabanlı CMS).
 *
 * Site içeriği `data/*.json` dosyalarında tutulur. Bu modül dosyaları BUILD
 * anında `import` etmek yerine ÇALIŞMA anında okur; böylece admin panelinden
 * yapılan düzenlemeler yeniden derleme gerektirmeden yansır.
 *
 * - Okuma: dosya mtime'ına göre süreç-içi (in-process) cache ile hızlandırılır.
 * - Yazma: geçici dosyaya yaz + rename ile ATOMİK yapılır (yarım yazma olmaz).
 *
 * NOT: Kalıcı, yazılabilir disk gerektirir (Hostinger Node sunucu). Serverless
 * (salt-okunur FS) ortamda yazma kalıcı olmaz.
 */

const DATA_DIR = path.join(process.cwd(), "data")

type CacheEntry = { mtimeMs: number; value: unknown }
const memoryCache = new Map<string, CacheEntry>()

function resolveDataPath(file: string): string {
  // Yalnızca dosya adına izin ver — path traversal'ı engelle.
  const safe = path.basename(file)
  if (safe !== file) {
    throw new Error(`Geçersiz veri dosyası adı: ${file}`)
  }
  return path.join(DATA_DIR, safe)
}

/**
 * Bir JSON veri dosyasını çalışma anında okur ve parse eder.
 * mtime değişmediyse süreç-içi cache'ten döner.
 */
export async function readJson<T = unknown>(file: string): Promise<T> {
  const filePath = resolveDataPath(file)
  const stat = await fs.stat(filePath)
  const cached = memoryCache.get(filePath)
  if (cached && cached.mtimeMs === stat.mtimeMs) {
    return cached.value as T
  }
  const raw = await fs.readFile(filePath, "utf8")
  const value = JSON.parse(raw) as T
  memoryCache.set(filePath, { mtimeMs: stat.mtimeMs, value })
  return value
}

/**
 * Bir JSON veri dosyasını ATOMİK olarak yazar (temp + rename) ve cache'i tazeler.
 */
export async function writeJson(file: string, data: unknown): Promise<void> {
  const filePath = resolveDataPath(file)
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`
  const serialized = JSON.stringify(data, null, 2)
  await fs.writeFile(tmpPath, serialized, "utf8")
  await fs.rename(tmpPath, filePath)
  const stat = await fs.stat(filePath)
  memoryCache.set(filePath, { mtimeMs: stat.mtimeMs, value: data })
}

/**
 * Bir dosyayı oku → dönüştür → yaz akışını tek yerde toplar.
 * updater aldığı mevcut içeriği değiştirip yeni içeriği döndürmelidir.
 */
export async function mutateJson<T>(file: string, updater: (current: T) => T | Promise<T>): Promise<T> {
  return withFileLock(file, async () => {
    const current = await readJson<T>(file)
    const next = await updater(current)
    await writeJson(file, next)
    return next
  })
}

/**
 * İçerik değişince tüm site (public) sayfalarının Next önbelleğini geçersiz kılar.
 * Server action'lardan yazma sonrası çağrılmalıdır.
 */
export function revalidateSite(): void {
  revalidatePath("/", "layout")
}
