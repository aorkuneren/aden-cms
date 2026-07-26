import { readJson, mutateJson } from "@/lib/cms/store"
import {
  createEmptyFeatureCatalog,
  mergeFeatureCatalogs,
  normalizeFeatureCatalog,
  type BungalowFeatureCatalog,
} from "@/lib/bungalov-feature-categories"

export const FEATURE_CATALOG_FILE = "bungalov-feature-catalog.json"

export async function readFeatureCatalog(): Promise<BungalowFeatureCatalog> {
  try {
    const raw = await readJson<unknown>(FEATURE_CATALOG_FILE)
    return normalizeFeatureCatalog(raw)
  } catch {
    return createEmptyFeatureCatalog()
  }
}

export async function upsertFeatureCatalog(
  incoming: BungalowFeatureCatalog
): Promise<BungalowFeatureCatalog> {
  return mutateJson<BungalowFeatureCatalog>(FEATURE_CATALOG_FILE, (current) =>
    mergeFeatureCatalogs(normalizeFeatureCatalog(current), incoming)
  )
}
