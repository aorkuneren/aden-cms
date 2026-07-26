/** SEO by Design — paylaşılan tipler */

export type SeoEntityType = "page" | "bungalow"

export type SeoLocale = "tr"

export type SeoSchemaType =
  | "WebPage"
  | "AboutPage"
  | "ContactPage"
  | "CollectionPage"
  | "LodgingBusiness"
  | "FAQPage"
  | "Organization"
  | null

export type SeoChangeFreq =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never"

export type SeoMetaRecord = {
  id: string
  entityType: SeoEntityType
  entityId: string
  locale: SeoLocale
  path: string | null
  slug: string | null
  metaTitle: string
  metaDescription: string
  focusKeyword: string | null
  canonicalUrl: string | null
  robotsIndex: boolean
  robotsFollow: boolean
  ogTitle: string | null
  ogDescription: string | null
  ogImageUrl: string | null
  schemaType: SeoSchemaType
  schemaJson: Record<string, unknown> | null
  priority: number
  changeFreq: SeoChangeFreq
  createdAt: string
  updatedAt: string
  updatedBy: string | null
  revision: number
}

export type UrlHistoryReason = "slug-change" | "page-move" | "manual"

export type UrlHistoryRecord = {
  id: string
  fromPath: string
  toPath: string
  statusCode: 301 | 302
  entityType: SeoEntityType | null
  entityId: string | null
  reason: UrlHistoryReason
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string | null
}

export type SeoQualityWarning = {
  level: "warning"
  code: string
  message: string
}

export type SeoScoreItem = {
  id: string
  label: string
  passed: boolean
  weight: number
}

export type SeoScoreResult = {
  score: number
  items: SeoScoreItem[]
}

export type BackfillReport = {
  totalProcessed: number
  created: number
  skipped: number
  conflicts: number
  warnings: string[]
}

export type LegacyFallbackLogEntry = {
  source: "legacy-fallback"
  entityType: SeoEntityType
  entityId: string
  field: string
  createdAt: string
}

export type FallbackContext = {
  title: string
  siteName: string
  bodyHtml?: string
  featuredImageUrl?: string
  defaultOgImageUrl?: string
  path: string
  baseUrl: string
}

export type ResolvedSeo = SeoMetaRecord & {
  canonicalPath: string
  absoluteCanonical: string
  warnings: SeoQualityWarning[]
  score: SeoScoreResult
}
