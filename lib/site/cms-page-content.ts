import { CORPORATE_CONTENT_DEFAULTS, corporateFieldPrefix } from "@/lib/site/corporate-content"

export type CmsManagedPageSlug =
  | "ana-sayfa"
  | "bungalovlarimiz"
  | "galeri"
  | "rezervasyon-talep"
  | "kurumsal"
  | "iletisim"

export type CmsManagedPageSectionDefinition = {
  key: string
  type: string
  label: string
  defaultContent: Record<string, string>
}

export type CmsManagedPageDefinition = {
  slug: CmsManagedPageSlug
  title: string
  status: "DRAFT" | "PUBLISHED"
  template: string
  sections: CmsManagedPageSectionDefinition[]
}

const CORPORATE_LEGAL_DEFAULT_CONTENT = Object.entries(CORPORATE_CONTENT_DEFAULTS).reduce(
  (acc, [slug, item]) => {
    const prefix = corporateFieldPrefix(slug as keyof typeof CORPORATE_CONTENT_DEFAULTS)
    acc[`${prefix}_title`] = item.title
    acc[`${prefix}_description`] = item.description
    acc[`${prefix}_content`] = item.content
    return acc
  },
  {} as Record<string, string>
)

export const CMS_MANAGED_PAGES: CmsManagedPageDefinition[] = [
  {
    slug: "ana-sayfa",
    title: "Ana Sayfa",
    status: "PUBLISHED",
    template: "HOME",
    sections: [
      {
        key: "about",
        type: "CONTENT",
        label: "Hakkımızda Alanı",
        defaultContent: {
          eyebrow: "Hakkımızda",
          title: "Doğanın Kalbindeki Eviniz",
          description:
            "Sapanca'nın eşsiz doğasıyla iç içe, mavi ve yeşilin en güzel tonlarını bir araya getiren Aden Bungalov, misafirlerine unutulmaz bir huzur deneyimi sunuyor.",
          imageUrl1: "",
          imageUrl2: "",
          imageUrl3: "",
          imageUrl4: "",
          buttonLabel: "Devamını oku",
          buttonVisible: "true",
        },
      },
      {
        key: "featured-bungalows",
        type: "LISTING",
        label: "Öne Çıkan Bungalovlar",
        defaultContent: {
          eyebrow: "Bungalovlarımız",
          title: "Her İhtiyaca Uygun, Lüks ve Konforlu Suitlerimiz",
          description:
            "Sizlere en iyi deneyimi sunmak için özenle tasarlanmış bungalovlarımızda; ücretsiz yüksek hızlı Wi-Fi, rahat çift kişilik yataklar ve ferah yaşam alanları standarttır.",
          emptyStateText: "Şu anda yayında aktif bungalow bulunmuyor.",
          limit: "5",
          autoplayEnabled: "true",
          autoplaySeconds: "5",
          pauseOnHover: "true",
          showDots: "true",
          loop: "true",
        },
      },
      {
        key: "why-aden",
        type: "CONTENT",
        label: "Neden Aden Alanı",
        defaultContent: {
          eyebrow: "Neden Aden Bungalov?",
          title: "Tatiliniz İçin Neden Bizi Seçmelisiniz?",
          description:
            "Sapanca'da bungalov kiralarken beklentilerinizin ötesine geçiyoruz. İşte Aden Bungalov'da sizi bekleyen ayrıcalıklar:",
        },
      },
      {
        key: "gallery",
        type: "GALLERY",
        label: "Galeri Başlığı",
        defaultContent: {
          title: "Göz Atın: Cennetten Bir Köşe",
          description:
            "Aden Bungalov'un modern mimarisini, huzur dolu bahçelerini, özel havuzlarını ve Sapanca'nın eşsiz göl manzarasını fotoğraf galerimizde keşfedin.",
        },
      },
      {
        key: "cta",
        type: "CTA",
        label: "Çağrı Alanı",
        defaultContent: {
          eyebrow: "Rezervasyon",
          title: "Doğanın Kalbindeki Yerinizi Ayırtmak İçin Geç Kalmayın!",
          description:
            "Şehrin gürültüsünü geride bırakmanın ve kendinize bir iyilik yapmanın zamanı gelmedi mi? İhtiyacınız olan huzur, konfor ve doğa Aden Bungalov'da sizi bekliyor.",
          responseTitle: "Hızlı Dönüş",
          responseDescription: "Rezervasyon taleplerine aynı gün içinde geri dönüş sağlıyoruz.",
          reservationButtonEnabled: "true",
          reservationButtonLabel: "Hızlı Rezervasyon",
          phoneButtonEnabled: "true",
          phoneButtonPrefix: "Bizi Arayın:",
          imageUrl1: "",
          imageUrl2: "",
        },
      },
      {
        key: "faq",
        type: "FAQ",
        label: "SSS Başlığı",
        defaultContent: {
          eyebrow: "SSS",
          title: "Sıkça Sorulan Sorular",
          description:
            "Konaklama süreci, tesis detayları ve rezervasyon adımlarıyla ilgili en çok sorulan soruları tek alanda bulabilirsiniz.",
          supportTitle: "Hala sorularınız mı var?",
          supportDescription: "Aradığınız yanıtı bulamadıysanız ekibimizle hemen iletişime geçin.",
          supportButtonLabel: "İletişime Geç",
        },
      },
    ],
  },
  {
    slug: "galeri",
    title: "Galeri",
    status: "PUBLISHED",
    template: "GALLERY",
    sections: [
      {
        key: "page-hero",
        type: "HERO",
        label: "Sayfa Başlığı",
        defaultContent: {
          title: "Foto Galeri",
          description: "Aden Bungalov galerisi: tüm kategorilerdeki görselleri keşfedin.",
        },
      },
    ],
  },
  {
    slug: "bungalovlarimiz",
    title: "Bungalovlarımız",
    status: "PUBLISHED",
    template: "LISTING",
    sections: [
      {
        key: "listing-hero",
        type: "HERO",
        label: "Sayfa Başlığı",
        defaultContent: {
          eyebrow: "Bungalovlarımız",
          title: "Bungalovlarımız",
          description: "Tüm suit seçeneklerimizi karşılaştırın, müsaitliği kontrol edin ve hızlıca talep oluşturun.",
          emptyStateText: "Şu anda listelenecek aktif bungalov bulunmuyor.",
        },
      },
      {
        key: "listing-behavior",
        type: "LISTING",
        label: "Liste Davranışı",
        defaultContent: {
          limit: "9",
          loadMode: "load-more",
        },
      },
      {
        key: "listing-grid",
        type: "GRID",
        label: "Liste Alanı",
        defaultContent: {
          emptyStateText: "Şu anda listelenecek aktif bungalov bulunmuyor.",
        },
      },
    ],
  },
  {
    slug: "rezervasyon-talep",
    title: "Rezervasyon Talep",
    status: "PUBLISHED",
    template: "FORM",
    sections: [
      {
        key: "request-hero",
        type: "HERO",
        label: "Sayfa Başlığı",
        defaultContent: {
          eyebrow: "Online Rezervasyon",
          title: "Rezervasyon Talebi Oluştur",
          description:
            "Üyelikli veya üyeliksiz talep akışını kullanarak konaklama isteğinizi iletin. Talebiniz sonrası ekip en kısa sürede sizinle iletişime geçer.",
        },
      },
    ],
  },
  {
    slug: "kurumsal",
    title: "Kurumsal",
    status: "PUBLISHED",
    template: "CORPORATE",
    sections: [
      {
        key: "corporate-hero",
        type: "HERO",
        label: "Sayfa Başlığı",
        defaultContent: {
          eyebrow: "Kurumsal",
          title: "Kurumsal ve Yasal Bilgiler",
          description:
            "Rezervasyon öncesi ihtiyaç duyulan resmi metinler ve işletme bilgilerine buradan ulaşabilirsiniz.",
          introVisible: "true",
          intro:
            "Bu alan; Hakkımızda, banka hesap bilgileri, kiralama şartları, KVKK, iptal politikası ve gizlilik metinlerini tek noktada erişilebilir kılar.",
        },
      },
      {
        key: "corporate-legal",
        type: "CONTENT",
        label: "Kurumsal İçerik Sayfaları",
        defaultContent: CORPORATE_LEGAL_DEFAULT_CONTENT,
      },
    ],
  },
  {
    slug: "iletisim",
    title: "İletişim",
    status: "PUBLISHED",
    template: "CONTACT",
    sections: [
      {
        key: "contact-hero",
        type: "HERO",
        label: "Sayfa Başlığı",
        defaultContent: {
          eyebrow: "İletişim",
          title: "Bizimle İletişime Geçin",
          description:
            "İletişim, şikayet, talep ve öneri/istek bildirimlerinizi aşağıdaki formdan iletebilirsiniz.",
        },
      },
      {
        key: "contact-cards",
        type: "INFO",
        label: "Üst Bilgi Kartları",
        defaultContent: {
          whatsappTitle: "WhatsApp Destek",
          whatsappDescription: "Ort. 2 Dakikada Hızlı Yanıt",
          phoneTitle: "Telefon İletişim",
          emailTitle: "E-Posta Adresi",
          locationTitle: "Tesis Konumu",
        },
      },
      {
        key: "contact-info",
        type: "INFO",
        label: "Form Türleri",
        defaultContent: {
          communicationLabel: "İletişim",
          communication: "Genel bilgi ve fiyat soruları",
          complaintLabel: "Şikayet",
          complaint: "Hizmet deneyimi ile ilgili bildirimler",
          requestLabel: "Talep",
          request: "Rezervasyon, tarih değişikliği, özel istekler",
          suggestionLabel: "Öneri / İstek",
          suggestion: "Geliştirme fikirleri ve memnuniyet notları",
        },
      },
      {
        key: "form-fields",
        type: "FORM",
        label: "Form Alanları",
        defaultContent: {
          typeLabel: "Form Türü",
          nameLabel: "Ad Soyad",
          namePlaceholder: "Örn: Ahmet Yılmaz",
          phoneLabel: "Telefon",
          phonePlaceholder: "0532 123 45 67",
          emailLabel: "E-posta",
          emailPlaceholder: "ornek@email.com",
          subjectLabel: "Konu",
          subjectPlaceholder: "Örn: Hafta Sonu Konaklama İsteği",
          messageLabel: "Mesajınız",
          messagePlaceholder: "Sorunuzu veya talebinizi buraya detaylıca yazabilirsiniz...",
        },
      },
      {
        key: "form-settings",
        type: "FORM",
        label: "Form Ayarları",
        defaultContent: {
          formTitle: "Bize Mesaj Gönderin",
          submitLabel: "Mesajı Gönder",
          submittingLabel: "Gönderiliyor...",
          successMessage: "Mesajınız başarıyla iletildi.",
          errorMessage: "Mesaj gönderiminde hata oluştu.",
        },
      },
      {
        key: "contact-region",
        type: "INFO",
        label: "Harita ve Bölge Bilgisi",
        defaultContent: {
          title: "Bölge Bilgisi",
          description:
            "Aden Bungalov, Sapanca / Sakarya bölgesinde doğa ve göl manzaralı konaklama deneyimi sunar. Rezervasyon taleplerine mobil odaklı hızlı geri dönüş hedeflenir.",
        },
      },
    ],
  },
]

export const CMS_MANAGED_PAGES_BY_SLUG = CMS_MANAGED_PAGES.reduce(
  (acc, page) => {
    acc[page.slug] = page
    return acc
  },
  {} as Record<CmsManagedPageSlug, CmsManagedPageDefinition>
)

export function isCmsManagedPageSlug(value: string): value is CmsManagedPageSlug {
  return value in CMS_MANAGED_PAGES_BY_SLUG
}

export function getCmsManagedPage(slug: CmsManagedPageSlug) {
  return CMS_MANAGED_PAGES_BY_SLUG[slug]
}

export function getCmsManagedPageSection(
  slug: CmsManagedPageSlug,
  sectionKey: string
): CmsManagedPageSectionDefinition | null {
  const page = getCmsManagedPage(slug)
  return page.sections.find((section) => section.key === sectionKey) || null
}

export function buildDefaultSectionContentMap(slug: CmsManagedPageSlug) {
  const page = getCmsManagedPage(slug)
  return page.sections.reduce(
    (acc, section) => {
      acc[section.key] = { ...section.defaultContent }
      return acc
    },
    {} as Record<string, Record<string, string>>
  )
}
