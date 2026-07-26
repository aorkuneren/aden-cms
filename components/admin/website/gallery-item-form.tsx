"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Save,
  ArrowLeft,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  Star,
} from "lucide-react"

import { type CmsGalleryItem, type CmsGalleryCategory } from "@/lib/site/website-cms-types"
import { saveSingleGalleryAction, deleteSingleGalleryAction } from "@/app/admin/(panel)/website/actions"
import { GALLERY_FEATURED_LIMIT } from "@/lib/cms/gallery-constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { SaveStatusBanner, type SaveStatus } from "@/components/admin/save-status"
import { DirectMediaPicker } from "@/components/admin/direct-media-picker"

export function GalleryItemForm({
  initial,
  categories,
  isNew,
  categoryFeaturedStatus = {},
}: {
  initial: CmsGalleryItem
  categories: CmsGalleryCategory[]
  isNew: boolean
  categoryFeaturedStatus?: Record<string, boolean>
}) {
  const router = useRouter()
  const [data, setData] = useState<CmsGalleryItem>(initial)
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<SaveStatus>(null)
  const [isDirty, setIsDirty] = useState(false)

  // Silme Onay Modalı
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const set = (patch: Partial<CmsGalleryItem>) => {
    setData((prev) => ({ ...prev, ...patch }))
    setIsDirty(true)
    setStatus(null)
  }

  const handleSave = () => {
    if (!data.imageUrl.trim()) {
      setStatus({ type: "err", msg: "Lütfen bir galeri görseli seçin veya yükleyin." })
      return
    }

    startTransition(async () => {
      const res = await saveSingleGalleryAction(data)
      if (res.ok) {
        setStatus({ type: "ok", msg: "Galeri görseli başarıyla kaydedildi." })
        setIsDirty(false)
        router.push("/admin/website/galeri")
        router.refresh()
      } else {
        setStatus({ type: "err", msg: res.error })
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteSingleGalleryAction(data.id)
      if (res.ok) {
        setStatus({ type: "ok", msg: "Görsel silindi." })
        setDeleteConfirmOpen(false)
        router.push("/admin/website/galeri")
        router.refresh()
      } else {
        setStatus({ type: "err", msg: res.error })
      }
    })
  }

  return (
    <div className="space-y-3.5">
      {/* Sabit İşlem Üst Barı */}
      <div className="sticky top-14 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/website/galeri")}>
            <ArrowLeft className="mr-1 size-4" /> Galeriye Dön
          </Button>
          <div className="hidden items-center gap-2 sm:flex">
            <Badge variant={data.isActive ? "default" : "secondary"} className={data.isActive ? "bg-emerald-600" : ""}>
              {data.isActive ? "Yayında" : "Gizli"}
            </Badge>
            {isDirty ? <span className="text-xs text-amber-600 font-medium">● Değişiklikler var</span> : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isNew ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <Trash2 className="mr-1 size-4" /> Sil
            </Button>
          ) : null}
          <Button onClick={handleSave} disabled={pending} className="bg-emerald-600 hover:bg-emerald-700">
            <Save className="mr-1 size-4" /> {pending ? "Kaydediliyor..." : isNew ? "Oluştur & Kaydet" : "Değişiklikleri Kaydet"}
          </Button>
        </div>
      </div>

      <SaveStatusBanner status={status} />

      {/* DÜZENLEME FORMU */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sol Kolon: Görsel Yükleyici */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="size-4 text-emerald-600" /> Galeri Medyası
            </CardTitle>
            <CardDescription>Bilgisayarınızdan fotoğraf seçin veya medya kütüphanesi URL'i girin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DirectMediaPicker
              value={data.imageUrl}
              onChange={(url) => set({ imageUrl: url })}
              label="Galeri Görseli *"
              target={{ scope: "galeri", category: data.categoryId || (categories[0]?.id ?? "genel") }}
            />
          </CardContent>
        </Card>

        {/* Sağ Kolon: Başlık, Kategori & Durum */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Görsel Bilgileri & Kategori</CardTitle>
            <CardDescription>Görsel başlığı, alt metin ve kategori seçimi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Görsel Başlığı / Alt Metni</Label>
              <Input
                value={data.title}
                onChange={(e) => set({ title: e.target.value })}
                placeholder="Örn: Özel Isıtmalı Jakuzili Havuz"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Açıklama (Opsiyonel)</Label>
              <Input
                value={data.description}
                onChange={(e) => set({ description: e.target.value })}
                placeholder="Görsel hakkında kısa detay açıklaması..."
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Galeri Kategorisi</Label>
              <Select
                value={data.categoryId || (categories[0]?.id ?? "genel")}
                onValueChange={(v) => {
                   // If changing category and isFeatured is true, check if new category has space
                   if (data.isFeatured && categoryFeaturedStatus[v]) {
                      setStatus({ type: "err", msg: `Uyarı: Yeni seçilen kategoride ${GALLERY_FEATURED_LIMIT} vitrin görseli sınırı doludur. Kaydederken hata alabilirsiniz.` })
                   } else {
                      setStatus(null)
                   }
                   set({ categoryId: v })
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between border-t pt-4 dark:border-neutral-800">
              <div>
                <Label className="cursor-pointer font-medium text-xs flex items-center gap-1">
                  <Star className={`size-3.5 ${data.isFeatured ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                  Anasayfa Vitrininde Göster
                </Label>
                <p className="text-[11px] text-slate-400">Anasayfadaki galeri bloğunda çıkar (Kategori başına max {GALLERY_FEATURED_LIMIT}).</p>
              </div>
              <Switch
                checked={data.isFeatured}
                onCheckedChange={(v) => {
                   if (v && categoryFeaturedStatus[data.categoryId]) {
                      setStatus({ type: "err", msg: `Bu kategoride en fazla ${GALLERY_FEATURED_LIMIT} görsel vitrinde olabilir.` })
                   } else {
                      set({ isFeatured: v })
                   }
                }}
              />
            </div>

            <div className="flex items-center justify-between border-t pt-4 dark:border-neutral-800">
              <div>
                <Label className="cursor-pointer font-medium text-xs">Bu Görsel Yayında Olsun</Label>
                <p className="text-[11px] text-slate-400">Pasife alındığında galeri sayfasında gizlenir.</p>
              </div>
              <Switch
                checked={data.isActive}
                onCheckedChange={(v) => set({ isActive: v })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Silme Onay Modalı */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Görseli Sil</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Bu galeri görselini silmek istediğinizden emin misiniz? Değişikliği kaydettiğinizde galeriden kaldırılacaktır.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Vazgeç
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={pending}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}