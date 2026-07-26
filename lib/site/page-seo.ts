import { websiteCmsQueries } from "@/lib/data/queries"

type PageSeoFallback = {
  title: string
  description: string
  keywords?: string
}

function normalizePathname(pathname: string): string {
  const normalized = pathname.trim().replace(/\/+$/, "")
  return normalized || "/"
}

function nonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined

  const trimmed = value.trim()
  return trimmed || undefined
}

export async function resolvePageSeo(
  pathname: string,
  fallback: PageSeoFallback
): Promise<PageSeoFallback> {
  const normalizedPathname = normalizePathname(pathname)

  try {
    const config = await websiteCmsQueries.getConfig()
    const item = config.siteManagement.pageSeoItems.find(
      (candidate) => normalizePathname(candidate.slug) === normalizedPathname
    )

    return {
      title: nonEmptyString(item?.title) || fallback.title,
      description: nonEmptyString(item?.description) || fallback.description,
      keywords: nonEmptyString(item?.keywords) || fallback.keywords,
    }
  } catch {
    return fallback
  }
}
