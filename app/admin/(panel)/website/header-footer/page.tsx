import { readJson } from "@/lib/cms/store"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import {
  HeaderFooterEditor,
  type HeaderFooterData,
  type GroupRef,
  type FooterColumn,
  type MenuGroupType,
} from "@/components/admin/website/header-footer-editor"

export const dynamic = "force-dynamic"

const TYPES = ["ANA_MENU", "HIZLI_ERISIM", "BUNGALOVLAR", "SOZLESMELER", "OZEL_MENU"]
const normType = (v: unknown): MenuGroupType => {
  const s = String(v ?? "OZEL_MENU")
  return (TYPES.includes(s) ? s : "OZEL_MENU") as MenuGroupType
}

const btn = (b: any, fallback: { label: string; url: string }) => ({
  enabled: b?.enabled !== false,
  label: String(b?.label ?? fallback.label),
  url: String(b?.url ?? fallback.url),
})

export default async function HeaderFooterAdminPage() {
  const cfg = await readJson<any>("cms-config.json")
  const hm = cfg?.headerManagement ?? {}
  const fm = cfg?.siteManagement?.footerManagement ?? {}
  const rawGroups = cfg?.siteManagement?.menuGroups

  const groups: GroupRef[] = Array.isArray(rawGroups)
    ? rawGroups.map((g: any) => ({ id: String(g?.id ?? ""), title: String(g?.title ?? "Menü"), type: normType(g?.type) }))
    : []

  const footerColumns: FooterColumn[] = Array.isArray(fm?.columns)
    ? fm.columns.map((c: any) => ({
        id: String(c?.id ?? `col-${Math.random().toString(36).slice(2, 8)}`),
        title: String(c?.title ?? ""),
        type: String(c?.type ?? "MENU_GROUP"),
        menuGroupId: String(c?.menuGroupId ?? ""),
        enabled: c?.enabled !== false,
      }))
    : []

  const initial: HeaderFooterData = {
    topHeaderEnabled: hm?.topHeaderEnabled !== false,
    topHeaderText: String(hm?.topHeaderText ?? ""),
    topHeaderPhone: String(hm?.topHeaderPhone ?? ""),
    buttons: {
      whatsapp: btn(hm?.buttons?.whatsapp, { label: "WhatsApp", url: "" }),
      phone: btn(hm?.buttons?.phone, { label: "Hemen Ara", url: "" }),
      reservation: btn(hm?.buttons?.reservation, { label: "Online Rezervasyon", url: "/bungalovlarimiz" }),
    },
    headerMenuGroupId: String(hm?.menuGroupId ?? ""),
    footerEnabled: fm?.enabled !== false,
    copyrightText: String(fm?.copyrightText ?? ""),
    footerColumns,
  }

  return (
    <>
      <AdminPageHeader title="Header & Footer" description="Header ve footer'a menü grubu atayın, üst çubuk ve aksiyon butonlarını yönetin." />
      <HeaderFooterEditor initial={initial} groups={groups} />
    </>
  )
}
