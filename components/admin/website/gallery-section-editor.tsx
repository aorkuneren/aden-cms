"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { ExternalLink, Images, Save } from "lucide-react"

import { saveSectionAction } from "@/app/admin/(panel)/sayfalar/actions"
import { SaveStatusBanner, type SaveStatus } from "@/components/admin/save-status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { GalleryCategoryContent } from "@/lib/site/gallery-content"

export type GallerySectionData = {
  eyebrow: string
  title: string
  description: string
  maxImagesPerCategory: number
  showViewAllButton: boolean
  viewAllLabel: string
}

const LIMIT_OPTIONS = [3, 4, 5, 6, 8, 10, 12]

export function GallerySectionEditor({
  initial,
  categories,
}: {
  initial: GallerySectionData
  /** Sitede görünecek gerçek kategori/görsel dağılımı. */
  categories: GalleryCategoryContent[]
}) {
  const [data, setData] = useState<GallerySectionData>(initial)
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<SaveStatus>(null)
  const [isDirty, setIsDirty] = useState(false)

  const set = (patch: Partial<GallerySectionData>) => {
    setData((prev) => ({ ...prev, ...patch }))
    setIsDirty(true)
    setStatus(null)
  }

  const totalImages = categories.reduce((sum, category) => sum + category.images.length, 0)
  const shownImages = categories.reduce(
    (sum, category) => sum + Math.min(category.images.length, data.maxImagesPerCategory),
    0
  )

  const save = () =>
    startTransition(async () => {
      const res = await saveSectionAction("ana-sayfa", "gallery", {
        eyebrow: data.eyebrow,
        title: data.title,
        description: data.description,
        maxImagesPerCategory: String(data.maxImagesPerCategory),
        showViewAllButton: data.showViewAllButton ? "true" : "false",
        viewAllLabel: data.viewAllLabel,
      })
      if (res.ok) {
        setStatus({ type: "ok", msg: "Galeri bölümü kaydedildi ve anasayfaya yansıtıldı." })
        setIsDirty(false)
      } else {
        setStatus({ type: "err", msg: res.error })
      }
    })

  return (
    <div className="space-y-4">
      {/* Sabit İşlem Üst Barı */}
      <div className="sticky top-14 z-20 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-2xs backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="h-6 border-emerald-200 bg-emerald-50 text-[11px] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          >
            <Images className="mr-1 size-3" /> Anasayfa · Galeri
          </Badge>
          <span className="text-xs font-medium text-slate-500">
            {categories.length} sekme · {shownImages}/{totalImages} görsel
          </span>
          {isDirty ? <span className="text-xs font-medium text-amber-600">● Değişiklikler var</span> : null}
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
            <a href="/#galeri" target="_blank" rel="noreferrer">
              <ExternalLink className="mr-1 size-3.5" /> Siteyi Aç
            </a>
          </Button>
          <Button
            onClick={save}
            disabled={pending}
            size="sm"
            className="h-8 bg-emerald-600 text-xs hover:bg-emerald-700"
          >
            <Save className="mr-1 size-3.5" /> {pending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </div>

      <SaveStatusBanner status={status} />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Metin */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Metin İçeriği</CardTitle>
            <CardDescription>Üst etiket, başlık ve açıklama.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Üst Etiket</Label>
              <Input
                value={data.eyebrow}
                onChange={(e) => set({ eyebrow: e.target.value })}
                placeholder="Galeri"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Başlık</Label>
              <Input
                value={data.title}
                onChange={(e) => set({ title: e.target.value })}
                placeholder="Göz Atın: Cennetten Bir Köşe"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Açıklama</Label>
              <Textarea
                rows={5}
                value={data.description}
                onChange={(e) => set({ description: e.target.value })}
                placeholder="Galeri bölümünün tanıtım metni..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Izgara davranışı */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Izgara Davranışı</CardTitle>
            <CardDescription>Kategori başına kaç görsel gösterileceği.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Kategori Başına Görsel</Label>
              <div className="flex flex-wrap gap-1.5">
                {LIMIT_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => set({ maxImagesPerCategory: option })}
                    className={`min-w-9 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                      data.maxImagesPerCategory === option
                        ? "border-emerald-600 bg-emerald-50 font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-slate-300"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400">
                Mozaik desen 5’li tekrar eder; 5 veya 10 en dengeli görünümü verir.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3 dark:border-neutral-800">
              <Switch
                checked={data.showViewAllButton}
                onCheckedChange={(v) => set({ showViewAllButton: v })}
              />
              <div>
                <Label className="cursor-pointer font-medium">“Tümünü Görüntüle” Butonu</Label>
                <p className="text-xs text-slate-500">Ziyaretçiyi /galeri sayfasına yönlendirir.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Buton Metni</Label>
              <Input
                value={data.viewAllLabel}
                onChange={(e) => set({ viewAllLabel: e.target.value })}
                placeholder="Tümünü Görüntüle"
                disabled={!data.showViewAllButton}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Yayındaki kategoriler */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Yayındaki Kategoriler</CardTitle>
            <CardDescription>Görseller ayrı bir ekrandan yönetilir.</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="h-8 shrink-0 text-xs">
            <Link href="/admin/website/galeri">
              Görselleri Yönet <ExternalLink className="ml-1 size-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {categories.length === 0 ? (
            <p className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-3 text-[11px] leading-4 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
              Yayında görsel bulunmuyor. Galeri bölümü sitede boş görünecek — önce görsel yükleyin.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {categories.map((category) => {
                const shown = Math.min(category.images.length, data.maxImagesPerCategory)
                const hidden = category.images.length - shown
                return (
                  <li
                    key={category.id}
                    className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2 dark:border-neutral-800"
                  >
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                      {category.label}
                    </span>
                    <span className="tabular-nums text-[11px] text-slate-500">{shown} görsel</span>
                    {hidden > 0 ? (
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-neutral-800 dark:text-slate-400">
                        +{hidden} gizli
                      </span>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
          <p className="text-[11px] leading-4 text-slate-400">
            Anasayfa önce “vitrin” işaretli görselleri kullanır; hiç yoksa kategorideki diğer aktif
            görsellerden en fazla 5 tanesine düşer.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
