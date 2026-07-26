export type BungalowFeatureCategoryKey = "genel" | "mutfak" | "mobilya" | "banyo" | "bahce"

export type BungalowFeatureCatalog = Record<BungalowFeatureCategoryKey, string[]>

type BungalowFeatureCategory = {
  key: BungalowFeatureCategoryKey
  label: string
  placeholder: string
  suggestions: string[]
}

export const BUNGALOW_FEATURE_CATEGORY_KEYS: BungalowFeatureCategoryKey[] = [
  "genel",
  "mutfak",
  "mobilya",
  "banyo",
  "bahce",
]

export const BUNGALOW_FEATURE_CATEGORIES: BungalowFeatureCategory[] = [
  {
    key: "genel",
    label: "Genel",
    placeholder: "Örn: Isıtmalı Havuz, Şömine, Deniz Manzarası",
    suggestions: [
      "Isıtmalı Havuz",
      "Özel Havuz",
      "Bahçe",
      "Şömine",
      "Çift Kişilik Oda",
      "Kahvaltı",
      "Deniz Manzarası",
      "Otopark",
      "Wi-Fi",
      "Jakuzi",
    ],
  },
  {
    key: "mutfak",
    label: "Mutfak",
    placeholder: "Örn: Mini Buzdolabı, Kahve Makinesi",
    suggestions: [
      "Mini Buzdolabı",
      "Elektrikli Çaycı",
      "Kahve Makinesi",
      "Elektrikli Ocak",
      "Çatal Kaşık Bıçak Seti",
      "Tencere Tava Seti",
      "Kesme Tahtası",
      "Bardak Seti",
      "Çöp Kovası",
      "Mutfak Gereçleri",
    ],
  },
  {
    key: "mobilya",
    label: "Mobilya",
    placeholder: "Örn: L Koltuk, Çift Kişilik Yatak",
    suggestions: [
      "L Koltuk",
      "Çift Kişilik Yatak",
      "Tek Kişilik Yatak",
      "Yemek Masası",
      "Sallanan Sandalye",
      "Boy Aynası",
      "Elbise Dolabı",
      "Klima",
      "Komodin",
      "Televizyon",
      "Çarşaf Takımı",
    ],
  },
  {
    key: "banyo",
    label: "Banyo",
    placeholder: "Örn: Duşakabin, Havlu Seti",
    suggestions: [
      "Duşakabin",
      "Şampuan ve Sabun",
      "Havlu Seti",
      "Fön Makinesi",
      "Sıcak Su",
    ],
  },
  {
    key: "bahce",
    label: "Bahçe",
    placeholder: "Örn: Bahçe Oturma Grubu, Barbekü",
    suggestions: [
      "Bahçe Oturma Grubu",
      "Salıncak",
      "Barbekü",
      "Veranda / Teras",
      "Şezlong",
      "Güneşlenme Alanı",
    ],
  },
]

export function createEmptyFeatureCatalog(): BungalowFeatureCatalog {
  return {
    genel: [],
    mutfak: [],
    mobilya: [],
    banyo: [],
    bahce: [],
  }
}

export function normalizeFeatureToken(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function createEmptyCategoryMap(): BungalowFeatureCatalog {
  return createEmptyFeatureCatalog()
}

function dedupeFeatureList(values: string[]) {
  const seen = new Set<string>()
  const result: string[] = []
  for (const value of values || []) {
    const text = String(value || "").trim()
    if (!text) continue
    const key = text.toLocaleLowerCase("tr-TR")
    if (seen.has(key)) continue
    seen.add(key)
    result.push(text)
  }
  return result
}

/** JSON / bilinmeyen girdiyi güvenli katalog biçimine çevirir. */
export function normalizeFeatureCatalog(value: unknown): BungalowFeatureCatalog {
  const empty = createEmptyFeatureCatalog()
  if (!value || typeof value !== "object") return empty
  const record = value as Record<string, unknown>
  for (const key of BUNGALOW_FEATURE_CATEGORY_KEYS) {
    empty[key] = dedupeFeatureList(Array.isArray(record[key]) ? record[key].map(String) : [])
  }
  return empty
}

function buildFeatureCategoryLookup(catalog?: BungalowFeatureCatalog | null) {
  const map = new Map<string, BungalowFeatureCategoryKey>()
  for (const category of BUNGALOW_FEATURE_CATEGORIES) {
    for (const suggestion of category.suggestions) {
      map.set(normalizeFeatureToken(suggestion), category.key)
    }
  }
  if (catalog) {
    for (const key of BUNGALOW_FEATURE_CATEGORY_KEYS) {
      for (const suggestion of catalog[key] || []) {
        const token = normalizeFeatureToken(suggestion)
        if (!token || map.has(token)) continue
        map.set(token, key)
      }
    }
  }
  return map
}

/** Varsayılan + kaydedilmiş özel önerileri birleştirir (özel olanlar sonda). */
export function mergeFeatureCategoriesWithCatalog(catalog?: BungalowFeatureCatalog | null) {
  const normalized = normalizeFeatureCatalog(catalog)
  return BUNGALOW_FEATURE_CATEGORIES.map((category) => ({
    ...category,
    suggestions: dedupeFeatureList([
      ...category.suggestions,
      ...(normalized[category.key] || []),
    ]),
  }))
}

/** Yalnızca varsayılan listede olmayan özellikleri katalog olarak ayıklar. */
export function extractCustomFeaturesForCatalog(
  grouped: Partial<Record<BungalowFeatureCategoryKey, string[]>>
): BungalowFeatureCatalog {
  const defaults = new Map<string, BungalowFeatureCategoryKey>()
  for (const category of BUNGALOW_FEATURE_CATEGORIES) {
    for (const suggestion of category.suggestions) {
      defaults.set(normalizeFeatureToken(suggestion), category.key)
    }
  }

  const custom = createEmptyFeatureCatalog()
  for (const key of BUNGALOW_FEATURE_CATEGORY_KEYS) {
    for (const value of grouped[key] || []) {
      const text = String(value || "").trim()
      if (!text) continue
      const token = normalizeFeatureToken(text)
      if (!token || defaults.has(token)) continue
      custom[key].push(text)
    }
    custom[key] = dedupeFeatureList(custom[key])
  }
  return custom
}

/** İki kataloğu birleştirir; mevcut başlıklar korunur, yeniler eklenir. */
export function mergeFeatureCatalogs(
  current: BungalowFeatureCatalog | null | undefined,
  incoming: BungalowFeatureCatalog | null | undefined
): BungalowFeatureCatalog {
  const base = normalizeFeatureCatalog(current)
  const next = normalizeFeatureCatalog(incoming)
  for (const key of BUNGALOW_FEATURE_CATEGORY_KEYS) {
    base[key] = dedupeFeatureList([...base[key], ...next[key]])
  }
  return base
}

export function splitBungalowFeaturesByCategory(
  features: string[],
  catalog?: BungalowFeatureCatalog | null
) {
  const grouped = createEmptyCategoryMap()
  const lookup = buildFeatureCategoryLookup(catalog)
  const seenByCategory = new Map<BungalowFeatureCategoryKey, Set<string>>()

  for (const feature of features || []) {
    const text = String(feature || "").trim()
    if (!text) continue

    const normalized = normalizeFeatureToken(text)
    const category = lookup.get(normalized) || "genel"
    const categorySet = seenByCategory.get(category) || new Set<string>()
    const dedupeKey = text.toLocaleLowerCase("tr-TR")
    if (categorySet.has(dedupeKey)) continue

    categorySet.add(dedupeKey)
    seenByCategory.set(category, categorySet)
    grouped[category].push(text)
  }

  return grouped
}

export function mergeBungalowFeaturesFromCategoryMap(grouped: Record<BungalowFeatureCategoryKey, string[]>) {
  const seen = new Set<string>()
  const merged: string[] = []

  for (const category of BUNGALOW_FEATURE_CATEGORIES) {
    const values = grouped[category.key] || []
    for (const value of values) {
      const text = String(value || "").trim()
      if (!text) continue
      const dedupeKey = text.toLocaleLowerCase("tr-TR")
      if (seen.has(dedupeKey)) continue
      seen.add(dedupeKey)
      merged.push(text)
    }
  }

  return merged
}
