import {
  normalizeBungalovContentItems,
  type BungalovContentItem,
} from "@/lib/bungalov-content"

export type SiteNavItem = {
  href: string
  label: string
}

export type CorporatePageItem = {
  slug: CorporateSlug
  title: string
  description: string
}

export type CorporateSlug =
  | "hakkimizda"
  | "hesap-numaralarimiz"
  | "kiralama-sartlari"
  | "kvkk-aydinlatma-metni"
  | "cerez-politikasi"
  | "iptal-politikasi"
  | "gizlilik-bildirimi"

export type SiteBungalov = {
  id: string
  slug: string
  name: string
  status: string
  image: string | null
  galleryImages: string[]
  capacity: number
  description: string | null
  nightlyPrice: number
  features: string[]
  rules: BungalovContentItem[]
  nearbyPlaces: BungalovContentItem[]
}

export const BUNGALOW_PLACEHOLDER_IMAGE =
  "https://www.adenbungalov.com/upload/1736514349-67811b2d1db41.webp"

export const SITE_NAV_ITEMS: SiteNavItem[] = [
  { href: "/", label: "Anasayfa" },
  { href: "/bungalovlarimiz", label: "Bungalovlarımız" },
  { href: "/kurumsal", label: "Kurumsal" },
  { href: "/iletisim", label: "İletişim" },
]

export const CORPORATE_PAGES: CorporatePageItem[] = [
  {
    slug: "hakkimizda",
    title: "Hakkımızda",
    description: "Aden Bungalov marka hikayesi ve Sapanca deneyimi.",
  },
  {
    slug: "hesap-numaralarimiz",
    title: "Hesap Numaralarımız",
    description: "Banka ve IBAN bilgilerimiz.",
  },
  {
    slug: "kiralama-sartlari",
    title: "Kiralama Şartları",
    description: "Konaklama sürecine dair kullanım koşulları.",
  },
  {
    slug: "kvkk-aydinlatma-metni",
    title: "KVKK Aydınlatma Metni",
    description: "Kişisel verilerin işlenmesi ve korunması hakkında bilgilendirme.",
  },
  {
    slug: "cerez-politikasi",
    title: "Çerez Politikası",
    description: "Web sitesinde kullanılan çerez kategorileri ve tercih yönetimi.",
  },
  {
    slug: "iptal-politikasi",
    title: "İptal Politikası",
    description: "İptal, değişiklik ve iade süreçleri.",
  },
  {
    slug: "gizlilik-bildirimi",
    title: "Gizlilik Bildirimi",
    description: "Web sitesi gizlilik ve veri koruma politikası.",
  },
]

const AREA_HINT_BY_CAPACITY: Record<number, number> = {
  2: 35,
  3: 42,
  4: 55,
  5: 68,
  6: 75,
}

export function getAreaHintByCapacity(capacity: number) {
  if (AREA_HINT_BY_CAPACITY[capacity]) {
    return AREA_HINT_BY_CAPACITY[capacity]
  }

  if (capacity <= 2) return 35
  if (capacity >= 7) return 82
  return 35 + (capacity - 2) * 10
}

export function getAreaLabel(capacity: number) {
  return `${getAreaHintByCapacity(capacity)} m²`
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

export function formatNightlyPrice(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "Fiyat sorunuz"
  }
  return `${formatCurrency(value)}/gece`
}

export function normalizeWhatsappPhone(value: string | null | undefined) {
  if (!value) return ""
  return value.replace(/\D/g, "")
}

export function normalizePhoneHref(value: string | null | undefined) {
  if (!value) return ""
  const digits = value.replace(/\D/g, "")
  if (!digits) return ""
  return `tel:+${digits}`
}

export function toSiteBungalov(value: Record<string, unknown>): SiteBungalov {
  const dbImage = typeof value.image === "string" ? value.image : null
  const normalizedDbImage = dbImage?.trim() || null
  const normalizedGalleryImages = Array.isArray(value.galleryImages)
    ? Array.from(
        new Set(
          value.galleryImages
            .map((image) => String(image || "").trim())
            .filter((image) => image.length > 0)
        )
      )
    : []
  const id = String(value.id ?? "")
  const slugRaw = typeof value.slug === "string" ? value.slug.trim() : ""
  return {
    id,
    slug: slugRaw || id,
    name: String(value.name ?? ""),
    status: String(value.status ?? "AKTIF"),
    image: normalizedDbImage || BUNGALOW_PLACEHOLDER_IMAGE,
    galleryImages: normalizedGalleryImages,
    capacity: Number(value.capacity ?? 0),
    description: typeof value.description === "string" ? value.description : null,
    nightlyPrice: Number(value.nightlyPrice ?? 0),
    features: Array.isArray(value.features)
      ? value.features
          .map((feature) => String(feature))
          .filter((feature) => feature.trim().length > 0)
      : [],
    rules: normalizeBungalovContentItems(value.rules),
    nearbyPlaces: normalizeBungalovContentItems(value.nearbyPlaces, {
      splitLegacyDistance: true,
    }),
  }
}
