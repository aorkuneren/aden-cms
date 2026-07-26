import { normalizePath } from "@/lib/seo/path"
import type { SeoSchemaType } from "@/lib/seo/types"

export type PageEntityDef = {
  entityId: string
  path: string
  label: string
  schemaType: Exclude<SeoSchemaType, null>
  priority: number
  changeFreq: "daily" | "weekly" | "monthly"
}

/** Sabit sayfa kimlikleri — path değişse bile entityId sabit kalır. */
export const PAGE_ENTITY_IDS = {
  home: {
    entityId: "seo-home",
    path: "/",
    label: "Anasayfa",
    schemaType: "WebPage",
    priority: 1,
    changeFreq: "daily",
  },
  bungalovlarimiz: {
    entityId: "seo-bungalovlarimiz",
    path: "/bungalovlarimiz",
    label: "Bungalovlarımız",
    schemaType: "CollectionPage",
    priority: 0.9,
    changeFreq: "daily",
  },
  galeri: {
    entityId: "seo-galeri",
    path: "/galeri",
    label: "Galeri",
    schemaType: "CollectionPage",
    priority: 0.7,
    changeFreq: "weekly",
  },
  kurumsal: {
    entityId: "seo-kurumsal",
    path: "/kurumsal",
    label: "Kurumsal",
    schemaType: "AboutPage",
    priority: 0.6,
    changeFreq: "monthly",
  },
  iletisim: {
    entityId: "seo-iletisim",
    path: "/iletisim",
    label: "İletişim",
    schemaType: "ContactPage",
    priority: 0.7,
    changeFreq: "monthly",
  },
  rezervasyonTalep: {
    entityId: "seo-rezervasyon-talep",
    path: "/rezervasyon-talep",
    label: "Rezervasyon Talep",
    schemaType: "WebPage",
    priority: 0.5,
    changeFreq: "monthly",
  },
} as const satisfies Record<string, PageEntityDef>

export function listPageDefs(): PageEntityDef[] {
  return Object.values(PAGE_ENTITY_IDS)
}

export function getPageDefByEntityId(entityId: string): PageEntityDef | null {
  return listPageDefs().find((d) => d.entityId === entityId) ?? null
}

export function getPageDefByPath(path: string): PageEntityDef | null {
  const normalized = normalizePath(path)
  return listPageDefs().find((d) => normalizePath(d.path) === normalized) ?? null
}
