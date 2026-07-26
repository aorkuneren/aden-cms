import { cache } from "react"
import { settingsQueries, termsAndRuleQueries } from "@/lib/data/queries"

export type SiteTerm = {
  id: string
  title: string
  description: string | null
  content: string | null
  isActive: boolean
  order: number
}

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
}

export const getSitePublicContent = cache(async () => {
  const [settings, termsRaw] = await Promise.all([
    settingsQueries.findFirst(),
    termsAndRuleQueries.findMany({ orderBy: { order: "asc" } }),
  ])

  const terms = (termsRaw as SiteTerm[]).filter((term) => term.isActive)

  return { settings, terms }
})

export function findTermContentBySlug(terms: SiteTerm[], slug: string) {
  const normalizedSlug = normalizeText(slug)

  const matchers: Record<string, string[]> = {
    "kiralama-sartlari": ["kiralama", "kullanim kosullari", "kullanım koşulları"],
    "kvkk-aydinlatma-metni": ["kvkk", "aydinlatma", "aydınlatma"],
    "iptal-politikasi": ["iptal", "cancellation"],
    "gizlilik-bildirimi": ["gizlilik", "privacy"],
  }

  const keywords = matchers[normalizedSlug] || [normalizedSlug]

  const matched = terms.find((term) => {
    const normalizedTitle = normalizeText(term.title || "")
    return keywords.some((keyword) => normalizedTitle.includes(normalizeText(keyword)))
  })

  return matched || null
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}
