/**
 * Admin panel navigasyon ağacı — hem masaüstü sidebar hem mobil menü buradan
 * beslenir. Yeni editör eklerken sadece burayı güncellemeniz yeterli.
 */
export type AdminNavItem = {
  label: string
  icon: string
  href?: string
  children?: AdminNavItem[]
}

export type AdminNavGroup = {
  title: string
  items: AdminNavItem[]
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: "Genel",
    items: [{ label: "Panel", href: "/admin", icon: "LayoutDashboard" }],
  },
  {
    title: "Sayfalar",
    items: [
      {
        label: "Anasayfa Yönetimi",
        icon: "House",
        children: [
          { label: "Hero / Slider", href: "/admin/website/slider", icon: "GalleryHorizontal" },
          { label: "Hakkımızda Alanı", href: "/admin/website/hakkimizda", icon: "Info" },
          { label: "Bungalovlar Alanı", href: "/admin/website/bungalovlar", icon: "House" },
          { label: "Neden Biz", href: "/admin/website/neden-aden", icon: "Sparkles" },
          { label: "Galeri Alanı", href: "/admin/sayfalar/ana-sayfa/gallery", icon: "Images" },
          { label: "CTA", href: "/admin/sayfalar/ana-sayfa/cta", icon: "MousePointerClick" },
          { label: "SSS", href: "/admin/website/sss", icon: "MessageCircleQuestionMark" },
        ],
      },
      { label: "Galeri Yönetimi", href: "/admin/website/galeri", icon: "Images" },
      {
        label: "Bungalovlarımız Yönetimi",
        href: "/admin/sayfalar/bungalovlarimiz",
        icon: "House",
      },
      { label: "Kurumsal Yönetimi", href: "/admin/sayfalar/kurumsal", icon: "FolderOpen" },
      { label: "İletişim Yönetimi", href: "/admin/sayfalar/iletisim", icon: "MessageSquare" },
    ],
  },
  {
    title: "İletişim",
    items: [{ label: "Gelen Mesajlar", href: "/admin/iletisim/mesajlar", icon: "Inbox" }],
  },
  {
    title: "Katalog",
    items: [{ label: "Bungalovlar", href: "/admin/bungalovlar", icon: "House" }],
  },
  {
    title: "Site Geneli",
    items: [
      { label: "Menüler", href: "/admin/website/menuler", icon: "Menu" },
      { label: "Header & Footer", href: "/admin/website/header-footer", icon: "PanelsTopLeft" },
      { label: "SEO", href: "/admin/website/seo", icon: "Search" },
      { label: "Sosyal Medya", href: "/admin/website/sosyal", icon: "Share2" },
      { label: "Arayüz Metinleri", href: "/admin/site/arayuz-metinleri", icon: "FileText" },
    ],
  },
  {
    title: "Sistem",
    items: [
      { label: "Modüller", href: "/admin/sistem/moduller", icon: "ToggleLeft" },
      { label: "Geri Dönüşüm", href: "/admin/sistem/geri-donusum", icon: "Trash2" },
      { label: "Ayarlar", href: "/admin/ayarlar", icon: "Settings" },
      { label: "Kullanıcılar", href: "/admin/kullanicilar", icon: "Users" },
      { label: "Aktivite", href: "/admin/aktivite", icon: "ShieldCheck" },
    ],
  },
]
