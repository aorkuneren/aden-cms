import { mutateJson, readJson } from "@/lib/cms/store"
import type { LegacyFallbackLogEntry, SeoEntityType } from "@/lib/seo/types"

const FILE = "seo-legacy-fallback-log.json"

export async function logLegacyFallback(input: {
  entityType: SeoEntityType
  entityId: string
  field: string
}): Promise<void> {
  const entry: LegacyFallbackLogEntry = {
    source: "legacy-fallback",
    entityType: input.entityType,
    entityId: input.entityId,
    field: input.field,
    createdAt: new Date().toISOString(),
  }
  try {
    await mutateJson<LegacyFallbackLogEntry[]>(FILE, (current) => {
      const rows = Array.isArray(current) ? current : []
      // Keep last 500
      return [...rows, entry].slice(-500)
    })
  } catch {
    // logging must not break resolve
  }
}

export async function listLegacyFallbackLogs(): Promise<LegacyFallbackLogEntry[]> {
  try {
    const rows = await readJson<LegacyFallbackLogEntry[]>(FILE)
    return Array.isArray(rows) ? rows : []
  } catch {
    return []
  }
}
