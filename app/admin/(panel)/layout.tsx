import { requireAdmin } from "@/lib/admin/auth"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminTopbar } from "@/components/admin/admin-topbar"

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: "Süper Yönetici",
  ADMIN: "Yönetici",
  CONTENT_EDITOR: "İçerik Editörü",
  STAFF: "Personel",
}

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()
  const roleLabel = ROLE_LABELS[admin.role] ?? admin.role

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-neutral-950">
      {/* Masaüstü sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 lg:flex lg:flex-col">
        <AdminSidebar roleLabel={roleLabel} version="v2.0" />
      </aside>

      {/* İçerik */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar adminName={admin.name} roleLabel={roleLabel} version="v2.0" />
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 lg:p-6">
          <div className="mx-auto w-full max-w-6xl space-y-3.5">{children}</div>
        </main>
      </div>
    </div>
  )
}
