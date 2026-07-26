import { getAdminUsers, requireAdmin } from "@/lib/admin/auth"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { UserManager } from "@/components/admin/users/user-manager"

export const dynamic = "force-dynamic"

export default async function UserManagementAdminPage() {
  const currentAdmin = await requireAdmin()
  const users = await getAdminUsers()
  const safeUsers = users.map(({ passwordHash, ...rest }) => rest)

  return (
    <>
      <AdminPageHeader
        title="Kullanıcı ve Rol Yönetimi"
        description="CMS paneline erişim yetkisi olan yöneticileri, rollerini ve durumlarını yönetin."
      />
      <UserManager users={safeUsers} currentUserId={currentAdmin.id} />
    </>
  )
}
