import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { InquiryInbox } from "@/components/admin/inquiries/inquiry-inbox"
import { adminCan } from "@/lib/admin/permissions"
import { getCurrentAdmin } from "@/lib/admin/auth"
import { listInquiries } from "@/lib/site/inquiries"

export const dynamic = "force-dynamic"

export default async function InquiriesAdminPage() {
  const [items, admin] = await Promise.all([listInquiries(), getCurrentAdmin()])
  const unread = items.filter((item) => !item.isRead).length

  return (
    <>
      <AdminPageHeader
        title="İletişim Mesajları"
        description={
          items.length === 0
            ? "İletişim formundan gelen mesajlar burada toplanır."
            : `Toplam ${items.length} mesaj · ${unread} okunmamış.`
        }
      />
      <InquiryInbox
        initialItems={items}
        canManage={adminCan(admin, "update")}
        canDelete={adminCan(admin, "delete")}
      />
    </>
  )
}
