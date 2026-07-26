"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { ExternalLink, Link as LinkIcon, MousePointerClick, Save } from "lucide-react"

import { saveSectionAction } from "@/app/admin/(panel)/sayfalar/actions"
import { CtaImagesUploader } from "@/components/admin/website/cta-images-uploader"
import { SaveStatusBanner, type SaveStatus } from "@/components/admin/save-status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

export type CtaSectionData = {
  eyebrow: string
  title: string
  description: string
  responseTitle: string
  responseDescription: string
  reservationButtonEnabled: boolean
  reservationButtonLabel: string
  reservationButtonHref: string
  phoneButtonEnabled: boolean
  phoneButtonPrefix: string
  imageUrl1: string
  imageUrl2: string
}

const RESERVATION_TARGETS = [
  { value: "/bungalovlarimiz", label: "Bungalovlarımız" },
  { value: "/iletisim", label: "İletişim" },
  { value: "/galeri", label: "Galeri" },
]

export function CtaSectionEditor({
  initial,
  companyPhone,
}: {
  initial: CtaSectionData
  /** Ayarlardaki telefon — boşsa telefon butonu sitede çizilmez. */
  companyPhone: string
}) {
  const [data, setData] = useState<CtaSectionData>(initial)
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<SaveStatus>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [showUrlInputs, setShowUrlInputs] = useState(false)

  const set = (patch: Partial<CtaSectionData>) => {
    setData((prev) => ({ ...prev, ...patch }))
    setIsDirty(true)
    setStatus(null)
  }

  const phoneMissing = data.phoneButtonEnabled && !companyPhone
  const activeButtons =
    (data.reservationButtonEnabled ? 1 : 0) + (data.phoneButtonEnabled && companyPhone ? 1 : 0)

  const save = () =>
    startTransition(async () => {
      const res = await saveSectionAction("ana-sayfa", "cta", {
        eyebrow: data.eyebrow,
        title: data.title,
        description: data.description,
        responseTitle: data.responseTitle,
        responseDescription: data.responseDescription,
        reservationButtonEnabled: data.reservationButtonEnabled ? "true" : "false",
        reservationButtonLabel: data.reservationButtonLabel,
        reservationButtonHref: data.reservationButtonHref,
        phoneButtonEnabled: data.phoneButtonEnabled ? "true" : "false",
        phoneButtonPrefix: data.phoneButtonPrefix,
        imageUrl1: data.imageUrl1,
        imageUrl2: data.imageUrl2,
      })
      if (res.ok) {
        setStatus({ type: "ok", msg: "CTA bölümü kaydedildi ve anasayfaya yansıtıldı." })
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
            <MousePointerClick className="mr-1 size-3" /> Anasayfa · CTA
          </Badge>
          <span
            className={
              activeButtons === 0
                ? "text-xs font-medium text-amber-600"
                : "text-xs font-medium text-slate-500"
            }
          >
            {activeButtons} aktif buton
          </span>
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
        {/* Metin */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Metin İçeriği</CardTitle>
            <CardDescription>Üst etiket, başlık ve çağrıyı destekleyen metin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Üst Etiket</Label>
              <Input
                value={data.eyebrow}
                onChange={(e) => set({ eyebrow: e.target.value })}
                placeholder="Rezervasyon"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Başlık</Label>
              <Input
                value={data.title}
                onChange={(e) => set({ title: e.target.value })}
                placeholder="Doğanın Kalbindeki Yerinizi Ayırtın"
              />
              <p className="text-[11px] text-slate-400">
                Eylem odaklı ve tek cümlelik bir çağrı en iyi sonucu verir.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Açıklama</Label>
              <Textarea
                rows={5}
                value={data.description}
                onChange={(e) => set({ description: e.target.value })}
                placeholder="Çağrıyı destekleyen kısa metin..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Butonlar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Butonlar</CardTitle>
            <CardDescription>Rezervasyon ve telefon çağrıları.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeButtons === 0 ? (
              <p className="rounded-lg border border-amber-300/70 bg-amber-50 px-3 py-2.5 text-[11px] leading-4 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
                Hiçbir buton görünmüyor — bu bölümün tek amacı dönüşüm almak. En az birini açmanız
                önerilir.
              </p>
            ) : null}

            <div className="space-y-3 rounded-lg border p-3 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <Switch
                  checked={data.reservationButtonEnabled}
                  onCheckedChange={(v) => set({ reservationButtonEnabled: v })}
                />
                <div>
                  <Label className="cursor-pointer font-medium">Rezervasyon Butonu</Label>
                  <p className="text-xs text-slate-500">Birincil, koyu yeşil buton.</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Buton Metni</Label>
                <Input
                  value={data.reservationButtonLabel}
                  onChange={(e) => set({ reservationButtonLabel: e.target.value })}
                  placeholder="Hızlı Rezervasyon"
                  disabled={!data.reservationButtonEnabled}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Hedef Adres</Label>
                <Input
                  value={data.reservationButtonHref}
                  onChange={(e) => set({ reservationButtonHref: e.target.value })}
                  placeholder="/bungalovlarimiz"
                  disabled={!data.reservationButtonEnabled}
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {RESERVATION_TARGETS.map((target) => (
                    <button
                      key={target.value}
                      type="button"
                      disabled={!data.reservationButtonEnabled}
                      onClick={() => set({ reservationButtonHref: target.value })}
                      className={`rounded-md border px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50 ${
                        data.reservationButtonHref === target.value
                          ? "border-emerald-600 bg-emerald-50 font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-slate-300"
                      }`}
                    >
                      {target.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-3 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <Switch
                  checked={data.phoneButtonEnabled}
                  onCheckedChange={(v) => set({ phoneButtonEnabled: v })}
                />
                <div>
                  <Label className="cursor-pointer font-medium">Telefon Butonu</Label>
                  <p className="text-xs text-slate-500">
                    Numara Sistem › Ayarlar ekranından gelir.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Telefon Ön Eki</Label>
                <Input
                  value={data.phoneButtonPrefix}
                  onChange={(e) => set({ phoneButtonPrefix: e.target.value })}
                  placeholder="Bizi Arayın:"
                  disabled={!data.phoneButtonEnabled}
                />
                {companyPhone ? (
                  <p className="text-[11px] text-slate-400">
                    Sitede şöyle görünür: “{data.phoneButtonPrefix} {companyPhone}”.
                  </p>
                ) : null}
              </div>

              {phoneMissing ? (
                <p className="flex flex-wrap items-center gap-1.5 rounded-lg border border-amber-300/70 bg-amber-50 px-3 py-2.5 text-[11px] leading-4 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
                  Ayarlarda telefon numarası tanımlı değil; buton sitede hiç çizilmez.
                  <Link
                    href="/admin/ayarlar"
                    className="inline-flex items-center gap-1 font-semibold underline underline-offset-2"
                  >
                    Ayarlara git <ExternalLink className="size-3" />
                  </Link>
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dönüş kartı */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dönüş Kartı</CardTitle>
          <CardDescription>Görsellerin sağ altındaki küçük güven kutusu.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Başlık</Label>
            <Input
              value={data.responseTitle}
              onChange={(e) => set({ responseTitle: e.target.value })}
              placeholder="Hızlı Dönüş"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Açıklama</Label>
            <Textarea
              rows={3}
              value={data.responseDescription}
              onChange={(e) => set({ responseDescription: e.target.value })}
              placeholder="Rezervasyon taleplerine aynı gün içinde geri dönüş sağlıyoruz."
            />
          </div>
        </CardContent>
      </Card>

      {/* Görseller */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Görseller</CardTitle>
          <CardDescription>
            Kartlar sitedeki yerleşimin aynısı. Bir karta tıklayarak ya da üzerine sürükleyerek
            görsel yükleyin; boş bırakılan kart Hakkımızda ve galeri havuzundan doldurulur.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <CtaImagesUploader
            imageUrl1={data.imageUrl1}
            imageUrl2={data.imageUrl2}
            responseTitle={data.responseTitle}
            responseDescription={data.responseDescription}
            onChange={(field, url) => set({ [field]: url } as Partial<CtaSectionData>)}
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
              {(["imageUrl1", "imageUrl2"] as const).map((key, index) => (
                <div key={key} className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-500">
                    Görsel {index + 1}
                  </Label>
                  <Input
                    value={data[key]}
                    onChange={(e) => set({ [key]: e.target.value } as Partial<CtaSectionData>)}
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
