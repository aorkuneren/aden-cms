export type BungalovSeoSource = {
  name: string
  description?: string
  capacity?: number | null
  bedrooms?: number | null
  poolType?: string | null
  internet?: string | null
  areaSqm?: number | null
  features?: string[]
  address?: string | null
}

export type BungalovSeoResult = {
  seoTitle: string
  seoDescription: string
}

export const SEO_TITLE_LIMIT = 60
export const SEO_DESCRIPTION_LIMIT = 155

function cleanText(value: string | null | undefined) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
}

function truncateAtWord(value: string, max: number) {
  const text = cleanText(value)
  if (text.length <= max) return text
  const sliced = text.slice(0, max - 1)
  const lastSpace = sliced.lastIndexOf(" ")
  const base = lastSpace > Math.floor(max * 0.6) ? sliced.slice(0, lastSpace) : sliced
  return `${base.trimEnd()}…`
}

function pickHighlight(source: BungalovSeoSource) {
  const pool = cleanText(source.poolType)
  if (pool) return pool

  const features = (source.features || []).map(cleanText).filter(Boolean)
  const preferred = ["Jakuzi", "Şömine", "Isıtmalı Havuz", "Özel Havuz", "Bahçe", "Teras"]
  for (const item of preferred) {
    const match = features.find((feature) => feature.toLocaleLowerCase("tr-TR").includes(item.toLocaleLowerCase("tr-TR")))
    if (match) return match
  }

  return features[0] || ""
}

/** Form alanlarından SEO title/description şablonu üretir. */
export function buildBungalovSeo(source: BungalovSeoSource): BungalovSeoResult {
  const name = cleanText(source.name) || "Bungalov"
  const location = cleanText(source.address) || "Sapanca"
  const highlight = pickHighlight(source)

  const titleParts = [name]
  if (highlight && !name.toLocaleLowerCase("tr-TR").includes(highlight.toLocaleLowerCase("tr-TR"))) {
    titleParts.push(highlight)
  }
  titleParts.push(location.includes("Sapanca") ? "Aden Bungalov" : `${location} | Aden Bungalov`)

  let seoTitle = titleParts.join(" | ")
  if (seoTitle.length > SEO_TITLE_LIMIT) {
    seoTitle = truncateAtWord(`${name} | Aden Bungalov Sapanca`, SEO_TITLE_LIMIT)
  }

  const facts: string[] = []
  if (source.capacity && source.capacity > 0) facts.push(`${source.capacity} kişilik`)
  if (source.bedrooms && source.bedrooms > 0) {
    facts.push(`${source.bedrooms} yatak odalı`)
  }
  if (highlight) facts.push(highlight.toLocaleLowerCase("tr-TR"))
  if (source.areaSqm && source.areaSqm > 0) facts.push(`${source.areaSqm} m²`)
  if (cleanText(source.internet)) facts.push(cleanText(source.internet))

  const descriptionSeed =
    cleanText(source.description) ||
    `${name}, ${location} doğasında konforlu bungalov konaklaması sunar.`

  const lead = facts.length > 0 ? `${name}; ${facts.join(", ")}.` : `${name}.`
  const seoDescription = truncateAtWord(
    `${lead} ${descriptionSeed} Online rezervasyon ve güncel müsaitlik için Aden Bungalov.`,
    SEO_DESCRIPTION_LIMIT
  )

  return { seoTitle, seoDescription }
}

/** Boş SEO alanlarını şablonla doldurur; dolu alanlara dokunmaz. */
export function fillEmptyBungalovSeo(
  source: BungalovSeoSource,
  current: { seoTitle?: string | null; seoDescription?: string | null }
): BungalovSeoResult {
  const generated = buildBungalovSeo(source)
  return {
    seoTitle: cleanText(current.seoTitle) || generated.seoTitle,
    seoDescription: cleanText(current.seoDescription) || generated.seoDescription,
  }
}
