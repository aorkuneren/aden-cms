import { describe, expect, it } from "vitest"
import { assertPublishable, calculateSeoScore } from "@/lib/seo/score"
import { validateSchemaJson } from "@/lib/seo/schema-validate"
import { applySeoFallbacks } from "@/lib/seo/fallback"
import type { SeoMetaRecord } from "@/lib/seo/types"

function base(partial: Partial<SeoMetaRecord> = {}): SeoMetaRecord {
  const now = new Date().toISOString()
  return {
    id: "1",
    entityType: "bungalow",
    entityId: "b1",
    locale: "tr",
    path: null,
    slug: "gol-evi",
    metaTitle: "",
    metaDescription: "",
    focusKeyword: null,
    canonicalUrl: null,
    robotsIndex: true,
    robotsFollow: true,
    ogTitle: null,
    ogDescription: null,
    ogImageUrl: null,
    schemaType: "LodgingBusiness",
    schemaJson: null,
    priority: 0.8,
    changeFreq: "weekly",
    createdAt: now,
    updatedAt: now,
    updatedBy: null,
    revision: 1,
    ...partial,
  }
}

describe("assertPublishable", () => {
  it("eksik odak kelimede fail", () => {
    const r = assertPublishable(
      base({ metaTitle: "Başlık", metaDescription: "Açıklama yeterince uzun metin", focusKeyword: null })
    )
    expect(r.ok).toBe(false)
  })
  it("dolu alanlarda ok", () => {
    const r = assertPublishable(
      base({
        metaTitle: "Başlık",
        metaDescription: "Açıklama",
        focusKeyword: "sapanca",
        slug: "x",
      })
    )
    expect(r.ok).toBe(true)
  })
})

describe("calculateSeoScore", () => {
  it("0-100 aralığında skor döner", () => {
    const { score } = calculateSeoScore(
      base({
        metaTitle: "Sapanca Göl Evi",
        metaDescription: "Sapanca bungalov açıklaması burada.",
        focusKeyword: "sapanca",
        slug: "sapanca-gol-evi",
      }),
      { pageTitle: "Sapanca Göl Evi", bodyHtml: "<p>Sapanca doğasında konaklama. ".repeat(20) + "</p>" }
    )
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})

describe("validateSchemaJson", () => {
  it("script reddeder", () => {
    const r = validateSchemaJson('{"@context":"https://schema.org","@type":"WebPage","x":"</script>"}')
    expect(r.ok).toBe(false)
  })
  it("geçerli schema kabul eder", () => {
    const r = validateSchemaJson({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Test",
    })
    expect(r.ok).toBe(true)
  })
})

describe("applySeoFallbacks", () => {
  it("boş title için başlık üretir", () => {
    const filled = applySeoFallbacks(base(), {
      title: "Göl Evi",
      siteName: "Aden",
      path: "/bungalovlarimiz/gol-evi",
      baseUrl: "https://www.adenbungalov.com",
    })
    expect(filled.metaTitle).toContain("Göl Evi")
    expect(filled.metaTitle).toContain("Aden")
  })
})
