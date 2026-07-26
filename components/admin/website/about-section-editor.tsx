"use client"

import { useState, useTransition } from "react"
import { ExternalLink, Info, Link as LinkIcon, Save } from "lucide-react"

import { saveAboutSectionAction } from "@/app/admin/(panel)/website/actions"
import {
  AboutCollageUploader,
  type CollageValues,
} from "@/components/admin/website/about-collage-uploader"
import { SaveStatusBanner, type SaveStatus } from "@/components/admin/save-status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

export type AboutSectionData = {
  eyebrow: string
  title: string
  description: string
  imageUrl1: string
  imageUrl2: string
  imageUrl3: string
  imageUrl4: string
  buttonLabel: string
  buttonHref: string
  buttonVisible: boolean
}

type ImageKey = "imageUrl1" | "imageUrl2" | "imageUrl3" | "imageUrl4"

/** Sıra, sitedeki collage kartlarının sırasıyla birebir aynı. */
const IMAGE_KEYS: ImageKey[] = ["imageUrl1", "imageUrl2", "imageUrl3", "imageUrl4"]

const BUTTON_TARGETS = [
  { value: "/kurumsal/hakkimizda", label: "Kurumsal · Hakkımızda" },
  { value: "/kurumsal", label: "Kurumsal" },
  { value: "/galeri", label: "Galeri" },
  { value: "/iletisim", label: "İletişim" },
]

export function AboutSectionEditor({ initial }: { initial: AboutSectionData }) {
  const [data, setData] = useState<AboutSectionData>(initial)
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<SaveStatus>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [showUrlInputs, setShowUrlInputs] = useState(false)

  const set = (patch: Partial<AboutSectionData>) => {
    setData((prev) => ({ ...prev, ...patch }))
    setIsDirty(true)
    setStatus(null)
  }

  const collageValues = IMAGE_KEYS.map((key) => data[key]) as CollageValues
  const filledImages = collageValues.filter((url) => url.trim()).length

  const save = () =>
    startTransition(async () => {
      const res = await saveAboutSectionAction(data)
      if (res.ok) {
        setStatus({ type: "ok", msg: "Hakkımızda alanı kaydedildi ve anasayfaya yansıtıldı." })
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
            <Info className="mr-1 size-3" /> Anasayfa · Hakkımızda
          </Badge>
          <span className="text-xs font-medium text-slate-500">{filledImages}/4 görsel</span>
          {isDirty ? <span className="text-xs font-medium text-amber-600">● Değişiklikler var</span> : null}
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
            <a href="/" target="_blank" rel="noreferrer">
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
        {/* Metin İçeriği */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Metin İçeriği</CardTitle>
            <CardDescription>Üst etiket, başlık ve tanıtım metni.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Üst Etiket</Label>
              <Input
                value={data.eyebrow}
                onChange={(e) => set({ eyebrow: e.target.value })}
                placeholder="Hakkımızda"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Başlık</Label>
              <Input
                value={data.title}
                onChange={(e) => set({ title: e.target.value })}
                placeholder="Doğanın Kalbindeki Eviniz"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Açıklama Metni</Label>
              <Textarea
                rows={9}
                value={data.description}
                onChange={(e) => set({ description: e.target.value })}
                placeholder="Tesis hakkında kısa tanıtım metni..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Buton Ayarları */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Buton Ayarları</CardTitle>
            <CardDescription>Metin bloğunun altındaki yönlendirme butonu.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border p-3 dark:border-neutral-800">
              <Switch
                checked={data.buttonVisible}
                onCheckedChange={(v) => set({ buttonVisible: v })}
              />
              <div>
                <Label className="cursor-pointer font-medium">Buton Yayında Olsun</Label>
                <p className="text-xs text-slate-500">
                  Kapalıyken metin bloğu butonsuz görünür.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Buton Metni</Label>
              <Input
                value={data.buttonLabel}
                onChange={(e) => set({ buttonLabel: e.target.value })}
                placeholder="Devamını oku"
                disabled={!data.buttonVisible}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Hedef Adres</Label>
              <Input
                value={data.buttonHref}
                onChange={(e) => set({ buttonHref: e.target.value })}
                placeholder="/kurumsal/hakkimizda"
                disabled={!data.buttonVisible}
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {BUTTON_TARGETS.map((target) => (
                  <button
                    key={target.value}
                    type="button"
                    disabled={!data.buttonVisible}
                    onClick={() => set({ buttonHref: target.value })}
                    className={`rounded-md border px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50 ${
                      data.buttonHref === target.value
                        ? "border-emerald-600 bg-emerald-50 font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-slate-300"
                    }`}
                  >
                    {target.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400">
                Site içi bir yol (/ ile başlar) veya tam bir https:// adresi yazabilirsiniz.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Görsel Collage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Görsel Collage (4 Slot)</CardTitle>
          <CardDescription>
            Kartlar sitedeki yerleşimin aynısı. Bir karta tıklayarak ya da üzerine sürükleyerek
            görsel yükleyin. Boş bırakılan kart yerine site, galeri havuzundaki ilk uygun görseli
            kullanır — bölüm hiçbir zaman boş kalmaz.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <AboutCollageUploader
            values={collageValues}
            onChange={(index, url) =>
              set({ [IMAGE_KEYS[index]]: url } as Partial<AboutSectionData>)
            }
          />

          <button
            type="button"
            onClick={() => setShowUrlInputs((current) => !current)}
            className="inline-flex items-center text-[11px] text-slate-500 transition-colors hover:text-slate-700 dark:hover:text-slate-300"
          >
            <LinkIcon className="mr-1 size-3" />
            {showUrlInputs ? "URL Girişini Gizle" : "URL Adresi Gir"}
          </button>

          {showUrlInputs ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {IMAGE_KEYS.map((key, index) => (
                <div key={key} className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-500">
                    Görsel {index + 1}
                  </Label>
                  <Input
                    value={data[key]}
                    onChange={(e) => set({ [key]: e.target.value } as Partial<AboutSectionData>)}
                    placeholder="https://... görsel adresi"
                    className="h-8 text-xs"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
