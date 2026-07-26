"use client"

import { useState, useSyncExternalStore, useTransition, useMemo, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus,
  Trash2,
  Save,
  ImageOff,
  FolderOpen,
  Search,
  CheckSquare,
  Square,
  Sparkles,
  ZoomIn,
  Pencil,
  Copy,
  ArrowUp,
  ArrowDown,
  X,
  Star,
  LayoutGrid,
  Rows3,
} from "lucide-react"

import { saveGalleryAction, deleteSingleGalleryAction, saveSingleGalleryAction } from "@/app/admin/(panel)/website/actions"
import { GALLERY_FEATURED_LIMIT } from "@/lib/cms/gallery-constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { SaveStatusBanner, type SaveStatus } from "@/components/admin/save-status"

export type GalleryCategory = { id: string; name: string; isActive: boolean }
export type GalleryItem = {
  id: string
  imageUrl: string
  title: string
  description: string
  categoryId: string
  isActive: boolean
  isFeatured?: boolean
}

const rid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

type ViewMode = "grid" | "list"

const VIEW_MODE_STORAGE_KEY = "admin:gallery:view-mode"
const VIEW_MODE_EVENT = "admin:gallery:view-mode-change"

/**
 * Görünüm tercihi localStorage'da tutulur. Sunucu anlık görüntüsü her zaman "grid"
 * döndüğü için hydration uyumsuzluğu oluşmaz; tercih hydration sonrası uygulanır.
 */
function subscribeToViewMode(onStoreChange: () => void) {
  window.addEventListener(VIEW_MODE_EVENT, onStoreChange)
  window.addEventListener("storage", onStoreChange)
  return () => {
    window.removeEventListener(VIEW_MODE_EVENT, onStoreChange)
    window.removeEventListener("storage", onStoreChange)
  }
}

function readStoredViewMode(): ViewMode {
  return window.localStorage.getItem(VIEW_MODE_STORAGE_KEY) === "list" ? "list" : "grid"
}

function writeStoredViewMode(mode: ViewMode) {
  window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode)
  window.dispatchEvent(new Event(VIEW_MODE_EVENT))
}

export function GalleryEditor({
  initialCategories,
  initialItems,
}: {
  initialCategories: GalleryCategory[]
  initialItems: GalleryItem[]
}) {
  const router = useRouter()
  const [categories, setCategories] = useState<GalleryCategory[]>(initialCategories)
  const [items, setItems] = useState<GalleryItem[]>(initialItems)
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<SaveStatus>(null)
  const stableSnapshotRef = useRef<{ categories: GalleryCategory[]; items: GalleryItem[] }>({
    categories: initialCategories,
    items: initialItems,
  })

  // Görünüm Modu (Izgara / Liste)
  const viewMode = useSyncExternalStore<ViewMode>(
    subscribeToViewMode,
    readStoredViewMode,
    () => "grid"
  )

  // Filtreleme State'leri
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "PASSIVE">("ALL")
  const [featuredFilter, setFeaturedFilter] = useState<boolean>(false)

  // Toplu Seçim (Multi-select) State
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])

  // Lightbox Zoom Görsel Modalı
  const [zoomImage, setZoomImage] = useState<GalleryItem | null>(null)

  // Kategori Yönetim Modalı
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [newCatName, setNewCatName] = useState("")

  // Silme Onay Modalı
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const clearStatus = () => setStatus(null)

  const persistGalleryConfig = (
    nextCategories: GalleryCategory[],
    nextItems: GalleryItem[],
    successMsg: string,
    rollback?: { categories: GalleryCategory[]; items: GalleryItem[] }
  ) => {
    startTransition(async () => {
      try {
        const res = await saveGalleryAction({ categories: nextCategories, items: nextItems })
        if (res.ok) {
          stableSnapshotRef.current = { categories: nextCategories, items: nextItems }
          setStatus({ type: "ok", msg: successMsg })
          router.refresh()
        } else {
          if (rollback) {
            stableSnapshotRef.current = rollback
            setCategories(rollback.categories)
            setItems(rollback.items)
          }
          setStatus({ type: "err", msg: res.error })
        }
      } catch (err) {
        if (rollback) {
          stableSnapshotRef.current = rollback
          setCategories(rollback.categories)
          setItems(rollback.items)
        }
        const msg =
          err instanceof Error
            ? err.message
            : "Kaydetme sırasında beklenmeyen bir hata oluştu."
        setStatus({ type: "err", msg })
      }
    })
  }

  // Kategori Ekleme
  const addCategory = () => {
    if (!newCatName.trim()) return
    const snapshot = { categories, items }
    const freshCat: GalleryCategory = {
      id: rid("cat"),
      name: newCatName.trim(),
      isActive: true,
    }
    const nextCategories = [...categories, freshCat]
    setCategories(nextCategories)
    setNewCatName("")
    clearStatus()
    persistGalleryConfig(nextCategories, items, "Kategori eklendi.", snapshot)
  }

  // Kategori Düzenleme & Silme
  const updateCategory = (id: string, patch: Partial<GalleryCategory>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
    clearStatus()
  }

  const toggleCategoryActive = (id: string, isActive: boolean) => {
    const snapshot = { categories, items }
    const nextCategories = categories.map((c) => (c.id === id ? { ...c, isActive } : c))
    setCategories(nextCategories)
    clearStatus()
    persistGalleryConfig(
      nextCategories,
      items,
      isActive ? "Kategori aktif." : "Kategori pasif.",
      snapshot
    )
  }

  const removeCategory = (id: string) => {
    const snapshot = { categories, items }
    const nextCategories = categories.filter((c) => c.id !== id)
    // O kategoriye ait görselleri varsayılana çek
    const fallbackId = nextCategories[0]?.id || "genel"
    const nextItems = items.map((i) =>
      i.categoryId === id ? { ...i, categoryId: fallbackId } : i
    )
    setCategories(nextCategories)
    setItems(nextItems)
    clearStatus()
    persistGalleryConfig(nextCategories, nextItems, "Kategori silindi.", snapshot)
  }

  // Vitrin İşlemi (Toggle Featured)
  const toggleFeatured = (item: GalleryItem) => {
    const isNowFeatured = !item.isFeatured

    if (isNowFeatured) {
      // Vitrine eklemek istiyorsak, o kategorideki mevcut vitrin sayısını kontrol et
      const catFeaturedCount = items.filter(i => i.categoryId === item.categoryId && i.isFeatured).length
      if (catFeaturedCount >= GALLERY_FEATURED_LIMIT) {
        setStatus({ type: "err", msg: `Bu kategoride en fazla ${GALLERY_FEATURED_LIMIT} görsel vitrinde olabilir.` })
        return
      }
    }

    const updatedItem = { ...item, isFeatured: isNowFeatured }
    setItems(prev => prev.map(i => i.id === item.id ? updatedItem : i))
    clearStatus()
  }

  // Kopyalama (Duplicate)
  const handleDuplicate = (item: GalleryItem) => {
    const copy: GalleryItem = {
      ...item,
      id: rid("gal"),
      title: item.title ? `${item.title} (Kopya)` : "Görsel Kopya",
      isFeatured: false, // Kopya varsayılan olarak vitrinde olmasın
    }

    startTransition(async () => {
      const res = await saveSingleGalleryAction(copy)
      if (res.ok) {
        setItems((prev) => [...prev, copy])
        setStatus({ type: "ok", msg: "Galeri görseli kopyalandı." })
        router.refresh()
      } else {
        setStatus({ type: "err", msg: res.error })
      }
    })
  }

  // Sıra Değiştirme
  const handleMove = (index: number, dir: -1 | 1) => {
    const next = [...items]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setItems(next)

    startTransition(async () => {
      const res = await saveGalleryAction({ categories, items: next })
      if (res.ok) {
        setStatus({ type: "ok", msg: "Sıralama kaydedildi." })
      } else {
        setStatus({ type: "err", msg: res.error })
      }
    })
  }

  // Silme İşlemi
  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteSingleGalleryAction(id)
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== id))
        setStatus({ type: "ok", msg: "Görsel silindi." })
        setDeleteId(null)
        router.refresh()
      } else {
        setStatus({ type: "err", msg: res.error })
      }
    })
  }

  // Tümünü Kaydet (Kategoriler & Sıralama)
  const saveAll = () => {
    persistGalleryConfig(categories, items, "Galeri yapılandırması başarıyla kaydedildi.")
  }

  // Toplu Seçim İşlemleri
  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedItemIds.length === filteredItems.length) {
      setSelectedItemIds([])
    } else {
      setSelectedItemIds(filteredItems.map((i) => i.id))
    }
  }

  const bulkMoveCategory = (catId: string) => {
    setItems((prev) =>
      prev.map((i) => (selectedItemIds.includes(i.id) ? { ...i, categoryId: catId, isFeatured: false } : i))
    )
    setStatus({ type: "ok", msg: `${selectedItemIds.length} görsel yeni kategoriye taşındı ve vitrinden çıkarıldı.` })
  }

  const bulkSetStatus = (active: boolean) => {
    setItems((prev) =>
      prev.map((i) => (selectedItemIds.includes(i.id) ? { ...i, isActive: active } : i))
    )
    setStatus({ type: "ok", msg: `${selectedItemIds.length} görselin durumu güncellendi.` })
  }
  
  const bulkSetFeatured = (featured: boolean) => {
     const currentItems = [...items]
     let successCount = 0
     
     if (featured) {
       // Kategorilere göre vitrin sayısını grupla
       const catCounts = new Map<string, number>()
       currentItems.forEach(i => {
         if (i.isFeatured) catCounts.set(i.categoryId, (catCounts.get(i.categoryId) || 0) + 1)
       })
       
       const selectedToFeature = currentItems.filter(i => selectedItemIds.includes(i.id) && !i.isFeatured)
       
       for (const item of selectedToFeature) {
          const count = catCounts.get(item.categoryId) || 0
          if (count < GALLERY_FEATURED_LIMIT) {
            item.isFeatured = true
            catCounts.set(item.categoryId, count + 1)
            successCount++
          }
       }
       setItems([...currentItems])
       if (successCount < selectedItemIds.length) {
          setStatus({ type: "err", msg: `${successCount} görsel vitrine eklendi. ${selectedItemIds.length - successCount} görsel, kategori sınırına (${GALLERY_FEATURED_LIMIT}) takıldığı için eklenemedi.` })
       } else {
          setStatus({ type: "ok", msg: `${successCount} görsel vitrine eklendi.` })
       }
     } else {
       setItems((prev) =>
         prev.map((i) => (selectedItemIds.includes(i.id) ? { ...i, isFeatured: false } : i))
       )
       setStatus({ type: "ok", msg: `Seçili görseller vitrinden çıkarıldı.` })
     }
  }

  const bulkDelete = () => {
    const idsToDelete = [...selectedItemIds]
    startTransition(async () => {
      const deletedIds: string[] = []

      for (const id of idsToDelete) {
        const res = await deleteSingleGalleryAction(id)
        if (!res.ok) {
          setStatus({ type: "err", msg: res.error })
          break
        }
        deletedIds.push(id)
      }

      if (deletedIds.length > 0) {
        setItems((prev) => prev.filter((item) => !deletedIds.includes(item.id)))
        setSelectedItemIds((prev) => prev.filter((id) => !deletedIds.includes(id)))
        router.refresh()
      }

      if (deletedIds.length === idsToDelete.length) {
        setStatus({ type: "ok", msg: "Seçilen görseller çöp kutusuna taşındı." })
      }
    })
  }

  // Kategori Bazlı Görsel Sayıları ve Vitrin Sayıları
  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; featured: number }> = {}
    categories.forEach(c => { stats[c.id] = { total: 0, featured: 0 }})
    
    items.forEach((item) => {
      if (!stats[item.categoryId]) stats[item.categoryId] = { total: 0, featured: 0 }
      stats[item.categoryId].total += 1
      if (item.isFeatured) {
        stats[item.categoryId].featured += 1
      }
    })
    return stats
  }, [items, categories])

  // Filtrelenmiş Görseller
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCatFilter !== "ALL" && item.categoryId !== selectedCatFilter) {
        return false
      }
      if (statusFilter === "ACTIVE" && !item.isActive) return false
      if (statusFilter === "PASSIVE" && item.isActive) return false

      if (featuredFilter && !item.isFeatured) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const tMatch = item.title.toLowerCase().includes(q)
        const dMatch = item.description.toLowerCase().includes(q)
        if (!tMatch && !dMatch) return false
      }
      return true
    })
  }, [items, selectedCatFilter, statusFilter, featuredFilter, searchQuery])

  const zoomCategoryName = zoomImage
    ? categories.find((c) => c.id === zoomImage.categoryId)?.name || "Genel"
    : ""

  return (
    <div className="space-y-3.5">
      {/* Sabit İşlem Üst Barı */}
      <div className="sticky top-14 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <Sparkles className="mr-1 size-3" /> 2026 Galeri Yönetimi
          </Badge>
          <span className="text-xs font-medium text-slate-500">{items.length} Görsel Hazır</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCategoryModalOpen(true)}>
            <FolderOpen className="mr-1 size-4" /> Kategorileri Yönet ({categories.length})
          </Button>

          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/admin/website/galeri/yeni">
              <Plus className="mr-1 size-4" /> Yeni Görsel Ekle
            </Link>
          </Button>

          <Button onClick={saveAll} disabled={pending} variant="secondary">
            <Save className="mr-1 size-4" /> {pending ? "Kaydediliyor..." : "Tümünü Kaydet"}
          </Button>
        </div>
      </div>

      <SaveStatusBanner status={status} />

      {/* TOPLU İŞLEM BARI (BATCH ACTIONS) */}
      {selectedItemIds.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-emerald-500 bg-emerald-50/90 p-3.5 dark:bg-emerald-950/40">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
            <CheckSquare className="size-4 text-emerald-600" />
            <span>{selectedItemIds.length} Görsel Seçildi</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select onValueChange={bulkMoveCategory}>
              <SelectTrigger className="h-8 text-xs bg-white dark:bg-neutral-800 w-44">
                <SelectValue placeholder="Kategoriye Taşı..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => bulkSetFeatured(true)}>
               Vitrine Ekle
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => bulkSetFeatured(false)}>
               Vitrinden Çıkar
            </Button>

            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => bulkSetStatus(true)}>
              Tümünü Yayına Al
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => bulkSetStatus(false)}>
              Tümünü Gizle
            </Button>
            <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={bulkDelete}>
              <Trash2 className="mr-1 size-3.5" /> Seçilenleri Sil
            </Button>
          </div>
        </div>
      ) : null}

      {/* ARAMA VE KATEGORİ ÇİP FİLTRELERİ */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Arama Çubuğu */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Görsel başlığında veya açıklamasında ara..."
                className="pl-9 text-xs"
              />
            </div>

            {/* Durum ve Vitrin Filtresi */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={featuredFilter}
                  onCheckedChange={setFeaturedFilter}
                  id="featured-filter"
                />
                <Label htmlFor="featured-filter" className="text-xs flex items-center gap-1 cursor-pointer">
                  <Star className={`size-3.5 ${featuredFilter ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                  Vitrin Göster
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Durum:</span>
                <div className="flex items-center gap-1 rounded-lg border p-1 bg-slate-50 dark:bg-neutral-900 dark:border-neutral-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("ALL")}
                    className={`rounded px-2.5 py-1 transition-colors ${
                      statusFilter === "ALL" ? "bg-white shadow text-slate-900 font-semibold dark:bg-neutral-800 dark:text-white" : "text-slate-500"
                    }`}
                  >
                    Tümü
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("ACTIVE")}
                    className={`rounded px-2.5 py-1 transition-colors ${
                      statusFilter === "ACTIVE" ? "bg-emerald-600 text-white font-semibold" : "text-slate-500"
                    }`}
                  >
                    Yayında
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("PASSIVE")}
                    className={`rounded px-2.5 py-1 transition-colors ${
                      statusFilter === "PASSIVE" ? "bg-slate-700 text-white font-semibold" : "text-slate-500"
                    }`}
                  >
                    Gizli
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Kategori Çipleri */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setSelectedCatFilter("ALL")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                selectedCatFilter === "ALL"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-neutral-800 dark:text-slate-300"
              }`}
            >
              Tüm Kategoriler ({items.length})
            </button>

            {categories.map((cat) => {
              const stats = categoryStats[cat.id] || { total: 0, featured: 0 }
              const isSelected = selectedCatFilter === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCatFilter(cat.id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-neutral-800 dark:text-slate-300"
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="inline-flex items-center gap-1">
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                        isSelected ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-700 dark:bg-neutral-700 dark:text-slate-200"
                      }`}
                    >
                      {stats.total}
                    </span>
                    {stats.featured > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-1 rounded-full border border-amber-200 dark:border-amber-900">
                        <Star className="size-2.5 fill-amber-500" aria-hidden />
                        <span>
                          {stats.featured}/{GALLERY_FEATURED_LIMIT}
                        </span>
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* GÖRSEL LİSTESİ (IZGARA / LİSTE GÖRÜNÜMÜ) */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500" onClick={toggleSelectAll}>
              {selectedItemIds.length === filteredItems.length && filteredItems.length > 0 ? (
                <CheckSquare className="mr-1 size-4 text-emerald-600" />
              ) : (
                <Square className="mr-1 size-4" />
              )}
              Tümünü Seç ({filteredItems.length})
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              {filteredItems.length} görsel gösteriliyor
            </span>

            <div
              role="group"
              aria-label="Görünüm modu"
              className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <button
                type="button"
                onClick={() => writeStoredViewMode("grid")}
                aria-pressed={viewMode === "grid"}
                aria-label="Izgara görünümü"
                title="Izgara görünümü"
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-neutral-800 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                <LayoutGrid className="size-4" aria-hidden />
                <span className="hidden sm:inline">Izgara</span>
              </button>
              <button
                type="button"
                onClick={() => writeStoredViewMode("list")}
                aria-pressed={viewMode === "list"}
                aria-label="Liste görünümü"
                title="Liste görünümü"
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-neutral-800 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                <Rows3 className="size-4" aria-hidden />
                <span className="hidden sm:inline">Liste</span>
              </button>
            </div>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-slate-500">
              Arama kriterlerine uygun görsel bulunamadı. “Yeni Görsel Ekle” butonu ile fotoğraf ekleyebilirsiniz.
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              const isChecked = selectedItemIds.includes(item.id)
              const catName = categories.find((c) => c.id === item.categoryId)?.name || "Genel"
              const orderIndex = items.findIndex((i) => i.id === item.id)

              return (
                <Card
                  key={item.id}
                  className={`group relative overflow-hidden transition-all duration-200 py-0 gap-2 ${
                    isChecked
                      ? "border-2 border-emerald-500 shadow-md bg-emerald-50/10"
                      : "hover:border-slate-300 dark:hover:border-neutral-700"
                  }`}
                >
                  {/* Görsel Kartı Üst Görsel Alanı */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-neutral-800">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title || "Galeri Görseli"}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        <ImageOff className="size-8" />
                      </div>
                    )}
                    
                    {item.isFeatured && (
                      <div className="absolute top-0 right-0 p-1.5 z-10 bg-gradient-to-bl from-amber-500/80 to-transparent rounded-bl-lg">
                        <Star className="size-4 text-white fill-white drop-shadow-md" />
                      </div>
                    )}

                    {/* Çatıda Seçim Checkbox & Büyüteç Zoom Butonu */}
                    <div className="absolute left-3 top-3 z-10">
                      <button
                        type="button"
                        onClick={() => toggleSelectItem(item.id)}
                        className={`flex size-6 items-center justify-center rounded-md border shadow transition-transform active:scale-95 ${
                          isChecked
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-slate-300 bg-white/90 text-slate-700 hover:bg-white"
                        }`}
                      >
                        {isChecked ? <CheckSquare className="size-4" /> : <Square className="size-4" />}
                      </button>
                    </div>

                    <div className="absolute right-3 bottom-3 z-10 flex flex-col items-end gap-1">
                      {item.imageUrl ? (
                        <button
                          type="button"
                          onClick={() => setZoomImage(item)}
                          className="flex size-7 items-center justify-center rounded-md border border-slate-200 bg-white/90 text-slate-700 shadow backdrop-blur transition-all hover:bg-white hover:scale-105 mb-1"
                          title="Büyük Boyut Önizle"
                        >
                          <ZoomIn className="size-4" />
                        </button>
                      ) : null}
                      <Badge
                        variant={item.isActive ? "default" : "secondary"}
                        className={item.isActive ? "bg-emerald-600 shadow-sm" : ""}
                      >
                        {item.isActive ? "Yayında" : "Gizli"}
                      </Badge>
                    </div>
                  </div>

                  {/* Görsel Kartı İçerik ve Aksiyonlar - Kompakt py-0 & gap-2 */}
                  <CardContent className="px-2.5 pb-2.5 pt-2 gap-2 flex flex-col">
                    <div className="flex items-center justify-between gap-1.5">
                      <Badge variant="outline" className="h-5 text-[10px] px-1.5 bg-slate-50 text-slate-600 dark:bg-neutral-800 dark:text-slate-300 border-slate-200">
                        {catName}
                      </Badge>
                      <span className="text-[10px] font-bold text-slate-400">#{orderIndex + 1}</span>
                    </div>

                    <h4 className="truncate font-semibold text-slate-900 dark:text-white text-xs px-0.5" title={item.title}>
                      {item.title || "İsimsiz Görsel"}
                    </h4>

                    {/* Sıralama ve Aksiyon Butonları */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 dark:border-neutral-800 mt-1">
                      <OrderButtons
                        orderIndex={orderIndex}
                        total={items.length}
                        pending={pending}
                        onMove={handleMove}
                      />

                      <ItemActions
                        item={item}
                        pending={pending}
                        onToggleFeatured={toggleFeatured}
                        onDuplicate={handleDuplicate}
                        onDelete={setDeleteId}
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-slate-100 dark:divide-neutral-800">
                {filteredItems.map((item) => {
                  const isChecked = selectedItemIds.includes(item.id)
                  const catName = categories.find((c) => c.id === item.categoryId)?.name || "Genel"
                  const orderIndex = items.findIndex((i) => i.id === item.id)

                  return (
                    <li
                      key={item.id}
                      className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                        isChecked
                          ? "bg-emerald-50/70 dark:bg-emerald-950/25"
                          : "hover:bg-slate-50 dark:hover:bg-neutral-800/50"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSelectItem(item.id)}
                        aria-pressed={isChecked}
                        aria-label={`${item.title || "İsimsiz görsel"} seçimini değiştir`}
                        className={`flex size-6 shrink-0 items-center justify-center rounded-md border transition-transform active:scale-95 ${
                          isChecked
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-slate-300 text-slate-500 hover:text-slate-800 dark:border-neutral-700 dark:hover:text-white"
                        }`}
                      >
                        {isChecked ? <CheckSquare className="size-4" /> : <Square className="size-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setZoomImage(item)}
                        disabled={!item.imageUrl}
                        title={item.imageUrl ? "Büyük Boyut Önizle" : "Görsel yok"}
                        className="group relative size-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 disabled:cursor-default dark:border-neutral-800 dark:bg-neutral-800"
                      >
                        {item.imageUrl ? (
                          <>
                            <Image
                              src={item.imageUrl}
                              alt={item.title || "Galeri Görseli"}
                              fill
                              sizes="48px"
                              className="object-cover transition-transform duration-300 group-hover:scale-110"
                              unoptimized
                            />
                            <span className="absolute inset-0 flex items-center justify-center bg-slate-900/0 text-white opacity-0 transition-all group-hover:bg-slate-900/40 group-hover:opacity-100">
                              <ZoomIn className="size-4" aria-hidden />
                            </span>
                          </>
                        ) : (
                          <span className="flex h-full items-center justify-center text-slate-400">
                            <ImageOff className="size-5" aria-hidden />
                          </span>
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate text-sm font-semibold text-slate-900 dark:text-white"
                          title={item.title}
                        >
                          {item.title || "İsimsiz Görsel"}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-slate-500">
                          <span className="truncate font-medium">{catName}</span>
                          <span aria-hidden>•</span>
                          <span className={item.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}>
                            {item.isActive ? "Yayında" : "Gizli"}
                          </span>
                          {item.isFeatured ? (
                            <>
                              <span aria-hidden>•</span>
                              <span className="inline-flex items-center gap-0.5 font-semibold text-amber-600 dark:text-amber-400">
                                <Star className="size-3 fill-amber-500 text-amber-500" aria-hidden /> Vitrin
                              </span>
                            </>
                          ) : null}
                          <span aria-hidden>•</span>
                          <span className="font-bold text-slate-400">#{orderIndex + 1}</span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <div className="hidden sm:flex">
                          <OrderButtons
                            orderIndex={orderIndex}
                            total={items.length}
                            pending={pending}
                            onMove={handleMove}
                          />
                        </div>

                        <ItemActions
                          item={item}
                          pending={pending}
                          onToggleFeatured={toggleFeatured}
                          onDuplicate={handleDuplicate}
                          onDelete={setDeleteId}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* KATEGORİ YÖNETİM DIALOGU */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="size-5 text-emerald-600" /> Galeri Kategorileri
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Yeni kategori adı (Örn: Havuz Alanı)..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return
                  e.preventDefault()
                  if (pending) return
                  addCategory()
                }}
                disabled={pending}
              />
              <Button type="button" onClick={addCategory} disabled={pending}>
                <Plus className="size-4" /> Ekle
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const stats = categoryStats[cat.id] || { total: 0, featured: 0 }
                return (
                  <div
                    key={cat.id}
                    className="flex flex-col gap-1 rounded-lg border p-2.5 bg-slate-50 dark:bg-neutral-900 dark:border-neutral-800"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Input
                        value={cat.name}
                        onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                        onBlur={(e) => {
                          if (pending) return

                          const inputTrimmed = e.target.value.trim()
                          const stableName =
                            stableSnapshotRef.current.categories.find((c) => c.id === cat.id)?.name ??
                            cat.name
                          const stableTrimmed = stableName.trim()
                          const nextName = inputTrimmed || stableTrimmed

                          // No-op save guard: trimmed değer değişmediyse (veya boşsa eskiyi koruyorsak) kaydetme.
                          if (nextName === stableTrimmed) {
                            if (cat.name !== stableTrimmed) {
                              setCategories((prev) =>
                                prev.map((c) => (c.id === cat.id ? { ...c, name: stableTrimmed } : c))
                              )
                            }
                            return
                          }

                          const snapshot = stableSnapshotRef.current
                          const nextCategories = categories.map((c) =>
                            c.id === cat.id ? { ...c, name: nextName } : c
                          )
                          setCategories(nextCategories)
                          clearStatus()
                          persistGalleryConfig(nextCategories, items, "Kategori güncellendi.", snapshot)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            ;(e.target as HTMLInputElement).blur()
                          }
                        }}
                        className="h-8 text-xs font-medium"
                        disabled={pending}
                      />
                      <div className="flex items-center gap-1">
                        <Switch
                          checked={cat.isActive}
                          onCheckedChange={(v) => {
                            if (pending) return
                            toggleCategoryActive(cat.id, v)
                          }}
                          disabled={pending}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeCategory(cat.id)}
                          disabled={pending}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-1 text-[10px] text-slate-500">
                       <span>Toplam: <b>{stats.total}</b> görsel</span>
                       <span>•</span>
                       <span className="flex items-center gap-0.5 text-amber-600">
                         Vitrin: <b>{stats.featured}/{GALLERY_FEATURED_LIMIT}</b>
                       </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setCategoryModalOpen(false)} disabled={pending}>
              Tamam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LIGHTBOX ZOOM MODALI */}
      <Dialog open={Boolean(zoomImage)} onOpenChange={(open) => !open && setZoomImage(null)}>
        <DialogContent
          showCloseButton={false}
          className="w-fit min-w-[min(92vw,26rem)] max-w-[min(96vw,80rem)] gap-0 overflow-hidden border-slate-800 bg-slate-950 p-0 text-white"
        >
          <DialogHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/95 px-4 py-3 text-left">
            <div className="min-w-0">
              <DialogTitle className="truncate text-sm font-semibold text-white">
                {zoomImage?.title || "Galeri Görsel Önizleme"}
              </DialogTitle>
              <DialogDescription className="mt-0.5 truncate text-[11px] text-slate-400">
                {zoomCategoryName}
                {" • "}
                {zoomImage?.isActive ? "Yayında" : "Gizli"}
                {zoomImage?.isFeatured ? " • Vitrin" : ""}
              </DialogDescription>
            </div>

            <DialogClose
              aria-label="Önizlemeyi kapat"
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <X className="size-4" aria-hidden />
            </DialogClose>
          </DialogHeader>

          {zoomImage?.imageUrl ? (
            <div className="flex items-center justify-center bg-black">
              <Image
                src={zoomImage.imageUrl}
                alt={zoomImage.title || "Galeri görseli"}
                width={1600}
                height={1200}
                sizes="96vw"
                className="h-auto max-h-[78vh] w-auto max-w-full object-contain"
                unoptimized
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* SİLME ONAY MODALI */}
      <Dialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Görseli Sil</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Bu galeri görselini silmek istediğinizden emin misiniz? Değişikliği kaydettiğinizde galeriden kaldırılacaktır.
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

function OrderButtons({
  orderIndex,
  total,
  pending,
  onMove,
}: {
  orderIndex: number
  total: number
  pending: boolean
  onMove: (index: number, dir: -1 | 1) => void
}) {
  return (
    <div className="flex items-center gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        onClick={() => onMove(orderIndex, -1)}
        disabled={orderIndex <= 0 || pending}
        title="Yukarı Taşı"
        aria-label="Yukarı taşı"
      >
        <ArrowUp className="size-3.5" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        onClick={() => onMove(orderIndex, 1)}
        disabled={orderIndex < 0 || orderIndex >= total - 1 || pending}
        title="Aşağı Taşı"
        aria-label="Aşağı taşı"
      >
        <ArrowDown className="size-3.5" aria-hidden />
      </Button>
    </div>
  )
}

function ItemActions({
  item,
  pending,
  onToggleFeatured,
  onDuplicate,
  onDelete,
}: {
  item: GalleryItem
  pending: boolean
  onToggleFeatured: (item: GalleryItem) => void
  onDuplicate: (item: GalleryItem) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className={`h-7 w-7 ${
          item.isFeatured
            ? "text-amber-500 bg-amber-50 dark:bg-amber-950/30"
            : "text-slate-400 hover:text-amber-500"
        }`}
        onClick={() => onToggleFeatured(item)}
        disabled={pending}
        title={item.isFeatured ? "Vitrinden Çıkar" : "Vitrine Ekle (Anasayfa)"}
        aria-label={item.isFeatured ? "Vitrinden çıkar" : "Vitrine ekle"}
      >
        <Star className={`size-3.5 ${item.isFeatured ? "fill-amber-500" : ""}`} aria-hidden />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        onClick={() => onDuplicate(item)}
        disabled={pending}
        title="Kopyala"
        aria-label="Kopyala"
      >
        <Copy className="size-3.5" aria-hidden />
      </Button>

      <Button
        asChild
        variant="outline"
        size="sm"
        className="h-7 px-2 text-[11px] font-medium border-emerald-500/50 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
      >
        <Link href={`/admin/website/galeri/${item.id}`}>
          <Pencil className="mr-1 size-3 text-emerald-600" aria-hidden /> Düzenle
        </Link>
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="h-7 w-7 text-slate-400 hover:text-destructive"
        onClick={() => onDelete(item.id)}
        disabled={pending}
        title="Sil"
        aria-label="Sil"
      >
        <Trash2 className="size-3.5" aria-hidden />
      </Button>
    </div>
  )
}