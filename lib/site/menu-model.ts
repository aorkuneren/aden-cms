/**
 * Menü Yönetim Sistemi — veri modeli ve sabitler.
 *
 * MİMARİ NOT: Bu proje JSON-dosya tabanlı bir CMS'tir (Prisma mock, bkz.
 * lib/cms/store.ts). Bu yüzden şartnamedeki SQL `menu_groups`/`menu_items`
 * tabloları burada `cms-config.json → siteManagement.menuGroups` altındaki
 * zengin JSON modeline uyarlanmıştır. Alan adları şartnameyle birebir eşleşir
 * (JSON'da camelCase). Migration yerine geriye-uyumlu şema evrimi kullanılır:
 * eski `{text, href, isActive}` öğeleri `custom_link` gibi çözümlenir.
 */

/** Menü öğesi türleri (şartname 4. bölüm). */
export type MenuItemType =
  | "page" // CMS/kurumsal sayfası — referenceId = slug
  | "bungalow" // bungalovs.json kaydı — referenceId = id
  | "bungalow_category" // kategori taksonomisi (bu projede veri yok → dinamik listeye yönlendirilir)
  | "system_route" // uygulama route'u — routeName
  | "custom_link" // serbest URL
  | "heading" // tıklanamayan başlık
  | "dynamic_bungalow_list" // otomatik bungalov listesi

export const MENU_ITEM_TYPES: MenuItemType[] = [
  "page",
  "bungalow",
  "bungalow_category",
  "system_route",
  "custom_link",
  "heading",
  "dynamic_bungalow_list",
]

export const MENU_ITEM_TYPE_LABELS: Record<MenuItemType, string> = {
  page: "Sayfa",
  bungalow: "Bungalov",
  bungalow_category: "Bungalov Kategorisi",
  system_route: "Sistem Sayfası",
  custom_link: "Özel Bağlantı",
  heading: "Başlık (bağlantısız)",
  dynamic_bungalow_list: "Dinamik Bungalov Listesi",
}

export type MenuDisplayStyle = "link" | "primary_button" | "secondary_button" | "highlight"

export const MENU_DISPLAY_STYLE_LABELS: Record<MenuDisplayStyle, string> = {
  link: "Normal bağlantı",
  primary_button: "Birincil buton",
  secondary_button: "İkincil buton",
  highlight: "Vurgulu bağlantı",
}

export type MenuGroupStatus = "draft" | "published" | "passive" | "archived"

export const MENU_GROUP_STATUS_LABELS: Record<MenuGroupStatus, string> = {
  draft: "Taslak",
  published: "Yayında",
  passive: "Pasif",
  archived: "Arşivlenmiş",
}

/** Dinamik bungalov listesi ayarları (dynamic_settings JSON alanı). */
export type DynamicListSettings = {
  source: "all_active" | "all_published" | "featured" | "newest"
  limit: number
  sort: "manual" | "name" | "price" | "created"
}

/** Menü derinliği en fazla 3 seviye (şartname 6. bölüm). */
export const MAX_MENU_DEPTH = 3

/**
 * Ham (kaydedilmiş) menü öğesi. Tüm alanlar opsiyoneldir; eski kayıtlarla
 * geriye uyumludur. `children` ile alt menü (hiyerarşi) desteklenir.
 */
export type RawMenuItem = {
  id: string
  itemType?: MenuItemType
  referenceId?: string | null
  routeName?: string | null
  title?: string
  text?: string // eski alan
  url?: string
  href?: string // eski alan
  target?: "SELF" | "BLANK"
  nofollow?: boolean
  icon?: string
  description?: string
  cssClass?: string
  isActive?: boolean
  showOnDesktop?: boolean
  showOnMobile?: boolean
  showForGuests?: boolean
  showForAuthenticated?: boolean
  isHighlighted?: boolean
  displayStyle?: MenuDisplayStyle
  dynamicSettings?: DynamicListSettings | null
  children?: RawMenuItem[]
}

export type RawMenuGroup = {
  id: string
  key?: string
  title: string
  type?: string
  location?: string
  description?: string
  status?: MenuGroupStatus
  isActive?: boolean
  items?: RawMenuItem[]
  createdBy?: string
  updatedBy?: string
  createdAt?: string
  updatedAt?: string
  publishedAt?: string | null
}

/** Frontend'e sunulan, çözümlenmiş menü öğesi. */
export type ResolvedMenuItem = {
  id: string
  label: string
  href: string
  target: "SELF" | "BLANK"
  external: boolean
  nofollow: boolean
  icon?: string
  description?: string
  cssClass?: string
  displayStyle: MenuDisplayStyle
  isHeading: boolean
  children: ResolvedMenuItem[]
}

/** Görünürlük bağlamı (misafir / giriş yapmış). */
export type MenuAudience = "guest" | "authenticated"

/** Cihaz bağlamı. */
export type MenuDevice = "desktop" | "mobile"
