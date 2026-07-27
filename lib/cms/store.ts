import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { syncNormalizedFromDocument } from "@/lib/cms/sync-normalized"

/**
 * MySQL tabanlı CMS deposu.
 *
 * Kaynak gerçeği: `cms_documents` tablosu (dosya adı = key, tam JSON payload).
 * Yazma sonrası normalize tablolar senkronlanır (SQL sorguları / raporlar için).
 * Disk `data/*.json` runtime'da YAZILMAZ (yedek/bootstrap için saklanabilir).
 */

type CacheEntry = { version: number; value: unknown }
const memoryCache = new Map<string, CacheEntry>()

function resolveKey(file: string): string {
  const base = file.split(/[/\\]/).pop() ?? file
  if (!base || base !== file.replace(/^.*[/\\]/, "") || base.includes("..")) {
    throw new Error(`Geçersiz veri dosyası adı: ${file}`)
  }
  return base
}

export async function readJson<T = unknown>(file: string): Promise<T> {
  const key = resolveKey(file)
  const row = await prisma.cmsDocument.findUnique({ where: { key } })
  if (!row) {
    throw new Error(`CMS belgesi bulunamadı: ${key}`)
  }
  const cached = memoryCache.get(key)
  if (cached && cached.version === row.version) {
    return cached.value as T
  }
  memoryCache.set(key, { version: row.version, value: row.payload })
  return row.payload as T
}

export async function writeJson(file: string, data: unknown): Promise<void> {
  const key = resolveKey(file)

  await prisma.$transaction(
    async (tx) => {
      const existing = await tx.cmsDocument.findUnique({ where: { key } })
      const version = (existing?.version ?? 0) + 1
      await tx.cmsDocument.upsert({
        where: { key },
        create: { key, payload: data as object, version: 1 },
        update: { payload: data as object, version },
      })
      await syncNormalizedFromDocument(tx, key, data)
      memoryCache.set(key, { version: existing ? version : 1, value: data })
    },
    { timeout: 120_000, maxWait: 30_000 }
  )
}

export async function mutateJson<T>(
  file: string,
  updater: (current: T) => T | Promise<T>
): Promise<T> {
  const key = resolveKey(file)

  return prisma.$transaction(
    async (tx) => {
      const row = await tx.cmsDocument.findUnique({ where: { key } })
      if (!row) {
        throw new Error(`CMS belgesi bulunamadı: ${key}`)
      }
      const current = row.payload as T
      const updated = await updater(current)
      const version = row.version + 1
      await tx.cmsDocument.update({
        where: { key },
        data: { payload: updated as object, version },
      })
      await syncNormalizedFromDocument(tx, key, updated)
      memoryCache.set(key, { version, value: updated })
      return updated
    },
    { timeout: 120_000, maxWait: 30_000 }
  )
}

/**
 * İçerik değişince tüm site (public) sayfalarının Next önbelleğini geçersiz kılar.
 */
export function revalidateSite(): void {
  revalidatePath("/", "layout")
}

/** Bellek önbelleğini temizler (test / seed sonrası). */
export function clearCmsMemoryCache(): void {
  memoryCache.clear()
}
