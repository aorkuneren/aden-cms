/**
 * Menü kaynakları — menüye eklenebilecek içeriklerin (sayfa, bungalov, sistem
 * route'u) TEK GERÇEK KAYNAĞI. Hem admin seçici (picker) hem de resolver bu
 * kayıt defterinden beslenir. Böylece bağlantılar URL metnine değil, kararlı
 * ID/route değerlerine bağlanır (şartname kritik iş kuralı #1-3).
 */
import { readJson } from "@/lib/cms/store"
import { filterActive } from "@/lib/cms/soft-delete"
import { CORPORATE_PAGES } from "@/lib/site/b2c"

export type MenuSourceEntry = {
  referenceId: string
  title: string
  href: string
  status?: string
  meta?: Record<string, unknown>
}

/** Uygulamada tanımlı sistem route'ları (sabit URL yazımından kaçınmak için). */
export const SYSTEM_ROUTES: { key: string; label: string; href: string }[] = [
  { key: "home", label: "Ana Sayfa", href: "/" },
  { key: "bungalows", label: "Tüm Bungalovlar", href: "/bungalovlarimiz" },
  { key: "gallery", label: "Galeri", href: "/galeri" },
  { key: "corporate", label: "Kurumsal", href: "/kurumsal" },
  { key: "contact", label: "İletişim", href: "/iletisim" },
  { key: "reservation", label: "Rezervasyon", href: "/bungalovlarimiz" },
  { key: "login", label: "Giriş Yap", href: "/giris" },
  { key: "account", label: "Hesabım", href: "/hesabim" },
]

const SYSTEM_ROUTE_MAP = new Map(SYSTEM_ROUTES.map((r) => [r.key, r]))

export function getSystemRoute(routeName: string | null | undefined) {
  return routeName ? SYSTEM_ROUTE_MAP.get(routeName) ?? null : null
}

/** CMS/kurumsal sayfaları — referenceId = slug (kararlı). */
export function listPages(): MenuSourceEntry[] {
  return CORPORATE_PAGES.map((p) => ({
    referenceId: p.slug,
    title: p.title,
    href: `/kurumsal/${p.slug}`,
    status: "published",
  }))
}

const PAGE_MAP = new Map(listPages().map((p) => [p.referenceId, p]))

export function getPageEntry(slug: string | null | undefined): MenuSourceEntry | null {
  return slug ? PAGE_MAP.get(slug) ?? null : null
}

/** Bungalov kaydı → /bungalovlarimiz/{slug}. */
function bungalowHref(slugOrId: string) {
  return `/bungalovlarimiz/${slugOrId}`
}

/** Sistemdeki bungalovları listeler (admin seçici + resolver için). */
export async function listBungalows(): Promise<MenuSourceEntry[]> {
  const rows = await readJson<any[]>("bungalovs.json").catch(() => [])
  return filterActive(Array.isArray(rows) ? rows : []).map((b) => ({
    referenceId: String(b?.id ?? ""),
    title: String(b?.name ?? "İsimsiz Bungalov"),
    href: bungalowHref(String(b?.slug || b?.id || "")),
    status: String(b?.status ?? "AKTIF"),
    meta: {
      image: String(b?.image ?? ""),
      nightlyPrice: Number(b?.nightlyPrice ?? 0) || 0,
      isFeatured: Boolean(b?.isFeatured),
      createdAt: String(b?.createdAt ?? ""),
      capacity: Number(b?.capacity ?? 0) || 0,
    },
  }))
}

export async function getBungalowEntry(id: string | null | undefined): Promise<MenuSourceEntry | null> {
  if (!id) return null
  const all = await listBungalows()
  return all.find((b) => b.referenceId === id) ?? null
}

/**
 * Dinamik bungalov listesini kriterlere göre çözümler.
 * Bu projede ayrı kategori taksonomisi olmadığından "kategori" filtresi
 * dinamik liste üzerinden (öne çıkan / en yeni / tümü) sağlanır.
 */
export async function resolveDynamicBungalows(settings: {
  source: string
  limit: number
  sort: string
}): Promise<MenuSourceEntry[]> {
  let list = await listBungalows()

  // Kaynak filtresi
  if (settings.source === "featured") list = list.filter((b) => Boolean(b.meta?.isFeatured))
  else if (settings.source === "all_published" || settings.source === "all_active")
    list = list.filter((b) => b.status !== "PASIF")
  // "newest" tüm kayıtları alır, sonra tarihe göre sıralanır

  // Sıralama
  if (settings.sort === "name") list.sort((a, b) => a.title.localeCompare(b.title, "tr"))
  else if (settings.sort === "price")
    list.sort((a, b) => Number(a.meta?.nightlyPrice ?? 0) - Number(b.meta?.nightlyPrice ?? 0))
  else if (settings.sort === "created" || settings.source === "newest")
    list.sort((a, b) => String(b.meta?.createdAt ?? "").localeCompare(String(a.meta?.createdAt ?? "")))

  const limit = Number(settings.limit) > 0 ? Number(settings.limit) : 6
  return list.slice(0, limit)
}
