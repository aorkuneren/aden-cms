import {
  bungalowPathFromSlug,
  normalizePath,
  suggestTruncated,
  stripHtml,
  unicodeLength,
} from "@/lib/seo/path"
import type { FallbackContext, SeoMetaRecord, SeoQualityWarning } from "@/lib/seo/types"

export const META_TITLE_SOFT_MAX = 70
export const META_DESCRIPTION_SOFT_MAX = 180
export const META_TITLE_IDEAL: [number, number] = [50, 60]
export const META_DESCRIPTION_IDEAL: [number, number] = [140, 160]

export function normalizeCanonicalUrl(
  value: string | null | undefined,
  selfAbsolute: string
): string | null {
  if (value == null) return null
  const trimmed = String(value).trim()
  if (!trimmed) return null
  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    throw new Error("Canonical adresi geçerli bir URL olmalıdır (https://...).")
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Canonical yalnızca http veya https olabilir.")
  }
  const normalized = url.toString().replace(/\/$/, "")
  const selfNorm = selfAbsolute.replace(/\/$/, "")
  if (normalized === selfNorm) return null
  return url.protocol === "http:" && !url.hostname.includes("localhost")
    ? normalized.replace(/^http:/, "https:")
    : normalized
}

export function buildLengthWarnings(record: Pick<SeoMetaRecord, "metaTitle" | "metaDescription">): SeoQualityWarning[] {
  const warnings: SeoQualityWarning[] = []
  const t = unicodeLength(record.metaTitle)
  const d = unicodeLength(record.metaDescription)
  if (t > META_TITLE_SOFT_MAX) {
    warnings.push({
      level: "warning",
      code: "META_TITLE_LONG",
      message: `Meta başlık ${t} karakter (önerilen en fazla ${META_TITLE_SOFT_MAX}).`,
    })
  } else if (t > 0 && t < META_TITLE_IDEAL[0]) {
    warnings.push({
      level: "warning",
      code: "META_TITLE_SHORT",
      message: `Meta başlık biraz kısa (${t} karakter; ideal ${META_TITLE_IDEAL[0]}–${META_TITLE_IDEAL[1]}).`,
    })
  }
  if (d > META_DESCRIPTION_SOFT_MAX) {
    warnings.push({
      level: "warning",
      code: "META_DESCRIPTION_LONG",
      message: `Meta açıklama ${d} karakter (önerilen en fazla ${META_DESCRIPTION_SOFT_MAX}).`,
    })
  } else if (d > 0 && d < META_DESCRIPTION_IDEAL[0]) {
    warnings.push({
      level: "warning",
      code: "META_DESCRIPTION_SHORT",
      message: `Meta açıklama biraz kısa (${d} karakter; ideal ${META_DESCRIPTION_IDEAL[0]}–${META_DESCRIPTION_IDEAL[1]}).`,
    })
  }
  return warnings
}

export function applySeoFallbacks(
  record: SeoMetaRecord,
  ctx: FallbackContext
): SeoMetaRecord {
  const siteName = ctx.siteName.trim() || "Aden Bungalov"
  const title = ctx.title.trim() || siteName
  const path =
    record.path ||
    (record.slug ? bungalowPathFromSlug(record.slug) : normalizePath(ctx.path))

  const metaTitle =
    record.metaTitle.trim() || `${title} | ${siteName}`
  const bodyText = stripHtml(ctx.bodyHtml || "")
  const metaDescription =
    record.metaDescription.trim() ||
    suggestTruncated(bodyText || `${title} — ${siteName}`, 155)

  const ogTitle = (record.ogTitle || "").trim() || metaTitle
  const ogDescription = (record.ogDescription || "").trim() || metaDescription
  const ogImageUrl =
    (record.ogImageUrl || "").trim() ||
    ctx.featuredImageUrl ||
    ctx.defaultOgImageUrl ||
    null

  return {
    ...record,
    path,
    metaTitle,
    metaDescription,
    ogTitle,
    ogDescription,
    ogImageUrl,
  }
}

export function resolveAbsoluteCanonical(
  record: SeoMetaRecord,
  baseUrl: string
): { canonicalPath: string; absoluteCanonical: string } {
  const base = baseUrl.replace(/\/+$/, "")
  const path =
    record.path ||
    (record.slug ? bungalowPathFromSlug(record.slug) : "/")
  const canonicalPath = normalizePath(path)
  if (record.canonicalUrl) {
    return { canonicalPath, absoluteCanonical: record.canonicalUrl }
  }
  const absoluteCanonical =
    canonicalPath === "/" ? `${base}/` : `${base}${canonicalPath}`
  return { canonicalPath, absoluteCanonical }
}
