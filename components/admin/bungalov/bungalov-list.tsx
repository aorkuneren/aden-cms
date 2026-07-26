"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Pencil,
  Trash2,
  ImageOff,
  Star,
  Search,
  Grid,
  List,
  Plus,
  Users,
  Eye,
} from "lucide-react"

import { deleteBungalovAction } from "@/app/admin/(panel)/bungalovlar/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { SaveStatusBanner, type SaveStatus } from "@/components/admin/save-status"

export type BungalovListItem = {
  id: string
  name: string
  image: string
  nightlyPrice: number
  capacity: number
  status: string
  isFeatured: boolean
}

export function BungalovList({ items: initialItems }: { items: BungalovListItem[] }) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<"ALL" | "AKTIF" | "PASIF">("ALL")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<SaveStatus>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleDelete = (id: string) =>
    startTransition(async () => {
      const res = await deleteBungalovAction(id)
      if (res.ok) {
        setItems((prev) => prev.filter((b) => b.id !== id))
        setStatus({ type: "ok", msg: "Bungalov başarıyla silindi." })
        setDeleteId(null)
        router.refresh()
      } else {
        setStatus({ type: "err", msg: res.error })
      }
    })

  const filtered = items.filter((b) => {
    const query = search.toLowerCase()
    const matchesSearch = b.name.toLowerCase().includes(query)
    if (!matchesSearch) return false

    if (filterStatus === "AKTIF") return b.status !== "PASIF"
    if (filterStatus === "PASIF") return b.status === "PASIF"
    return true
  })

  return (
    <div className="space-y-6">
      <SaveStatusBanner status={status} />

      {/* Arama, Filtre ve Görünüm Seçici Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Bungalov adı ara..."
            className="pl-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Durum filtresi */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-neutral-800 dark:bg-neutral-800">
            <button
              onClick={() => setFilterStatus("ALL")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                filterStatus === "ALL"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-neutral-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              Tümü ({items.length})
            </button>
            <button
              onClick={() => setFilterStatus("AKTIF")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                filterStatus === "AKTIF"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-neutral-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              Aktif
            </button>
            <button
              onClick={() => setFilterStatus("PASIF")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                filterStatus === "PASIF"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-neutral-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              Pasif
            </button>
          </div>

          {/* Görünüm seçici */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-neutral-800 dark:bg-neutral-800">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded p-1.5 transition-colors ${
                viewMode === "grid"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-neutral-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
              title="Izgara Görünümü"
            >
              <Grid className="size-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded p-1.5 transition-colors ${
                viewMode === "list"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-neutral-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
              title="Liste Görünümü"
            >
              <List className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* İçerik */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-500">
            Kriterlere uygun bungalov bulunamadı. “Yeni bungalov” butonu ile ekleyebilirsiniz.
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => (
            <Card key={b.id} className="group relative overflow-hidden transition-all duration-200 hover:border-emerald-500/50 hover:shadow-md">
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-neutral-800">
                {b.image ? (
                  <Image
                    src={b.image}
                    alt={b.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    <ImageOff className="size-8" />
                  </div>
                )}
                {b.isFeatured ? (
                  <Badge className="absolute left-3 top-3 bg-amber-500 text-white shadow-sm">
                    <Star className="mr-1 size-3 fill-white" /> Öne Çıkan
                  </Badge>
                ) : null}
                <Badge
                  variant={b.status === "PASIF" ? "secondary" : "default"}
                  className={`absolute right-3 top-3 ${b.status === "PASIF" ? "" : "bg-emerald-600"}`}
                >
                  {b.status === "PASIF" ? "Pasif" : "Aktif"}
                </Badge>
              </div>

              <CardContent className="p-4">
                <h3 className="truncate font-semibold text-slate-900 dark:text-white" title={b.name}>
                  {b.name}
                </h3>

                <div className="mt-2 flex items-center justify-between border-t pt-3 text-xs text-slate-500 dark:border-neutral-800">
                  <span className="flex items-center gap-1 font-medium">
                    <Users className="size-3.5 text-slate-400" /> {b.capacity} Kişi
                  </span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {new Intl.NumberFormat("tr-TR", {
                      style: "currency",
                      currency: "TRY",
                      maximumFractionDigits: 0,
                    }).format(b.nightlyPrice)}
                    <span className="text-xs font-normal text-slate-400">/gece</span>
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2 border-t pt-3 dark:border-neutral-800">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/bungalovlar/${b.id}`}>
                      <Pencil className="mr-1 size-3.5" /> Düzenle
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(b.id)}
                  >
                    <Trash2 className="size-3.5" /> Sil
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Bungalov</th>
                    <th className="px-4 py-3">Kapasite</th>
                    <th className="px-4 py-3">Gecelik Fiyat</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3 text-right">Aksiyonlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                  {filtered.map((b) => (
                    <tr key={b.id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-neutral-900/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border bg-slate-100">
                            {b.image ? (
                              <Image src={b.image} alt={b.name} fill sizes="48px" className="object-cover" unoptimized />
                            ) : (
                              <ImageOff className="m-auto size-5 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">{b.name}</p>
                            {b.isFeatured ? (
                              <span className="inline-flex items-center text-[10px] font-medium text-amber-600">
                                ★ Öne Çıkan
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{b.capacity} Kişilik</td>
                      <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                        {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(
                          b.nightlyPrice
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={b.status === "PASIF" ? "secondary" : "default"} className={b.status === "PASIF" ? "" : "bg-emerald-600"}>
                          {b.status === "PASIF" ? "Pasif" : "Aktif"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                            <Link href={`/admin/bungalovlar/${b.id}`}>
                              <Pencil className="mr-1 size-3" /> Düzenle
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(b.id)}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Silme Onay Modalı */}
      <Dialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bungalov Birimini Sil</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Bu bungalov kaydını ve detaylarını silmek istediğinizden emin misiniz? İşlem siteden anında kaldırılacaktır.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={pending}
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
