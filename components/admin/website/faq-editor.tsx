"use client"

import { useState, useTransition, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Pencil,
  Copy,
  Sparkles,
  Search,
  Star,
  HelpCircle,
} from "lucide-react"

import { type CmsFaqItem } from "@/lib/site/website-cms-types"
import {
  saveFaqAction,
  deleteSingleFaqAction,
  saveSingleFaqAction,
} from "@/app/admin/(panel)/website/actions"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { SaveStatusBanner, type SaveStatus } from "@/components/admin/save-status"

export type FaqItem = CmsFaqItem

const FAQ_CATEGORIES = [
  "Genel",
  "Rezervasyon & Ödeme",
  "Giriş & Çıkış",
  "Bungalov Özellikleri",
  "Ev Kuralları & İptal",
]

export function FaqEditor({ initial }: { initial: FaqItem[] }) {
  const router = useRouter()
  const [items, setItems] = useState<FaqItem[]>(initial)
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<SaveStatus>(null)

  // Filtreleme State'leri
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "PASSIVE">("ALL")

  // Silme Onay Modalı
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleDuplicate = (item: FaqItem) => {
    const copy: FaqItem = {
      ...item,
      id: `faq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      question: `${item.question} (Kopya)`,
    }

    startTransition(async () => {
      const res = await saveSingleFaqAction(copy)
      if (res.ok) {
        setItems((prev) => [...prev, copy])
        setStatus({ type: "ok", msg: "Soru kopyalandı." })
        router.refresh()
      } else {
        setStatus({ type: "err", msg: res.error })
      }
    })
  }

  const handleMove = (index: number, dir: -1 | 1) => {
    const next = [...items]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setItems(next)

    startTransition(async () => {
      const res = await saveFaqAction(next)
      if (res.ok) {
        setStatus({ type: "ok", msg: "Sıralama kaydedildi." })
      } else {
        setStatus({ type: "err", msg: res.error })
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteSingleFaqAction(id)
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== id))
        setStatus({ type: "ok", msg: "Soru silindi." })
        setDeleteId(null)
        router.refresh()
      } else {
        setStatus({ type: "err", msg: res.error })
      }
    })
  }

  // Filtrelenmiş Sorular
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCatFilter !== "ALL" && (item.category || "Genel") !== selectedCatFilter) {
        return false
      }
      if (statusFilter === "ACTIVE" && !item.isActive) return false
      if (statusFilter === "PASSIVE" && item.isActive) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const qMatch = item.question.toLowerCase().includes(q)
        const aMatch = item.answer.toLowerCase().includes(q)
        if (!qMatch && !aMatch) return false
      }
      return true
    })
  }, [items, selectedCatFilter, statusFilter, searchQuery])

  return (
    <div className="space-y-3.5">
      {/* Üst İşlem Barı - Minimal */}
      <div className="sticky top-14 z-20 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-2xs backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-6 text-[11px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200">
            <Sparkles className="mr-1 size-3" /> SSS Soruları
          </Badge>
          <span className="text-xs text-slate-500 font-medium">{items.length} Soru Kayıtlı</span>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-8 text-xs">
            <Link href="/admin/sayfalar/ana-sayfa/faq">Bölüm başlığını düzenle</Link>
          </Button>
          <Button asChild size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700">
            <Link href="/admin/website/sss/yeni">
              <Plus className="mr-1 size-3.5" /> Yeni Soru Ekle
            </Link>
          </Button>
        </div>
      </div>

      <SaveStatusBanner status={status} />

      {/* ARAMA VE KATEGORİ FİLTRELERİ - MİNİMAL */}
      <div className="space-y-2 rounded-lg border bg-white p-2.5 dark:bg-neutral-900 dark:border-neutral-800">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2 size-3.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sorularda veya cevaplarda ara..."
              className="h-8 pl-8 text-xs border-0 bg-slate-50 dark:bg-neutral-800 focus-visible:ring-1"
            />
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-slate-400 font-medium px-1">Durum:</span>
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`rounded px-2 py-1 transition-colors ${
                statusFilter === "ALL" ? "bg-slate-900 text-white font-semibold dark:bg-white dark:text-slate-900" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-neutral-800"
              }`}
            >
              Tümü
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ACTIVE")}
              className={`rounded px-2 py-1 transition-colors ${
                statusFilter === "ACTIVE" ? "bg-emerald-600 text-white font-semibold" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-neutral-800"
              }`}
            >
              Yayında
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("PASSIVE")}
              className={`rounded px-2 py-1 transition-colors ${
                statusFilter === "PASSIVE" ? "bg-slate-700 text-white font-semibold" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-neutral-800"
              }`}
            >
              Gizli
            </button>
          </div>
        </div>

        {/* Kategori Çipleri */}
        <div className="flex flex-wrap items-center gap-1 pt-1.5 border-t dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setSelectedCatFilter("ALL")}
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all ${
              selectedCatFilter === "ALL"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-neutral-800 dark:text-slate-300"
            }`}
          >
            Tüm Kategoriler ({items.length})
          </button>

          {FAQ_CATEGORIES.map((cat) => {
            const count = items.filter((it) => (it.category || "Genel") === cat).length
            const isSelected = selectedCatFilter === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCatFilter(cat)}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all flex items-center gap-1 ${
                  isSelected
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-neutral-800 dark:text-slate-300"
                }`}
              >
                <span>{cat}</span>
                <span className={`rounded-full px-1 text-[9px] ${isSelected ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-700 dark:bg-neutral-700 dark:text-slate-200"}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ULTRA-MİNİMAL SSS SATIR LİSTESİ */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-xs text-slate-500">
            Arama kriterlerine uygun SSS sorusu bulunamadı.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className={`group flex items-center justify-between rounded-lg border bg-white px-3 py-2 shadow-2xs transition-all hover:border-emerald-500/40 hover:bg-slate-50/50 dark:bg-neutral-900 dark:hover:bg-neutral-800/50 ${
                item.isFeatured
                  ? "border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/10"
                  : "border-slate-200/80 dark:border-neutral-800"
              }`}
            >
              {/* Sol: Sıra, Kategori/Yıldız Badge ve Soru/Cevap */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-semibold text-slate-600 dark:bg-neutral-800 dark:text-slate-300">
                  #{index + 1}
                </span>

                <HelpCircle className="size-4 text-emerald-600 shrink-0" />

                {/* Soru Cümlesi ve Cevap Önizlemesi */}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100" title={item.question}>
                      {item.question || "Yeni Soru Cümlesi"}
                    </span>
                    {item.isFeatured ? (
                      <Badge variant="outline" className="h-4 px-1 text-[9px] bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300">
                        <Star className="mr-0.5 size-2.5 fill-amber-500 text-amber-500" /> Öne Çıkan
                      </Badge>
                    ) : null}
                    {item.category ? (
                      <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600 dark:bg-neutral-800 dark:text-slate-300 hidden sm:inline-block">
                        {item.category}
                      </span>
                    ) : null}
                  </div>
                  {item.answer ? (
                    <p className="line-clamp-1 text-[11px] text-slate-400 dark:text-slate-500 max-w-md">
                      {item.answer}
                    </p>
                  ) : null}
                </div>

                {/* Yayın Rozeti */}
                <Badge
                  variant={item.isActive ? "default" : "secondary"}
                  className={`h-5 text-[10px] px-1.5 font-normal shrink-0 ${
                    item.isActive ? "bg-emerald-600" : "bg-slate-200 text-slate-600 dark:bg-neutral-800 dark:text-slate-400"
                  }`}
                >
                  {item.isActive ? "Yayında" : "Gizli"}
                </Badge>
              </div>

              {/* Sağ: Aksiyon Butonları */}
              <div className="flex items-center gap-1 ml-3 shrink-0">
                <div className="flex items-center border-r border-slate-200 pr-1 dark:border-neutral-800">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    onClick={() => handleMove(index, -1)}
                    disabled={index === 0 || pending}
                    title="Yukarı Taşı"
                  >
                    <ArrowUp className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    onClick={() => handleMove(index, 1)}
                    disabled={index === items.length - 1 || pending}
                    title="Aşağı Taşı"
                  >
                    <ArrowDown className="size-3.5" />
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  onClick={() => handleDuplicate(item)}
                  disabled={pending}
                  title="Kopyala"
                >
                  <Copy className="size-3.5" />
                </Button>

                {/* DÜZENLE YENİ SAYFADA AÇILSIN */}
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[11px] font-medium border-emerald-500/50 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                >
                  <Link href={`/admin/website/sss/${item.id}`}>
                    <Pencil className="mr-1 size-3 text-emerald-600" /> Düzenle
                  </Link>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="h-7 w-7 text-slate-400 hover:text-destructive"
                  onClick={() => setDeleteId(item.id)}
                  disabled={pending}
                  title="Sil"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SİLME ONAY MODALI */}
      <Dialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">Soruyu Sil</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Bu SSS sorusunu silmek istediğinizden emin misiniz? Değişikliği kaydettiğinizde anasayfadan kaldırılacaktır.
          </p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              size="sm"
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
