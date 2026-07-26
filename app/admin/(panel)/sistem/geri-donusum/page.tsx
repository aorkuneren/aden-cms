import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { TrashPanel, type TrashItem } from "@/components/admin/cms/trash-panel"
import { getCurrentAdmin } from "@/lib/admin/auth"
import { readJson } from "@/lib/cms/store"
import { filterDeleted } from "@/lib/cms/soft-delete"

export const dynamic = "force-dynamic"

function toTrashItems(
  entityType: TrashItem["entityType"],
  records: unknown,
  titleFor: (record: any) => string,
  previewFor?: (record: any) => string | null
): TrashItem[] {
  if (!Array.isArray(records)) return []

  return filterDeleted(records).flatMap((record: any) => {
    if (!record?.id || !record.deletedAt) return []
    return [
      {
        entityType,
        id: String(record.id),
        title: titleFor(record).trim() || "Başlıksız kayıt",
        deletedAt: String(record.deletedAt),
        deletedBy: record.deletedBy ? String(record.deletedBy) : null,
        previewUrl: previewFor ? previewFor(record) : null,
      },
    ]
  })
}

export default async function TrashPage() {
  const [config, bungalows, admin] = await Promise.all([
    readJson<any>("cms-config.json").catch(() => ({})),
    readJson<any[]>("bungalovs.json").catch(() => []),
    getCurrentAdmin(),
  ])

  const items = [
    ...toTrashItems("cms_slider", config.sliderManagement, (item) => item.title, (item) => item.imageUrl || null),
    ...toTrashItems("cms_faq", config.faqManagement, (item) => item.question),
    ...toTrashItems("cms_why_aden", config.whyAdenManagement, (item) => item.title, (item) => item.imageUrl || null),
    ...toTrashItems("cms_gallery", config.galleryManagement?.items, (item) => item.title, (item) => item.imageUrl || null),
    ...toTrashItems("bungalow", bungalows, (item) => item.name, (item) => item.image || item.galleryImages?.[0] || null),
  ].sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime())

  return (
    <>
      <AdminPageHeader
        title="Geri Dönüşüm"
        description="Silinen içerikleri geri yükleyin veya süper yönetici olarak kalıcı biçimde silin."
      />
      <TrashPanel initialItems={items} canPurge={admin?.role === "SUPERADMIN"} />
    </>
  )
}
