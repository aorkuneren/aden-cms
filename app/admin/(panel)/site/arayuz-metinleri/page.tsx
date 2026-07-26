import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { UiStringsEditor, type UiStringEntry } from "@/components/admin/cms/ui-strings-editor"
import { getUiStrings } from "@/lib/cms/ui-strings"

export const dynamic = "force-dynamic"

export default async function UiStringsAdminPage() {
  const strings = await getUiStrings()
  const initial: UiStringEntry[] = Object.entries(strings)
    .sort(([a], [b]) => a.localeCompare(b, "tr"))
    .map(([key, value]) => ({ key, value }))

  return (
    <>
      <AdminPageHeader
        title="Arayüz Metinleri"
        description="Buton etiketleri, boş durumlar, 404 ve bakım modu gibi site geneli mikro-metinler."
      />
      <UiStringsEditor initial={initial} />
    </>
  )
}
