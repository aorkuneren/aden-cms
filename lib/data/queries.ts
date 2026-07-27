import {
  bungalowSchema,
  cmsPageContentSchema,
  currencyListSchema,
  languageListSchema,
  publicSettingsSchema,
  termsListSchema,
  websiteCmsConfigSchema,
  type BungalowData,
  type CurrencyData,
  type LanguageData,
  type PublicSettingsData,
} from "@/lib/data/schemas"
import type { WebsiteCmsConfig } from "@/lib/site/website-cms-types"
import { normalizeBungalovContentItems } from "@/lib/bungalov-content"
import { readJson } from "@/lib/cms/store"
import { ensureSoftDeleteFields } from "@/lib/cms/normalize-soft-delete"
import { filterActive } from "@/lib/cms/soft-delete"

// İçerik artık BUILD anında import edilmez; ÇALIŞMA anında data/*.json'dan
// okunur (lib/cms/store). Böylece admin panelinden yapılan düzenlemeler
// yeniden derleme gerektirmeden yansır.
const CMS_FILES = {
  bungalovs: "bungalovs.json",
  cmsConfig: "cms-config.json",
  currencies: "currencies.json",
  languages: "languages.json",
  pageContent: "page-content.json",
  settings: "settings.json",
  terms: "terms.json",
} as const

type AnyRecord = Record<string, unknown>

export type CmsPageContentMap = Record<string, Record<string, string>>
export type BungalovRow = BungalowData
export type SettingsRow = PublicSettingsData
export type LanguageRow = LanguageData
export type CurrencyRow = CurrencyData

type BungalovFilter = { status?: string | { in: string[] } | { not: string } }
type BungalovOptions = { orderBy?: { name?: "asc" | "desc" } }

function mapBungalow(row: any): BungalovRow {
  return bungalowSchema.parse({
    ...row,
    slug: row.slug || row.id,
    nightlyPrice: typeof row.nightlyPrice === "number" ? row.nightlyPrice : Number(row.nightlyPrice || 0),
    rules: normalizeBungalovContentItems(row.rules),
    nearbyPlaces: normalizeBungalovContentItems(row.nearbyPlaces, { splitLegacyDistance: true }),
    latitude: row.latitude ? Number(row.latitude) : null,
    longitude: row.longitude ? Number(row.longitude) : null,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : new Date(row.createdAt || Date.now()).toISOString(),
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : new Date(row.updatedAt || Date.now()).toISOString(),
  })
}

export const bungalovQueries = {
  findMany: async (filter?: BungalovFilter, options?: BungalovOptions): Promise<BungalovRow[]> => {
    let bungalowsData: any[]
    try {
      bungalowsData = await readJson<any[]>(CMS_FILES.bungalovs)
    } catch (err) {
      console.error("[bungalovQueries.findMany] CMS okunamadı:", err)
      return []
    }
    if (!Array.isArray(bungalowsData)) return []
    let rows = filterActive(bungalowsData.map(ensureSoftDeleteFields)).map(mapBungalow)
    if (filter?.status) {
      if (typeof filter.status === "string") {
        rows = rows.filter((r) => r.status === filter.status)
      } else if ("in" in filter.status && Array.isArray(filter.status.in)) {
        const inArr = filter.status.in
        rows = rows.filter((r) => inArr.includes(r.status))
      } else if ("not" in filter.status) {
        const notVal = filter.status.not
        rows = rows.filter((r) => r.status !== notVal)
      }
    } else {
      rows = rows.filter((r) => r.status !== "PASIF")
    }

    if (options?.orderBy?.name) {
      const dir = options.orderBy.name === "asc" ? 1 : -1
      rows.sort((a, b) => dir * a.name.localeCompare(b.name))
    }

    return rows
  },

  findUnique: async (idOrSlug: string): Promise<BungalovRow | null> => {
    let bungalowsData: any[]
    try {
      bungalowsData = await readJson<any[]>(CMS_FILES.bungalovs)
    } catch (err) {
      console.error("[bungalovQueries.findUnique] CMS okunamadı:", err)
      return null
    }
    if (!Array.isArray(bungalowsData)) return null
    const found = filterActive(bungalowsData.map(ensureSoftDeleteFields)).find(
      (b) => String(b.id) === String(idOrSlug) || String(b.slug || b.id) === String(idOrSlug)
    )
    return found ? mapBungalow(found) : null
  },
}

export const settingsQueries = {
  findFirst: async (): Promise<SettingsRow | null> => {
    try {
      const settingsData = await readJson<any>(CMS_FILES.settings)
      if (!settingsData) return null
      return publicSettingsSchema.parse(settingsData)
    } catch (err) {
      console.error("[settingsQueries.findFirst] CMS okunamadı:", err)
      return null
    }
  },
}

export const termsAndRuleQueries = {
  findMany: async (options?: { orderBy?: { order?: "asc" | "desc" } }) => {
    void options
    try {
      const termsData = await readJson<any>(CMS_FILES.terms)
      return termsListSchema.parse(termsData ?? [])
    } catch (err) {
      console.error("[termsAndRuleQueries.findMany] CMS okunamadı:", err)
      return []
    }
  },
}

export const websiteCmsQueries = {
  getConfig: async (): Promise<WebsiteCmsConfig> => {
    try {
      const cmsConfigData = await readJson<any>(CMS_FILES.cmsConfig)
      const config = websiteCmsConfigSchema.parse(cmsConfigData) as unknown as WebsiteCmsConfig
      return {
        ...config,
        sliderManagement: filterActive(config.sliderManagement.map(ensureSoftDeleteFields)),
        faqManagement: filterActive(config.faqManagement.map(ensureSoftDeleteFields)),
        whyAdenManagement: filterActive(config.whyAdenManagement.map(ensureSoftDeleteFields)),
        galleryManagement: {
          ...config.galleryManagement,
          categories: filterActive(config.galleryManagement.categories.map(ensureSoftDeleteFields)),
          items: filterActive(config.galleryManagement.items.map(ensureSoftDeleteFields)),
        },
      }
    } catch (err) {
      console.error("[websiteCmsQueries.getConfig] CMS okunamadı:", err)
      throw err
    }
  },

  getPageContent: async (slug: string): Promise<CmsPageContentMap> => {
    try {
      const pageContentData = await readJson<Record<string, any>>(CMS_FILES.pageContent)
      const pageContent = (pageContentData as Record<string, any>)[slug]
      if (!pageContent) return {}
      return cmsPageContentSchema.parse(pageContent)
    } catch (err) {
      console.error("[websiteCmsQueries.getPageContent] CMS okunamadı:", err)
      return {}
    }
  },
}

export const localizationQueries = {
  getActiveLanguages: async (): Promise<LanguageRow[]> => {
    try {
      const languagesData = await readJson<any>(CMS_FILES.languages)
      return languageListSchema.parse(languagesData ?? [])
    } catch (err) {
      console.error("[localizationQueries.getActiveLanguages] CMS okunamadı:", err)
      return []
    }
  },
  getActiveCurrencies: async (): Promise<CurrencyRow[]> => {
    try {
      const currenciesData = await readJson<any>(CMS_FILES.currencies)
      return currencyListSchema.parse(currenciesData ?? [])
    } catch (err) {
      console.error("[localizationQueries.getActiveCurrencies] CMS okunamadı:", err)
      return []
    }
  },
}

export const reservationQueries = {
  findMany: async (filter?: AnyRecord) => {
    void filter
    return [] as AnyRecord[]
  },
  findUnique: async (id: string) => {
    void id
    return null
  },
}
