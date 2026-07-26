import { CORPORATE_PAGES, SITE_NAV_ITEMS } from "@/lib/site/b2c"

export type CmsSocialProfile = {
  id: string
  platform: string
  icon: string
  url: string
}

export type CmsPageSeoItem = {
  id: string
  slug: string
  label: string
  title: string
  description: string
  keywords: string
}

export type CmsFooterLinkItem = {
  id: string
  label: string
  href: string
  isActive: boolean
}

export type CmsMenuGroupType =
  | "ANA_MENU"
  | "HIZLI_ERISIM"
  | "BUNGALOVLAR"
  | "SOZLESMELER"
  | "OZEL_MENU"

export type CmsMenuGroupItem = {
  id: string
  text: string
  href: string
  target: "SELF" | "BLANK"
  isActive: boolean
}

export type CmsMenuGroup = {
  id: string
  title: string
  type: CmsMenuGroupType
  isActive: boolean
  items: CmsMenuGroupItem[]
}

export type CmsFooterContactItem = {
  id: string
  enabled: boolean
  icon: string
  text: string
  link: string
}

export type CmsFooterSocialItem = {
  id: string
  enabled: boolean
  icon: string
  text: string
  link: string
}

export type CmsFooterColumnType = "LOGO" | "MENU_GROUP" | "BUNGALOV_LIST" | "CONTACT" | "SOCIAL"

export type CmsFooterColumn = {
  id: string
  enabled: boolean
  title: string
  type: CmsFooterColumnType
  menuType: CmsMenuGroupType
  menuGroupId: string
  bungalowLimit: number
}

export type CmsFooterManagement = {
  enabled: boolean
  logoUrl: string
  contactItems: CmsFooterContactItem[]
  socialItems: CmsFooterSocialItem[]
  columns: CmsFooterColumn[]
  copyrightText: string
  title: string
  quickLinks: CmsFooterLinkItem[]
}

export type CmsMenuItem = {
  id: string
  label: string
  href: string
  isActive: boolean
}

export type CmsTopHeaderItem = {
  id: string
  enabled: boolean
  icon: string
  text: string
  url: string
}

export type CmsHeaderTopRightConfig = {
  showLanguage: boolean
  showCurrency: boolean
  currencyLabel: string
}

export type CmsHeaderActionButton = {
  id: string
  enabled: boolean
  icon: string
  label: string
  url: string
  target: "SELF" | "BLANK"
}

export type CmsHeaderButtonConfig = {
  enabled: boolean
  label: string
  url: string
}

export type CmsSliderItem = {
  id: string
  imageUrl: string
  title: string
  description: string
  tags: string[]
  isActive: boolean
  videoUrl?: string
  mediaType?: "IMAGE" | "VIDEO"
  buttonText?: string
  buttonUrl?: string
  secondaryButtonText?: string
  secondaryButtonUrl?: string
  badgeText?: string
  overlayOpacity?: number
}

export type CmsGalleryItem = {
  id: string
  imageUrl: string
  title: string
  description: string
  categoryId: string
  isActive: boolean
  isFeatured?: boolean
}

export type CmsGalleryCategory = {
  id: string
  name: string
  isActive: boolean
}

export type CmsGalleryManagement = {
  categories: CmsGalleryCategory[]
  items: CmsGalleryItem[]
}

export type CmsFaqItem = {
  id: string
  question: string
  answer: string
  isActive: boolean
  category?: string
  isFeatured?: boolean
}

export type CmsWhyAdenItem = {
  id: string
  title: string
  description: string
  icon: string
  imageUrl: string
  isActive: boolean
}

export type WebsiteCmsConfig = {
  siteManagement: {
    seoTitle: string
    seoDescription: string
    seoKeywords: string
    logoDarkUrl: string
    logoLightUrl: string
    pageSeoItems: CmsPageSeoItem[]
    menuGroups: CmsMenuGroup[]
    socialProfiles: CmsSocialProfile[]
    footerManagement: CmsFooterManagement
  }
  headerManagement: {
    topHeaderEnabled: boolean
    topHeaderText: string
    topHeaderPhone: string
    topHeaderItems: CmsTopHeaderItem[]
    topHeaderRight: CmsHeaderTopRightConfig
    menuItems: CmsMenuItem[]
    menuType: CmsMenuGroupType
    menuGroupId: string
    actionButtons: CmsHeaderActionButton[]
    buttons: {
      whatsapp: CmsHeaderButtonConfig
      phone: CmsHeaderButtonConfig
      reservation: CmsHeaderButtonConfig
    }
  }
  sliderManagement: CmsSliderItem[]
  sliderSettings?: {
    autoplayEnabled?: boolean
    autoplaySeconds?: number
    pauseOnHover?: boolean
  }
  galleryManagement: CmsGalleryManagement
  faqManagement: CmsFaqItem[]
  whyAdenManagement: CmsWhyAdenItem[]
}

export function createCmsItemId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const DEFAULT_PAGE_SEO_ITEMS: CmsPageSeoItem[] = [
  { id: "seo-home", slug: "/", label: "Anasayfa", title: "", description: "", keywords: "" },
  { id: "seo-bungalovlarimiz", slug: "/bungalovlarimiz", label: "Bungalovlarımız", title: "", description: "", keywords: "" },
  { id: "seo-galeri", slug: "/galeri", label: "Galeri", title: "", description: "", keywords: "" },
  { id: "seo-kurumsal", slug: "/kurumsal", label: "Kurumsal", title: "", description: "", keywords: "" },
  { id: "seo-iletisim", slug: "/iletisim", label: "İletişim", title: "", description: "", keywords: "" },
  { id: "seo-rezervasyon-talep", slug: "/bungalovlarimiz", label: "Rezervasyon Talep", title: "", description: "", keywords: "" },
]

const DEFAULT_FOOTER_LINKS: CmsFooterLinkItem[] = [
  { id: "footer-link-rezervasyon", label: "Rezervasyon", href: "/bungalovlarimiz", isActive: true },
  { id: "footer-link-hesap-numaralarimiz", label: "Hesap Numaralarımız", href: "/kurumsal/hesap-numaralarimiz", isActive: true },
  { id: "footer-link-kiralama", label: "Kiralama Şartları", href: "/kurumsal/kiralama-sartlari", isActive: true },
  { id: "footer-link-kvkk", label: "KVKK Aydınlatma Metni", href: "/kurumsal/kvkk-aydinlatma-metni", isActive: true },
  { id: "footer-link-cerez", label: "Çerez Politikası", href: "/kurumsal/cerez-politikasi", isActive: true },
  { id: "footer-link-iptal", label: "İptal Politikası", href: "/kurumsal/iptal-politikasi", isActive: true },
  { id: "footer-link-gizlilik", label: "Gizlilik Bildirimi", href: "/kurumsal/gizlilik-bildirimi", isActive: true },
  { id: "footer-link-iletisim", label: "İletişim", href: "/iletisim", isActive: true },
]

const CONTRACT_SLUGS = new Set([
  "kiralama-sartlari",
  "kvkk-aydinlatma-metni",
  "cerez-politikasi",
  "iptal-politikasi",
  "gizlilik-bildirimi",
])

const DEFAULT_MAIN_MENU_GROUP_ID = "menu-group-ana-menu"
const DEFAULT_QUICK_ACCESS_MENU_GROUP_ID = "menu-group-hizli-erisim"
const DEFAULT_BUNGALOW_MENU_GROUP_ID = "menu-group-bungalovlar"
const DEFAULT_CONTRACTS_MENU_GROUP_ID = "menu-group-sozlesmeler"

const DEFAULT_MENU_GROUPS: CmsMenuGroup[] = [
  {
    id: DEFAULT_MAIN_MENU_GROUP_ID,
    title: "Ana Menü",
    type: "ANA_MENU",
    isActive: true,
    items: SITE_NAV_ITEMS.map((item, index) => ({
      id: `menu-main-${index}`,
      text: item.label,
      href: item.href,
      target: "SELF",
      isActive: true,
    })),
  },
  {
    id: DEFAULT_QUICK_ACCESS_MENU_GROUP_ID,
    title: "Hızlı Erişim",
    type: "HIZLI_ERISIM",
    isActive: true,
    items: DEFAULT_FOOTER_LINKS.map((item, index) => ({
      id: item.id || `menu-quick-${index}`,
      text: item.label,
      href: item.href,
      target: "SELF",
      isActive: item.isActive !== false,
    })),
  },
  {
    id: DEFAULT_BUNGALOW_MENU_GROUP_ID,
    title: "Bungalovlar",
    type: "BUNGALOVLAR",
    isActive: true,
    items: [
      {
        id: "menu-bungalov-list",
        text: "Tüm Bungalovlar",
        href: "/bungalovlarimiz",
        target: "SELF",
        isActive: true,
      },
    ],
  },
  {
    id: DEFAULT_CONTRACTS_MENU_GROUP_ID,
    title: "Sözleşmeler",
    type: "SOZLESMELER",
    isActive: true,
    items: CORPORATE_PAGES.filter((item) => CONTRACT_SLUGS.has(item.slug)).map((item, index) => ({
      id: `menu-contract-${index}`,
      text: item.title,
      href: `/kurumsal/${item.slug}`,
      target: "SELF",
      isActive: true,
    })),
  },
]

const DEFAULT_FOOTER_COLUMNS: CmsFooterColumn[] = [
  {
    id: "footer-col-logo",
    enabled: true,
    title: "Logo",
    type: "LOGO",
    menuType: "ANA_MENU",
    menuGroupId: "",
    bungalowLimit: 7,
  },
  {
    id: "footer-col-ana-menu",
    enabled: true,
    title: "Ana Menü",
    type: "MENU_GROUP",
    menuType: "ANA_MENU",
    menuGroupId: DEFAULT_MAIN_MENU_GROUP_ID,
    bungalowLimit: 7,
  },
  {
    id: "footer-col-hizli-erisim",
    enabled: true,
    title: "Hızlı Erişim",
    type: "MENU_GROUP",
    menuType: "HIZLI_ERISIM",
    menuGroupId: DEFAULT_QUICK_ACCESS_MENU_GROUP_ID,
    bungalowLimit: 7,
  },
  {
    id: "footer-col-bungalovlar",
    enabled: true,
    title: "Bungalov Listesi",
    type: "BUNGALOV_LIST",
    menuType: "BUNGALOVLAR",
    menuGroupId: DEFAULT_BUNGALOW_MENU_GROUP_ID,
    bungalowLimit: 7,
  },
  {
    id: "footer-col-contact",
    enabled: true,
    title: "İletişim",
    type: "CONTACT",
    menuType: "OZEL_MENU",
    menuGroupId: "",
    bungalowLimit: 7,
  },
]

export const DEFAULT_WEBSITE_CMS_CONFIG: WebsiteCmsConfig = {
  siteManagement: {
    seoTitle: "Aden Bungalov | Sapanca Bungalov Rezervasyon",
    seoDescription: "Sapanca doğasında premium bungalov konaklama deneyimi.",
    seoKeywords: "sapanca bungalov, aden bungalov, bungalov rezervasyon",
    logoDarkUrl: "",
    logoLightUrl: "",
    pageSeoItems: DEFAULT_PAGE_SEO_ITEMS,
    menuGroups: DEFAULT_MENU_GROUPS,
    socialProfiles: [
      {
        id: createCmsItemId("social"),
        platform: "Instagram",
        icon: "instagram",
        url: "",
      },
      {
        id: createCmsItemId("social"),
        platform: "Facebook",
        icon: "facebook",
        url: "",
      },
    ],
    footerManagement: {
      enabled: true,
      logoUrl: "",
      contactItems: [
        {
          id: "footer-contact-location",
          enabled: true,
          icon: "map-pin",
          text: "Sapanca / Sakarya",
          link: "",
        },
        {
          id: "footer-contact-phone",
          enabled: true,
          icon: "phone-call",
          text: "",
          link: "",
        },
        {
          id: "footer-contact-email",
          enabled: true,
          icon: "mail",
          text: "",
          link: "",
        },
      ],
      socialItems: [
        {
          id: "footer-social-instagram",
          enabled: true,
          icon: "instagram",
          text: "Instagram",
          link: "",
        },
        {
          id: "footer-social-facebook",
          enabled: true,
          icon: "facebook",
          text: "Facebook",
          link: "",
        },
      ],
      columns: DEFAULT_FOOTER_COLUMNS,
      copyrightText: "Copyright © 2023 Tüm Hakları Saklıdır.",
      title: "Hızlı Erişim",
      quickLinks: DEFAULT_FOOTER_LINKS,
    },
  },
  headerManagement: {
    topHeaderEnabled: true,
    topHeaderText: "Sapanca / Sakarya",
    topHeaderPhone: "",
    topHeaderItems: [
      {
        id: "top-header-location",
        enabled: true,
        icon: "map-pin",
        text: "Sapanca / Sakarya",
        url: "",
      },
      {
        id: "top-header-phone",
        enabled: true,
        icon: "phone",
        text: "",
        url: "",
      },
    ],
    topHeaderRight: {
      showLanguage: true,
      showCurrency: false,
      currencyLabel: "TRY",
    },
    menuItems: SITE_NAV_ITEMS.map((item) => ({
      id: createCmsItemId("menu"),
      label: item.label,
      href: item.href,
      isActive: true,
    })),
    menuType: "ANA_MENU",
    menuGroupId: DEFAULT_MAIN_MENU_GROUP_ID,
    actionButtons: [
      {
        id: "header-action-whatsapp",
        enabled: true,
        icon: "message-circle",
        label: "WhatsApp",
        url: "",
        target: "BLANK",
      },
      {
        id: "header-action-phone",
        enabled: true,
        icon: "phone-call",
        label: "Hemen Ara",
        url: "",
        target: "SELF",
      },
      {
        id: "header-action-reservation",
        enabled: true,
        icon: "calendar-check-2",
        label: "Hızlı Rezervasyon",
        url: "/bungalovlarimiz",
        target: "SELF",
      },
    ],
    buttons: {
      whatsapp: {
        enabled: true,
        label: "WhatsApp",
        url: "",
      },
      phone: {
        enabled: true,
        label: "Hemen Ara",
        url: "",
      },
      reservation: {
        enabled: true,
        label: "Hızlı Rezervasyon",
        url: "/bungalovlarimiz",
      },
    },
  },
  sliderManagement: [],
  galleryManagement: {
    categories: [
      {
        id: "gallery-category-bungalovlar",
        name: "Bungalovlar",
        isActive: true,
      },
      {
        id: "gallery-category-odalar-suit",
        name: "Odalar/Suit",
        isActive: true,
      },
    ],
    items: [],
  },
  faqManagement: [],
  whyAdenManagement: [],
}