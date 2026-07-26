import type { Metadata } from "next"
import { resolveSeo } from "@/lib/seo/seo-meta-service"
import type { SeoEntityType } from "@/lib/seo/types"

export async function buildPageMetadata(
  entityType: SeoEntityType,
  entityId: string,
  options?: {
    title?: string
    description?: string
    bodyHtml?: string
    featuredImageUrl?: string
  }
): Promise<Metadata> {
  const resolved = await resolveSeo(entityType, entityId, {
    fallback: {
      title: options?.title || entityId,
      siteName: "Aden Bungalov",
      bodyHtml: options?.bodyHtml || options?.description,
      featuredImageUrl: options?.featuredImageUrl,
      path: "/",
      baseUrl: "https://www.adenbungalov.com",
    },
  })

  return {
    title: { absolute: resolved.metaTitle },
    description: resolved.metaDescription,
    alternates: {
      canonical: resolved.canonicalPath,
    },
    robots: {
      index: resolved.robotsIndex,
      follow: resolved.robotsFollow,
    },
    openGraph: {
      title: resolved.ogTitle || resolved.metaTitle,
      description: resolved.ogDescription || resolved.metaDescription,
      url: resolved.absoluteCanonical,
      images: resolved.ogImageUrl ? [{ url: resolved.ogImageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: resolved.ogTitle || resolved.metaTitle,
      description: resolved.ogDescription || resolved.metaDescription,
      images: resolved.ogImageUrl ? [resolved.ogImageUrl] : undefined,
    },
  }
}
