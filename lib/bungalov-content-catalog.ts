import { readJson, mutateJson } from "@/lib/cms/store"
import {
  createEmptyContentCatalog,
  mergeContentCatalogs,
  normalizeContentCatalog,
  type BungalovContentCatalog,
} from "@/lib/bungalov-content"

export const CONTENT_CATALOG_FILE = "bungalov-content-catalog.json"

export async function readContentCatalog(): Promise<BungalovContentCatalog> {
  try {
    const raw = await readJson<unknown>(CONTENT_CATALOG_FILE)
    return normalizeContentCatalog(raw)
  } catch {
    return createEmptyContentCatalog()
  }
}

export async function upsertContentCatalog(
  incoming: BungalovContentCatalog
): Promise<BungalovContentCatalog> {
  return mutateJson<BungalovContentCatalog>(CONTENT_CATALOG_FILE, (current) =>
    mergeContentCatalogs(normalizeContentCatalog(current), incoming)
  )
}
