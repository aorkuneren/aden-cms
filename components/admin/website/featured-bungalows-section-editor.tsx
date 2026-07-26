"use client"

import { useState, useTransition } from "react"
import { AlertTriangle, ExternalLink, House, Save } from "lucide-react"

import { saveFeaturedBungalowsSectionAction } from "@/app/admin/(panel)/website/actions"
import { SaveStatusBanner, type SaveStatus } from "@/components/admin/save-status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { PreviewBungalow } from "@/lib/admin/preview-data"

export type FeaturedBungalowsSectionData = {
  eyebrow: string
  title: string
  description: string
  emptyStateText: string
  limit: number
  autoplayEnabled: boolean
  autoplaySeconds: number
  pauseOnHover: boolean
  showDots: boolean
  loop: boolean
}

const LIMIT_OPTIONS = [3, 4, 5, 6, 8, 10, 12]
const AUTOPLAY_OPTIONS = [3, 4, 5, 6, 8, 10]

export function FeaturedBungalowsSectionEditor({
  initial,
  bungalows,
}: {
  initial: FeaturedBungalowsSectionData
  /** Yayındaki bungalovlar — site ile aynı sırada. */
  bungalows: PreviewBungalow[]
}) {
  const [data, setData] = useState<FeaturedBungalowsSectionData>(initial)
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<SaveStatus>(null)
  const [isDirty, setIsDirty] = useState(false)

  const set = (patch: Partial<FeaturedBungalowsSectionData>) => {
    setData((prev) => ({ ...prev, ...patch }))
    setIsDirty(true)
    setStatus(null)
  }

  const visible = bungalows.slice(0, data.limit)
  const notEnough = bungalows.length < data.limit

  const save = () =>
    startTransition(async () => {
      const res = await saveFeaturedBungalowsSectionAction(data)
      if (res.ok) {
        setStatus({ type: "ok", msg: "Bungalov vitrini kaydedildi ve anasayfaya yansıtıldı." })
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
            <House className="mr-1 size-3" /> Anasayfa · Bungalovlar
          </Badge>
          <span className="text-xs font-medium text-slate-500">{visible.length} kart yayında</span>
          {isDirty ? <span className="text-xs font-medium text-amber-600">● Değişiklikler var</span> : null}
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
            <a href="/#bungalovlar" target="_blank" rel="noreferrer">
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
            <CardDescription>Üst başlık, başlık ve açıklama.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Üst Başlık</Label>
              <Input
                value={data.eyebrow}
                onChange={(e) => set({ eyebrow: e.target.value })}
                placeholder="Bungalovlarımız"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Başlık</Label>
              <Input
                value={data.title}
                onChange={(e) => set({ title: e.target.value })}
                placeholder="Her İhtiyaca Uygun Suitlerimiz"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Açıklama</Label>
              <Textarea
                rows={5}
                value={data.description}
                onChange={(e) => set({ description: e.target.value })}
                placeholder="Bölüm açıklama metni..."
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Boş Durum Metni</Label>
              <Input
                value={data.emptyStateText}
                onChange={(e) => set({ emptyStateText: e.target.value })}
                placeholder="Şu anda yayında aktif bungalow bulunmuyor."
              />
              <p className="text-[11px] text-slate-400">
                Yayında gösterilecek bungalov kalmazsa kart yerine bu metin çıkar.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Carousel davranışı */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Carousel Davranışı</CardTitle>
            <CardDescription>Otomatik geçiş ve navigasyon ayarları.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border p-3 dark:border-neutral-800">
              <Switch
                checked={data.autoplayEnabled}
                onCheckedChange={(v) => set({ autoplayEnabled: v })}
              />
              <div>
                <Label className="cursor-pointer font-medium">Otomatik Kaydır</Label>
                <p className="text-xs text-slate-500">
                  Kapalıysa ziyaretçi yalnızca sürükleyerek veya noktalarla ilerler.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Kart Başına Süre</Label>
              <div className="flex flex-wrap gap-1.5">
                {AUTOPLAY_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    disabled={!data.autoplayEnabled}
                    onClick={() => set({ autoplaySeconds: option })}
                    className={`rounded-md border px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50 ${
                      data.autoplaySeconds === option
                        ? "border-emerald-600 bg-emerald-50 font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-slate-300"
                    }`}
                  >
                    {option} sn
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400">
                Erişilebilirlik açısından 5 saniyenin altına inmemeniz önerilir.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3 dark:border-neutral-800">
              <Switch
                checked={data.pauseOnHover}
                onCheckedChange={(v) => set({ pauseOnHover: v })}
                disabled={!data.autoplayEnabled}
              />
              <div>
                <Label className="cursor-pointer font-medium">Fare Üzerindeyken Durdur</Label>
                <p className="text-xs text-slate-500">
                  Ziyaretçi bir karta odaklandığında geçiş durur.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3 dark:border-neutral-800">
              <Switch checked={data.loop} onCheckedChange={(v) => set({ loop: v })} />
              <div>
                <Label className="cursor-pointer font-medium">Döngü</Label>
                <p className="text-xs text-slate-500">Son karttan sonra başa döner.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3 dark:border-neutral-800">
              <Switch checked={data.showDots} onCheckedChange={(v) => set({ showDots: v })} />
              <div>
                <Label className="cursor-pointer font-medium">Nokta Navigasyonu</Label>
                <p className="text-xs text-slate-500">Kartların altında sayfa noktaları görünür.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vitrine girecek kayıtlar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vitrine Girecek Kayıtlar</CardTitle>
          <CardDescription>Yayında {bungalows.length} aktif bungalov var.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Gösterilecek Adet</Label>
            <div className="flex flex-wrap gap-1.5">
              {LIMIT_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => set({ limit: option })}
                  className={`min-w-9 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                    data.limit === option
                      ? "border-emerald-600 bg-emerald-50 font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-slate-300"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              Öne çıkanlar önce gelir; kalan yerler ad sırasına göre doldurulur.
            </p>
          </div>

          {notEnough ? (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300/70 bg-amber-50 px-3 py-2.5 text-[11px] leading-4 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              <span>
                {data.limit} kart seçtiniz ama yayında yalnızca {bungalows.length} aktif bungalov
                var. Vitrinde {bungalows.length} kart görünecek.
              </span>
            </div>
          ) : null}

          <ol className="space-y-1.5">
            {visible.map((item, index) => (
              <li
                key={item.id}
                className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2 dark:border-neutral-800"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-bold text-slate-600 dark:bg-neutral-800 dark:text-slate-300">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                  {item.name}
                </span>
                {item.isFeatured ? (
                  <Badge className="h-5 bg-emerald-600 text-[10px] hover:bg-emerald-600">
                    Öne çıkan
                  </Badge>
                ) : null}
                {!item.image ? (
                  <span className="text-[10px] font-medium text-amber-600">görselsiz</span>
                ) : null}
              </li>
            ))}
            {visible.length === 0 ? (
              <li className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-[11px] text-slate-400 dark:border-neutral-700">
                Yayında aktif bungalov yok — bölüm boş durum metnini gösterir.
              </li>
            ) : null}
          </ol>

          <p className="text-[11px] leading-4 text-slate-400">
            Sıralama ve “öne çıkan” işareti{" "}
            <span className="font-medium text-slate-500 dark:text-slate-300">
              Katalog › Bungalovlar
            </span>{" "}
            sayfasından yönetilir.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
