import { getAuditLogs } from "@/lib/audit"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AuditLogViewer } from "@/components/admin/audit/audit-log-viewer"

export const dynamic = "force-dynamic"

export default async function AuditLogsAdminPage() {
  const logs = await getAuditLogs()

  return (
    <>
      <AdminPageHeader
        title="Aktivite ve İşlem Logları"
        description="Sistemdeki tüm yönetici işlemlerini, yapılan güncellemeleri ve denetim izlerini inceleyin."
      />
      <AuditLogViewer logs={logs} />
    </>
  )
}
