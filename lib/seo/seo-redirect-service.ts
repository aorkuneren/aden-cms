import { readJson, mutateJson } from "@/lib/cms/store"
import { isSystemPath, normalizePath } from "@/lib/seo/path"
import { urlHistoryListSchema } from "@/lib/seo/schemas"
import type { SeoEntityType, UrlHistoryReason, UrlHistoryRecord } from "@/lib/seo/types"

const FILE = "url-history.json"

export type RedirectEdge = { fromPath: string; toPath: string }

export function wouldCreateLoop(
  fromPath: string,
  toPath: string,
  existing: RedirectEdge[]
): boolean {
  const from = normalizePath(fromPath)
  const to = normalizePath(toPath)
  if (from === to) return true

  const map = new Map<string, string>()
  for (const e of existing) {
    map.set(normalizePath(e.fromPath), normalizePath(e.toPath))
  }
  map.set(from, to)

  let cursor = to
  const seen = new Set<string>([from])
  while (map.has(cursor)) {
    if (seen.has(cursor)) return true
    seen.add(cursor)
    cursor = map.get(cursor)!
    if (seen.size > existing.length + 5) return true
  }
  return false
}

/** Aktif redirect zincirlerini düzleştirir (A→B, B→C ⇒ A→C). */
export function flattenRedirects<T extends RedirectEdge>(edges: T[]): T[] {
  const map = new Map<string, string>()
  for (const e of edges) {
    map.set(normalizePath(e.fromPath), normalizePath(e.toPath))
  }

  function finalTarget(start: string): string {
    let cursor = start
    const seen = new Set<string>()
    while (map.has(cursor)) {
      if (seen.has(cursor)) break
      seen.add(cursor)
      cursor = map.get(cursor)!
    }
    return cursor
  }

  return edges.map((e) => {
    const from = normalizePath(e.fromPath)
    const flatTo = finalTarget(from)
    // finalTarget follows from→... so if from maps to something, walk from the first hop
    const firstHop = map.get(from)
    if (!firstHop) return { ...e, fromPath: from, toPath: normalizePath(e.toPath) }
    const target = finalTarget(firstHop) === firstHop && !map.has(firstHop)
      ? firstHop
      : (() => {
          let cursor = firstHop
          const seen = new Set<string>([from])
          while (map.has(cursor)) {
            if (seen.has(cursor)) break
            seen.add(cursor)
            cursor = map.get(cursor)!
          }
          return cursor
        })()
    return { ...e, fromPath: from, toPath: target }
  })
}

export async function listUrlHistory(): Promise<UrlHistoryRecord[]> {
  try {
    const raw = await readJson<unknown>(FILE)
    const parsed = urlHistoryListSchema.safeParse(raw)
    return parsed.success ? (parsed.data as UrlHistoryRecord[]) : []
  } catch {
    return []
  }
}

export async function listActiveRedirects(): Promise<UrlHistoryRecord[]> {
  const rows = await listUrlHistory()
  return rows.filter((r) => r.isActive)
}

export async function resolveRedirect(
  path: string
): Promise<{ toPath: string; statusCode: 301 | 302 } | null> {
  const from = normalizePath(path)
  const active = await listActiveRedirects()
  const hit = active.find((r) => normalizePath(r.fromPath) === from)
  if (!hit) return null
  return { toPath: normalizePath(hit.toPath), statusCode: hit.statusCode }
}

export type CreateRedirectInput = {
  fromPath: string
  toPath: string
  statusCode?: 301 | 302
  entityType?: SeoEntityType | null
  entityId?: string | null
  reason: UrlHistoryReason
  actorId?: string | null
}

export async function createRedirect(input: CreateRedirectInput): Promise<UrlHistoryRecord> {
  const from = normalizePath(input.fromPath)
  const to = normalizePath(input.toPath)
  const now = new Date().toISOString()

  if (from === to) {
    throw new Error("Kaynak ve hedef URL aynı olamaz.")
  }
  if (isSystemPath(from) || isSystemPath(to)) {
    throw new Error("Sistem yolları (/admin, /api, /uploads) yönlendirilemez.")
  }

  const result = await mutateJson<UrlHistoryRecord[]>(FILE, async (current) => {
    let rows = Array.isArray(current) ? [...current] : []
    const activeEdges = rows.filter((r) => r.isActive).map((r) => ({
      fromPath: r.fromPath,
      toPath: r.toPath,
    }))

    if (wouldCreateLoop(from, to, activeEdges)) {
      throw new Error("Bu yönlendirme bir döngü oluşturur.")
    }

    const existingActive = rows.find((r) => r.isActive && normalizePath(r.fromPath) === from)
    if (existingActive) {
      existingActive.isActive = false
      existingActive.updatedAt = now
    }

    const record: UrlHistoryRecord = {
      id: crypto.randomUUID(),
      fromPath: from,
      toPath: to,
      statusCode: input.statusCode ?? 301,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      reason: input.reason,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy: input.actorId ?? null,
    }
    rows.push(record)

    // Flatten all active
    const active = rows.filter((r) => r.isActive)
    const flat = flattenRedirects(active)
    const byFrom = new Map(flat.map((r) => [normalizePath(r.fromPath), r]))
    rows = rows.map((r) => {
      if (!r.isActive) return r
      const f = byFrom.get(normalizePath(r.fromPath))
      if (!f) return r
      if (f.toPath !== normalizePath(r.toPath)) {
        return { ...r, toPath: f.toPath, updatedAt: now }
      }
      return r
    })

    return rows
  })

  const created = result.find(
    (r) => r.isActive && normalizePath(r.fromPath) === from && normalizePath(r.toPath) === to
  )
  // after flatten, to may have changed
  const afterFlat = result.find((r) => r.isActive && normalizePath(r.fromPath) === from)
  if (!afterFlat) throw new Error("Yönlendirme kaydı yazılamadı")
  return afterFlat
}

export async function replaceAllUrlHistory(rows: UrlHistoryRecord[]): Promise<void> {
  await mutateJson<UrlHistoryRecord[]>(FILE, () => rows)
}
