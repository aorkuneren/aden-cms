import { bungalowPathFromSlug, normalizePath, stripHtml, unicodeLength } from "@/lib/seo/path"
import type { SeoMetaRecord, SeoScoreResult } from "@/lib/seo/types"

export type ScoreContext = {
  pageTitle?: string
  bodyHtml?: string
  imageAlts?: string[]
}

function includesKeyword(haystack: string, keyword: string): boolean {
  const k = keyword.trim().toLocaleLowerCase("tr-TR")
  if (!k) return false
  return haystack.toLocaleLowerCase("tr-TR").includes(k)
}

export function calculateSeoScore(
  record: Pick<
    SeoMetaRecord,
    "metaTitle" | "metaDescription" | "focusKeyword" | "slug" | "path"
  >,
  ctx: ScoreContext = {}
): SeoScoreResult {
  const kw = (record.focusKeyword || "").trim()
  const body = stripHtml(ctx.bodyHtml || "")
  const firstPara = body.slice(0, 400)
  const url =
    record.path ||
    (record.slug ? bungalowPathFromSlug(record.slug) : "") ||
    ""
  const alts = ctx.imageAlts || []
  const altsFilled = alts.length === 0 ? true : alts.every((a) => a.trim().length > 0)
  const internalLinks = (ctx.bodyHtml || "").match(/href=["']\/[^"']+/gi)?.length ?? 0

  const items = [
    {
      id: "kw-title",
      label: "Odak kelime meta başlıkta geçiyor",
      passed: includesKeyword(record.metaTitle, kw),
      weight: 15,
    },
    {
      id: "kw-desc",
      label: "Odak kelime meta açıklamada geçiyor",
      passed: includesKeyword(record.metaDescription, kw),
      weight: 15,
    },
    {
      id: "kw-h1",
      label: "Odak kelime sayfa başlığında geçiyor",
      passed: includesKeyword(ctx.pageTitle || "", kw),
      weight: 10,
    },
    {
      id: "kw-url",
      label: "Odak kelime URL’de geçiyor",
      passed: includesKeyword(url, kw),
      weight: 10,
    },
    {
      id: "kw-intro",
      label: "Odak kelime ilk paragrafta geçiyor",
      passed: includesKeyword(firstPara, kw),
      weight: 10,
    },
    {
      id: "content-length",
      label: "İçerik yeterince uzun (300+ karakter)",
      passed: unicodeLength(body) >= 300 || !ctx.bodyHtml,
      weight: 15,
    },
    {
      id: "alt-text",
      label: "Görsellerde alt metin dolu",
      passed: altsFilled,
      weight: 10,
    },
    {
      id: "internal-links",
      label: "İçerikte iç link var",
      passed: internalLinks >= 1 || !ctx.bodyHtml,
      weight: 5,
    },
    {
      id: "readability",
      label: "Okunabilirlik kabul edilebilir",
      passed: (() => {
        if (!body) return true
        const sentences = body.split(/[.!?]+/).filter((s) => s.trim().length > 0)
        const avg = body.length / Math.max(sentences.length, 1)
        return avg < 220
      })(),
      weight: 10,
    },
  ]

  const totalWeight = items.reduce((s, i) => s + i.weight, 0)
  const earned = items.reduce((s, i) => s + (i.passed ? i.weight : 0), 0)
  const score = Math.round((earned / totalWeight) * 100)

  return { score, items }
}

export function assertPublishable(
  record: Pick<SeoMetaRecord, "entityType" | "metaTitle" | "metaDescription" | "focusKeyword" | "slug">
): { ok: true } | { ok: false; missing: string[] } {
  const missing: string[] = []
  if (!record.metaTitle.trim()) missing.push("Meta başlık")
  if (!record.metaDescription.trim()) missing.push("Meta açıklama")
  if (!(record.focusKeyword || "").trim()) missing.push("Odak kelime")
  if (record.entityType === "bungalow" && !(record.slug || "").trim()) missing.push("URL (slug)")
  if (missing.length) return { ok: false, missing }
  return { ok: true }
}

export function canonicalPathOf(record: Pick<SeoMetaRecord, "path" | "slug">): string {
  if (record.path) return normalizePath(record.path)
  if (record.slug) return bungalowPathFromSlug(record.slug)
  return "/"
}
