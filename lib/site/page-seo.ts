import { buildPageMetadata } from "@/lib/seo/resolve-metadata"
import { getPageDefByPath } from "@/lib/seo/page-ids"
import { normalizePath } from "@/lib/seo/path"
import { resolveSeo } from "@/lib/seo/seo-meta-service"

type PageSeoFallback = {
  title: string
  description: string
  keywords?: string
}

/**
 * @deprecated Tercihen `buildPageMetadata("page", entityId)` kullanın.
 * Geriye dönük köprü: path → sabit entityId → seo-meta.
 */
export async function resolvePageSeo(
  pathname: string,
  fallback: PageSeoFallback
): Promise<PageSeoFallback> {
  const def = getPageDefByPath(pathname)
  if (!def) {
    return fallback
  }

  try {
    const resolved = await resolveSeo("page", def.entityId, {
      fallback: {
        title: fallback.title,
        siteName: "Aden Bungalov",
        bodyHtml: fallback.description,
        path: normalizePath(pathname),
        baseUrl: "https://www.adenbungalov.com",
      },
    })
    return {
      title: resolved.metaTitle || fallback.title,
      description: resolved.metaDescription || fallback.description,
      keywords: fallback.keywords,
    }
  } catch {
    return fallback
  }
}

export { buildPageMetadata, getPageDefByPath }
