import { readJson } from "@/lib/cms/store"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { SocialEditor, type SocialProfile } from "@/components/admin/website/social-editor"

export const dynamic = "force-dynamic"

export default async function SocialAdminPage() {
  const cfg = await readJson<any>("cms-config.json")
  const raw = cfg?.siteManagement?.socialProfiles
  const initial: SocialProfile[] = Array.isArray(raw)
    ? raw.map((it: any) => ({
        id: String(it?.id ?? `social-${Math.random().toString(36).slice(2, 8)}`),
        platform: String(it?.platform ?? ""),
        icon: String(it?.icon ?? ""),
        url: String(it?.url ?? ""),
      }))
    : []

  return (
    <>
      <AdminPageHeader title="Sosyal Medya" description="Header ve footer'da görünen sosyal medya bağlantıları." />
      <SocialEditor initial={initial} />
    </>
  )
}
