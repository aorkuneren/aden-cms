import { CORPORATE_PAGES, type CorporateSlug } from "@/lib/site/b2c"

export type CorporatePageContentItem = {
  slug: CorporateSlug
  title: string
  description: string
  content: string
}

export const CORPORATE_CONTENT_DEFAULTS: Record<
  CorporateSlug,
  Omit<CorporatePageContentItem, "slug">
> = {
  hakkimizda: {
    title: "Hakkımızda",
    description: "Aden Bungalov marka hikayesi ve Sapanca deneyimi.",
    content:
      "Aden Bungalov, Sapanca doğasında huzur, konfor ve güvenli rezervasyon deneyimini bir araya getirir.\n\nMisafir memnuniyeti odaklı hizmet yaklaşımımızla konaklama sürecinin her adımını şeffaf ve hızlı şekilde yönetiyoruz.",
  },
  "hesap-numaralarimiz": {
    title: "Hesap Numaralarımız",
    description: "Banka ve IBAN bilgilerimiz.",
    content:
      "Ödeme işlemleri için güncel banka ve IBAN bilgilerimizi bu sayfada paylaşırız.\n\nÖdeme sonrasında dekontunuzu destek ekibimize ileterek rezervasyon sürecini hızlandırabilirsiniz.",
  },
  "kiralama-sartlari": {
    title: "Kiralama Şartları",
    description: "Konaklama sürecine dair kullanım koşulları.",
    content:
      "Kiralama şartları; giriş-çıkış saatleri, kullanım kuralları, misafir sorumlulukları ve tesis düzenine dair temel esasları içerir.",
  },
  "kvkk-aydinlatma-metni": {
    title: "KVKK Aydınlatma Metni",
    description: "Kişisel verilerin işlenmesi ve korunması hakkında bilgilendirme.",
    content:
      "6698 sayılı KVKK kapsamında kişisel verilerinizin hangi amaçlarla işlendiği, saklama süreleri ve haklarınız bu metinde açıklanır.",
  },
  "cerez-politikasi": {
    title: "Çerez Politikası",
    description: "Web sitesinde kullanılan çerez kategorileri ve tercih yönetimi.",
    content: "",
  },
  "iptal-politikasi": {
    title: "İptal Politikası",
    description: "İptal, değişiklik ve iade süreçleri.",
    content:
      "İptal, değişiklik ve iade adımları; rezervasyon tarihine kalan süre ve ödeme durumuna göre bu metinde belirtilen kurallara göre uygulanır.",
  },
  "gizlilik-bildirimi": {
    title: "Gizlilik Bildirimi",
    description: "Web sitesi gizlilik ve veri koruma politikası.",
    content:
      "Web sitemizin veri toplama, çerez kullanımı ve üçüncü taraf servislerle veri paylaşım ilkeleri bu gizlilik bildirimi kapsamında açıklanır.",
  },
}

export function corporateFieldPrefix(slug: CorporateSlug) {
  return slug.replace(/-/g, "_")
}

export function buildCorporatePageContent(
  content: Record<string, Record<string, string>>
): CorporatePageContentItem[] {
  const section = content["corporate-legal"] || {}

  return CORPORATE_PAGES.map((page) => {
    const defaults = CORPORATE_CONTENT_DEFAULTS[page.slug]
    const prefix = corporateFieldPrefix(page.slug)
    const title = String(section[`${prefix}_title`] || "").trim() || defaults.title
    const description = String(section[`${prefix}_description`] || "").trim() || defaults.description
    const body = String(section[`${prefix}_content`] || "").trim() || defaults.content

    return {
      slug: page.slug,
      title,
      description,
      content: body,
    }
  })
}
