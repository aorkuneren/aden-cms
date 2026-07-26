export type BungalovContentItem = {
  id: string
  title: string
  description: string
  visible: boolean
}

export type BungalovContentPreset = {
  title: string
  description: string
}

export type BungalovContentCatalog = {
  rules: BungalovContentPreset[]
  nearbyPlaces: BungalovContentPreset[]
}

/** Panelde tek tıkla eklenebilen standart konaklama kuralları. */
export const STAY_RULE_PRESETS: BungalovContentPreset[] = [
  {
    title: "Minimum Konaklama",
    description: "Bu tesis için minimum 2 gece konaklama kuralı uygulanmaktadır.",
  },
  {
    title: "Giriş & Çıkış Saatleri",
    description:
      "Giriş saati 14:00, çıkış saati 11:00'dir. Çıkış gününde saat 14:00 sonrası yeni giriş yapılabilir.",
  },
  {
    title: "Evcil Hayvan Politikası",
    description: "Tesisimiz evcil hayvan dostudur. (Küçük/orta ırk dostlarımız kabul edilir)",
  },
  {
    title: "Sessizlik Saatleri",
    description:
      "Bahçe ve veranda alanlarında 23:00 sonrası yüksek sesli müzik ve gürültü kısıtlaması mevcuttur.",
  },
  {
    title: "Sigara Kullanımı",
    description: "Veranda ve bahçe alanında serbesttir. İç mekanlarda sigara kullanımı yasaktır.",
  },
  {
    title: "Ödeme & Kapora",
    description:
      "₺3.000 tutarında ön kapora ödemesi ile rezervasyonunuz kesinleşir. Kalan tutar girişte tahsil edilir.",
  },
]

/** Panelde tek tıkla eklenebilen standart çevre/mesafe başlıkları. */
export const NEARBY_PLACE_PRESETS: BungalovContentPreset[] = [
  { title: "Havalimanı", description: "" },
  { title: "Şehir Merkezi", description: "" },
  { title: "Plaj", description: "500 m" },
  { title: "Otogar", description: "3 km" },
  { title: "Market", description: "" },
  { title: "Restaurant", description: "" },
  { title: "Toplu Ulaşım", description: "" },
  { title: "Hastane", description: "1 km" },
]

export function createEmptyContentCatalog(): BungalovContentCatalog {
  return { rules: [], nearbyPlaces: [] }
}

export function normalizeContentKeyword(value: string) {
  return String(value || "")
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

function toContentId(title: string) {
  return normalizeContentKeyword(title).replace(/\s+/g, "-")
}

export function createContentItemId() {
  return `ci-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function createEmptyContentItem(): BungalovContentItem {
  return { id: createContentItemId(), title: "", description: "", visible: true }
}

function dedupePresets(presets: BungalovContentPreset[]) {
  const seen = new Set<string>()
  const result: BungalovContentPreset[] = []
  for (const preset of presets || []) {
    const title = String(preset?.title || "").trim()
    if (!title) continue
    const key = normalizeContentKeyword(title)
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push({
      title,
      description: String(preset?.description || "").trim(),
    })
  }
  return result
}

export function normalizeContentCatalog(value: unknown): BungalovContentCatalog {
  const empty = createEmptyContentCatalog()
  if (!value || typeof value !== "object") return empty
  const record = value as Record<string, unknown>
  return {
    rules: dedupePresets(Array.isArray(record.rules) ? (record.rules as BungalovContentPreset[]) : []),
    nearbyPlaces: dedupePresets(
      Array.isArray(record.nearbyPlaces) ? (record.nearbyPlaces as BungalovContentPreset[]) : []
    ),
  }
}

/** Varsayılan + kayıtlı özel hazır başlıkları birleştirir. */
export function mergeContentPresets(
  defaults: BungalovContentPreset[],
  custom: BungalovContentPreset[] | null | undefined
) {
  return dedupePresets([...(defaults || []), ...(custom || [])])
}

export function mergeContentCatalogWithDefaults(catalog?: BungalovContentCatalog | null) {
  const normalized = normalizeContentCatalog(catalog)
  return {
    rules: mergeContentPresets(STAY_RULE_PRESETS, normalized.rules),
    nearbyPlaces: mergeContentPresets(NEARBY_PLACE_PRESETS, normalized.nearbyPlaces),
  }
}

function isDefaultPresetTitle(kind: "rules" | "nearbyPlaces", title: string) {
  const defaults = kind === "rules" ? STAY_RULE_PRESETS : NEARBY_PLACE_PRESETS
  const key = normalizeContentKeyword(title)
  return defaults.some((preset) => normalizeContentKeyword(preset.title) === key)
}

/** Varsayılan listede olmayan başlıkları katalog kaydı olarak ayıklar. */
export function extractCustomContentPresets(
  kind: "rules" | "nearbyPlaces",
  items: Array<Pick<BungalovContentItem, "title" | "description"> | BungalovContentPreset>
): BungalovContentPreset[] {
  return dedupePresets(
    (items || [])
      .map((item) => ({
        title: String(item?.title || "").trim(),
        description: String(item?.description || "").trim(),
      }))
      .filter((item) => item.title.length > 0 && !isDefaultPresetTitle(kind, item.title))
  )
}

export function mergeContentCatalogs(
  current: BungalovContentCatalog | null | undefined,
  incoming: BungalovContentCatalog | null | undefined
): BungalovContentCatalog {
  const base = normalizeContentCatalog(current)
  const next = normalizeContentCatalog(incoming)

  const mergeKind = (existing: BungalovContentPreset[], additions: BungalovContentPreset[]) => {
    const map = new Map<string, BungalovContentPreset>()
    for (const preset of existing) {
      map.set(normalizeContentKeyword(preset.title), preset)
    }
    for (const preset of additions) {
      const key = normalizeContentKeyword(preset.title)
      if (!key) continue
      const prev = map.get(key)
      map.set(key, {
        title: preset.title,
        description: preset.description || prev?.description || "",
      })
    }
    return Array.from(map.values())
  }

  return {
    rules: mergeKind(base.rules, next.rules),
    nearbyPlaces: mergeKind(base.nearbyPlaces, next.nearbyPlaces),
  }
}

/**
 * Kayıtlar hem eski düz metin dizisi hem de yeni başlık/açıklama nesnesi
 * biçiminde gelebilir; ikisini de tek biçime indirger. `splitLegacyDistance`
 * açıkken "Plaj - 500 m" gibi eski metinleri başlık ve mesafe olarak ayırır.
 */
export function normalizeBungalovContentItems(
  value: unknown,
  options?: { splitLegacyDistance?: boolean }
): BungalovContentItem[] {
  if (!Array.isArray(value)) return []

  const usedIds = new Set<string>()
  const items: BungalovContentItem[] = []

  value.forEach((entry, index) => {
    let title = ""
    let description = ""
    let visible = true
    let rawId = ""

    if (typeof entry === "string") {
      const text = entry.trim()
      if (!text) return

      const distanceMatch = options?.splitLegacyDistance
        ? text.match(/^(.*\S)\s+[-–—]\s+(\S.*)$/)
        : null
      if (distanceMatch) {
        title = distanceMatch[1].trim()
        description = distanceMatch[2].trim()
      } else {
        title = text
      }
    } else if (entry && typeof entry === "object") {
      const record = entry as Record<string, unknown>
      title = String(record.title ?? "").trim()
      description = String(record.description ?? "").trim()
      visible = record.visible === undefined ? true : Boolean(record.visible)
      rawId = String(record.id ?? "").trim()
    } else {
      return
    }

    if (!title && !description) return

    const baseId = rawId || toContentId(title) || `item-${index + 1}`
    let uniqueId = baseId
    let suffix = 2
    while (usedIds.has(uniqueId)) {
      uniqueId = `${baseId}-${suffix}`
      suffix += 1
    }
    usedIds.add(uniqueId)

    items.push({ id: uniqueId, title, description, visible })
  })

  return items
}

export function presetToContentItem(preset: BungalovContentPreset): BungalovContentItem {
  return {
    id: toContentId(preset.title) || createContentItemId(),
    title: preset.title,
    description: preset.description,
    visible: true,
  }
}
