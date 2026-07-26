import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { isUserSystemEnabled } from "@/lib/site/modules"
import { UserSystemSwitch } from "./user-system-switch"

export const dynamic = "force-dynamic"

export default async function ModulesPage() {
  const userSystemEnabled = await isUserSystemEnabled()

  return (
    <>
      <AdminPageHeader title="Modüller" description="Site modüllerini buradan açıp kapatın." />
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Kullanıcı Sistemi</h2>
            <p className="mt-1 text-sm text-slate-600">
              Üyelik, giriş ve hesabım sayfalarını açar/kapatır.
            </p>
          </div>
          <UserSystemSwitch initialEnabled={userSystemEnabled} />
        </div>
      </section>
    </>
  )
}
