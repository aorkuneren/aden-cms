/**
 * Menü resolver — kaydedilmiş menü gruplarını, frontend'in kullanacağı
 * çözümlenmiş (canlı URL'li, hiyerarşik, filtrelenmiş) yapıya dönüştürür.
 *
 * Sorumluluklar (şartname 10, 13, 19):
 *  - Öğeleri kararlı ID/route üzerinden CANLI URL'e çözer (slug değişse bile).
 *  - Silinmiş/pasif/bozuk içerikleri frontend'de GÖSTERMEZ.
 *  - Görünürlük (misafir/üye, masaüstü/mobil) uygular.
 *  - Dinamik bungalov listelerini çalıştırır.
 *  - Derinliği MAX_MENU_DEPTH ile sınırlar.
 *  - Güvensiz (javascript: vb.) URL'leri engeller.
 *  - Bungalovları tek seferde yükleyip N+1 sorgusunu önler; React cache ile
 *    istek başına tekrar okuma yapılmaz.
 */
import { cache } from "react"

import { readJson } from "@/lib/cms/store"
import {
  MAX_MENU_DEPTH,
  type MenuAudience,
  type MenuDevice,
  type MenuDisplayStyle,
  type RawMenuGroup,
  type RawMenuItem,
  type ResolvedMenuItem,
} from "@/lib/site/menu-model"
import {
  getPageEntry,
  getSystemRoute,
  listBungalows,
  resolveDynamicBungalows,
  type MenuSourceEntry,
} from "@/lib/site/menu-sources"

/** Güvenli bağlantı kontrolü — yalnızca izinli protokoller/şemalar. */
export function isSafeHref(href: string): boolean {
  const v = (href || "").trim()
  if (!v) return false
  if (v.startsWith("/") || v.startsWith("#")) return true
  if (/^(https?:|mailto:|tel:)/i.test(v)) return true
  // javascript:, data:, vbscript: vb. engellenir
  return false
}

type Ctx = {
  audience: MenuAudience
  device: MenuDevice
  bungalowMap: Map<string, MenuSourceEntry>
  bungalows: MenuSourceEntry[]
}

function visible(item: RawMenuItem, ctx: Ctx): boolean {
  if (item.isActive === false) return false
  if (ctx.device === "mobile" && item.showOnMobile === false) return false
  if (ctx.device === "desktop" && item.showOnDesktop === false) return false
  if (ctx.audience === "guest" && item.showForGuests === false) return false
  if (ctx.audience === "authenticated" && item.showForAuthenticated === false) return false
  return true
}

const legacyText = (i: RawMenuItem) => (i.title ?? i.text ?? "").trim()
const legacyHref = (i: RawMenuItem) => (i.url ?? i.href ?? "").trim()

/** Tek bir öğeyi çözer; gösterilemez/bozuksa null döner. */
function resolveItem(item: RawMenuItem, depth: number, ctx: Ctx): ResolvedMenuItem | null {
  if (!visible(item, ctx)) return null

  const type = item.itemType ?? "custom_link"
  const base = {
    id: item.id,
    target: item.target === "BLANK" ? ("BLANK" as const) : ("SELF" as const),
    nofollow: Boolean(item.nofollow),
    icon: item.icon || undefined,
    description: item.description || undefined,
    cssClass: item.cssClass || undefined,
    displayStyle: (item.displayStyle ?? (item.isHighlighted ? "highlight" : "link")) as MenuDisplayStyle,
  }

  const kids = resolveChildren(item.children, depth + 1, ctx)

  // Başlık (tıklanamaz)
  if (type === "heading") {
    const label = legacyText(item)
    if (!label) return null
    return { ...base, label, href: "#", external: false, isHeading: true, children: kids }
  }

  // Dinamik bungalov listesi → çocuklar olarak açılır
  if (type === "dynamic_bungalow_list" || type === "bungalow_category") {
    const label = legacyText(item) || "Bungalovlar"
    // dynamicSettings resolver seviyesinde önceden genişletilir (aşağıda)
    const dyn = (item as any).__resolvedChildren as ResolvedMenuItem[] | undefined
    const children = dyn ?? kids
    if (children.length === 0 && !legacyText(item)) return null
    return { ...base, label, href: "#", external: false, isHeading: true, children }
  }

  // URL çözümü (ID/route tabanlı → canlı)
  let href = ""
  let label = legacyText(item)

  if (type === "page") {
    const entry = getPageEntry(item.referenceId)
    if (!entry) return null // bozuk: sayfa yok
    href = entry.href
    if (!label) label = entry.title
  } else if (type === "bungalow") {
    const entry = ctx.bungalowMap.get(String(item.referenceId ?? ""))
    if (!entry) return null // bozuk: bungalov silinmiş/yok
    if (entry.status === "PASIF") return null // yayında değil
    href = entry.href
    if (!label) label = entry.title
  } else if (type === "system_route") {
    const route = getSystemRoute(item.routeName)
    if (!route) return null // bozuk: route yok
    href = route.href
    if (!label) label = route.label
  } else {
    // custom_link
    href = legacyHref(item)
    if (!isSafeHref(href)) return null
  }

  if (!label || !href) return null

  return {
    ...base,
    label,
    href,
    external: /^https?:/i.test(href) && !href.includes("adenbungalov.com"),
    isHeading: false,
    children: kids,
  }
}

function resolveChildren(items: RawMenuItem[] | undefined, depth: number, ctx: Ctx): ResolvedMenuItem[] {
  if (!Array.isArray(items) || depth >= MAX_MENU_DEPTH) return []
  const out: ResolvedMenuItem[] = []
  for (const it of items) {
    const r = resolveItem(it, depth, ctx)
    if (r) out.push(r)
  }
  return out
}

/** Dinamik liste öğelerini, çözümden ÖNCE, canlı bungalov çocuklarıyla doldurur. */
function expandDynamic(items: RawMenuItem[], ctx: Ctx): RawMenuItem[] {
  return items.map((item) => {
    const next: any = { ...item }
    if ((item.itemType === "dynamic_bungalow_list" || item.itemType === "bungalow_category") && item.dynamicSettings) {
      // menu-sources.resolveDynamicBungalows senkron değil; ancak listeyi ctx'te
      // önceden yüklediğimiz için burada senkron filtreleyebiliriz.
      let list = [...ctx.bungalows]
      const s = item.dynamicSettings
      if (s.source === "featured") list = list.filter((b) => Boolean(b.meta?.isFeatured))
      else if (s.source !== "newest") list = list.filter((b) => b.status !== "PASIF")
      if (s.sort === "name") list.sort((a, b) => a.title.localeCompare(b.title, "tr"))
      else if (s.sort === "price") list.sort((a, b) => Number(a.meta?.nightlyPrice ?? 0) - Number(b.meta?.nightlyPrice ?? 0))
      else if (s.sort === "created" || s.source === "newest")
        list.sort((a, b) => String(b.meta?.createdAt ?? "").localeCompare(String(a.meta?.createdAt ?? "")))
      const limit = Number(s.limit) > 0 ? Number(s.limit) : 6
      next.__resolvedChildren = list.slice(0, limit).map((b) => ({
        id: `dyn-${item.id}-${b.referenceId}`,
        label: b.title,
        href: b.href,
        target: "SELF" as const,
        external: false,
        nofollow: false,
        displayStyle: "link" as MenuDisplayStyle,
        isHeading: false,
        children: [] as ResolvedMenuItem[],
      }))
    }
    if (Array.isArray(item.children)) next.children = expandDynamic(item.children, ctx)
    return next
  })
}

async function buildContext(audience: MenuAudience, device: MenuDevice): Promise<Ctx> {
  const bungalows = await listBungalows()
  const bungalowMap = new Map(bungalows.map((b) => [b.referenceId, b]))
  return { audience, device, bungalowMap, bungalows }
}

/** Ham menü gruplarını cms-config'ten okur (istek başına cache). */
export const getRawMenuGroups = cache(async (): Promise<RawMenuGroup[]> => {
  const cfg = await readJson<any>("cms-config.json").catch(() => ({}))
  const groups = cfg?.siteManagement?.menuGroups
  return Array.isArray(groups) ? groups : []
})

export type MenuSelector = { key?: string; groupId?: string; type?: string }

function pickGroup(groups: RawMenuGroup[], sel: MenuSelector): RawMenuGroup | null {
  const active = groups.filter((g) => g.isActive !== false && g.status !== "archived" && g.status !== "passive")
  return (
    (sel.groupId && active.find((g) => g.id === sel.groupId)) ||
    (sel.key && active.find((g) => g.key === sel.key)) ||
    (sel.type && active.find((g) => g.type === sel.type)) ||
    null
  )
}

export type ResolveOpts = { audience?: MenuAudience; device?: MenuDevice }

/** Bir menü grubunu seçer ve çözümlenmiş öğe ağacını döner. */
export async function resolveMenu(sel: MenuSelector, opts: ResolveOpts = {}): Promise<ResolvedMenuItem[]> {
  const groups = await getRawMenuGroups()
  const group = pickGroup(groups, sel)
  if (!group) return []
  const ctx = await buildContext(opts.audience ?? "guest", opts.device ?? "desktop")
  const expanded = expandDynamic(group.items ?? [], ctx)
  return resolveChildren(expanded, 0, ctx)
}

/** Admin için: bir gruptaki bozuk/uyarılı öğeleri raporlar. */
export type MenuIssue = { itemId: string; title: string; reason: string }

export async function auditMenuGroup(group: RawMenuGroup): Promise<MenuIssue[]> {
  const bungalows = await listBungalows()
  const bungalowMap = new Map(bungalows.map((b) => [b.referenceId, b]))
  const issues: MenuIssue[] = []

  const walk = (items: RawMenuItem[] = []) => {
    for (const it of items) {
      const title = legacyText(it) || "(başlıksız)"
      const type = it.itemType ?? "custom_link"
      if (type === "page" && !getPageEntry(it.referenceId)) issues.push({ itemId: it.id, title, reason: "Bağlı sayfa bulunamadı." })
      else if (type === "bungalow") {
        const b = bungalowMap.get(String(it.referenceId ?? ""))
        if (!b) issues.push({ itemId: it.id, title, reason: "Bungalov silinmiş veya bulunamadı." })
        else if (b.status === "PASIF") issues.push({ itemId: it.id, title, reason: "Bungalov yayında değil (pasif)." })
      } else if (type === "system_route" && !getSystemRoute(it.routeName))
        issues.push({ itemId: it.id, title, reason: "Sistem route'u artık mevcut değil." })
      else if (type === "custom_link" && !isSafeHref(legacyHref(it)))
        issues.push({ itemId: it.id, title, reason: "Bağlantı boş veya güvensiz." })
      if (Array.isArray(it.children)) walk(it.children)
    }
  }
  walk(group.items ?? [])
  return issues
}

// resolveDynamicBungalows re-export (bazı çağrılar için)
export { resolveDynamicBungalows }
