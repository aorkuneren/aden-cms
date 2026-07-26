"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { RotateCcw, Trash2 } from "lucide-react"

import { purgeTrashItemAction, restoreTrashItemAction, type TrashEntityType } from "@/app/admin/(panel)/sistem/geri-donusum/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type TrashItem = {
  entityType: TrashEntityType
  id: string
  title: string
  deletedAt: string
  deletedBy: string | null
  previewUrl?: string | null
}

const ENTITY_LABELS: Record<TrashEntityType, string> = {
  cms_slider: "Slider",
  cms_faq: "SSS",
  cms_why_aden: "Neden Aden",
  cms_gallery: "Galeri",
  bungalow: "Bungalov",
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

export function TrashPanel({ initialItems, canPurge }: { initialItems: TrashItem[]; canPurge: boolean }) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<string | null>(null)
  const [purgeCandidate, setPurgeCandidate] = useState<TrashItem | null>(null)

  const restore = (item: TrashItem) => {
    startTransition(async () => {
      const result = await restoreTrashItemAction(item.entityType, item.id)
      if (!result.ok) {
        setStatus(result.error)
        return
      }
      setItems((current) => current.filter((currentItem) => !(currentItem.entityType === item.entityType && currentItem.id === item.id)))
      setStatus(`“${item.title}” geri yüklendi.`)
      router.refresh()
    })
  }

  const purge = () => {
    if (!purgeCandidate) return
    startTransition(async () => {
      const result = await purgeTrashItemAction(purgeCandidate.entityType, purgeCandidate.id)
      if (!result.ok) {
        setStatus(result.error)
        return
      }
      setItems((current) =>
        current.filter(
          (currentItem) => !(currentItem.entityType === purgeCandidate.entityType && currentItem.id === purgeCandidate.id)
        )
      )
      setStatus(`“${purgeCandidate.title}” kalıcı olarak silindi.`)
      setPurgeCandidate(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {status ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-slate-300">
          {status}
        </p>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-neutral-700">
          <Trash2 className="mx-auto mb-3 size-8 text-slate-400" />
          <h2 className="font-semibold text-slate-900 dark:text-white">Geri dönüşüm kutusu boş</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Silinen kayıtlar burada listelenecek.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-neutral-800">
          <div className="divide-y divide-slate-200 dark:divide-neutral-800">
            {items.map((item) => (
              <div key={`${item.entityType}-${item.id}`} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                {item.previewUrl ? (
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-neutral-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.previewUrl} alt="" className="size-full object-cover" />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-medium text-slate-900 dark:text-white">{item.title}</h2>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-neutral-800 dark:text-slate-300">
                      {ENTITY_LABELS[item.entityType]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Silinme: {formatDate(item.deletedAt)}
                    {item.deletedBy ? ` · Kullanıcı: ${item.deletedBy}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => restore(item)}>
                    <RotateCcw /> Geri Yükle
                  </Button>
                  {canPurge ? (
                    <Button size="sm" variant="destructive" disabled={pending} onClick={() => setPurgeCandidate(item)}>
                      <Trash2 /> Kalıcı Sil
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={Boolean(purgeCandidate)} onOpenChange={(open) => !open && setPurgeCandidate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kaydı kalıcı olarak sil?</DialogTitle>
            <DialogDescription>
              Bu işlem geri alınamaz. “{purgeCandidate?.title}” kaydı geri dönüşüm kutusundan tamamen kaldırılacak.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={pending} onClick={() => setPurgeCandidate(null)}>
              Vazgeç
            </Button>
            <Button variant="destructive" disabled={pending} onClick={purge}>
              Kalıcı Olarak Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
