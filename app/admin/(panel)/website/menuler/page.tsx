import { readJson } from "@/lib/cms/store"
import { getCurrentAdmin } from "@/lib/admin/auth"
import { adminCan } from "@/lib/admin/permissions"
import { listPages, listBungalows, SYSTEM_ROUTES } from "@/lib/site/menu-sources"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { MenuBuilder, type BuilderGroup, type PickerSources } from "@/components/admin/website/menu-builder"

export const dynamic = "force-dynamic"

const STATUSES = ["draft", "published", "passive", "archived"]

export default async function MenulerAdminPage() {
  const [cfg, admin, bungalows] = await Promise.all([
    readJson<any>("cms-config.json").catch(() => ({})),
    getCurrentAdmin(),
    listBungalows(),
  ])

  const rawGroups = cfg?.siteManagement?.menuGroups
  const groups: BuilderGroup[] = Array.isArray(rawGroups)
    ? rawGroups.map((g: any) => ({
        id: String(g?.id ?? `menu-group-${Math.random().toString(36).slice(2, 8)}`),
        key: g?.key ? String(g.key) : "",
        title: String(g?.title ?? "Menü"),
        location: g?.location ? String(g.location) : "OTHER",
        description: g?.description ? String(g.description) : "",
        status: STATUSES.includes(String(g?.status)) ? g.status : g?.isActive === false ? "passive" : "published",
        isActive: g?.isActive !== false,
        items: Array.isArray(g?.items) ? g.items : [],
        publishedAt: g?.publishedAt ?? null,
      }))
    : []

  const sources: PickerSources = {
    pages: listPages().map((p) => ({ referenceId: p.referenceId, title: p.title, href: p.href, status: p.status ?? "published" })),
    bungalows: bungalows.map((b) => ({
      referenceId: b.referenceId,
      title: b.title,
      href: b.href,
      status: b.status ?? "AKTIF",
      image: String(b.meta?.image ?? ""),
    })),
    systemRoutes: SYSTEM_ROUTES.map((r) => ({ key: r.key, label: r.label, href: r.href })),
  }

  const canPublish = adminCan(admin, "publish")

  return (
    <>
      <AdminPageHeader
        title="Menüler"
        description="Menü grupları oluşturun; sayfa, bungalov, sistem sayfası, özel bağlantı ve dinamik listelerden öğe ekleyin. Header/Footer'a atama 'Header & Footer' bölümünden yapılır."
      />
      <MenuBuilder initialGroups={groups} sources={sources} canPublish={canPublish} />
    </>
  )
}
