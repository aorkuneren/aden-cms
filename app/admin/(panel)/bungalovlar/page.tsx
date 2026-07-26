import Link from "next/link"
import { Plus } from "lucide-react"

import { readJson } from "@/lib/cms/store"
import { filterActive } from "@/lib/cms/soft-delete"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Button } from "@/components/ui/button"
import { BungalovList, type BungalovListItem } from "@/components/admin/bungalov/bungalov-list"

export const dynamic = "force-dynamic"

export default async function BungalovlarAdminPage() {
  const list = await readJson<any[]>("bungalovs.json").catch(() => [])
  const items: BungalovListItem[] = filterActive(Array.isArray(list) ? list : []).map((b) => ({
    id: String(b?.id ?? ""),
    name: String(b?.name ?? "İsimsiz"),
    image: String(b?.image ?? ""),
    nightlyPrice: Number(b?.nightlyPrice ?? 0) || 0,
    capacity: Number(b?.capacity ?? 0) || 0,
    status: String(b?.status ?? "AKTIF"),
    isFeatured: Boolean(b?.isFeatured),
  }))

  return (
    <>
      <AdminPageHeader
        title="Bungalovlar"
        description="Bungalov kataloğunu yönetin: ekleyin, düzenleyin, kaldırın."
        action={
          <Button asChild>
            <Link href="/admin/bungalovlar/yeni">
              <Plus /> Yeni bungalov
            </Link>
          </Button>
        }
      />
      <BungalovList items={items} />
    </>
  )
}
