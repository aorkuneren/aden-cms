"use client"

import { useState } from "react"
import { Search, ShieldCheck, Calendar, Filter, Eye, Activity } from "lucide-react"

import { type AuditLogEntry } from "@/lib/audit"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

export function AuditLogViewer({ logs }: { logs: AuditLogEntry[] }) {
  const [search, setSearch] = useState("")
  const [filterEntity, setFilterEntity] = useState<string>("ALL")
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)

  const entityTypes = Array.from(new Set(logs.map((l) => l.entityType).filter(Boolean)))

  const filtered = logs.filter((log) => {
    const query = search.toLowerCase()
    const matchesSearch =
      log.action.toLowerCase().includes(query) ||
      log.actorName.toLowerCase().includes(query) ||
      log.entityType.toLowerCase().includes(query)

    if (!matchesSearch) return false
    if (filterEntity !== "ALL" && log.entityType !== filterEntity) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Arama ve Filtrele */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İşlem adı, kullanıcı veya modül ara..."
            className="pl-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Modül:</span>
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-slate-300"
          >
            <option value="ALL">Tüm Modüller</option>
            {entityTypes.map((et) => (
              <option key={et} value={et}>
                {et.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kayıtlar Tablosu */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              <Activity className="mx-auto size-8 text-slate-400" />
              <p className="mt-2 font-medium">Arama kriterlerine uygun aktivite kaydı bulunamadı.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Zaman</th>
                    <th className="px-4 py-3">Kullanıcı</th>
                    <th className="px-4 py-3">İşlem / Eylem</th>
                    <th className="px-4 py-3">Modül</th>
                    <th className="px-4 py-3 text-right">Detay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                  {filtered.map((log) => (
                    <tr key={log.id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-neutral-900/50">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {new Date(log.createdAt).toLocaleString("tr-TR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 dark:bg-neutral-800 dark:text-slate-300">
                            {log.actorName ? log.actorName.charAt(0).toUpperCase() : "S"}
                          </span>
                          <span className="font-medium text-slate-900 dark:text-white">{log.actorName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{log.action}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="uppercase text-[10px]">
                          {log.entityType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {log.details ? (
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedLog(log)}>
                            <Eye className="mr-1 size-3" /> İncele
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detay İnceleme Modalı */}
      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Aktivite Log Detayı</DialogTitle>
          </DialogHeader>
          {selectedLog ? (
            <div className="space-y-3 py-2 text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-slate-500">İşlem ID:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedLog.id}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-slate-500">Zaman:</span>
                <span>{new Date(selectedLog.createdAt).toLocaleString("tr-TR")}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-slate-500">Kullanıcı:</span>
                <span>{selectedLog.actorName} ({selectedLog.actorUserId})</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-slate-500">Eylem:</span>
                <span className="font-semibold text-emerald-600">{selectedLog.action}</span>
              </div>

              {selectedLog.details ? (
                <div>
                  <span className="font-semibold text-slate-500">Detay Verileri (JSON):</span>
                  <pre className="mt-1 max-h-48 overflow-auto rounded bg-slate-900 p-3 font-mono text-[11px] text-emerald-400">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button onClick={() => setSelectedLog(null)}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
