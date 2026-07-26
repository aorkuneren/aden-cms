"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Save,
  ArrowLeft,
  Trash2,
  Sparkles,
  Eye,
  Monitor,
  Smartphone,
  FolderOpen,
  ImageOff,
  Video,
  CheckCircle2,
  ExternalLink,
} from "lucide-react"

import { type CmsSliderItem } from "@/lib/site/website-cms-types"
import { saveSingleSliderAction, deleteSingleSliderAction } from "@/app/admin/(panel)/website/actions"
import { DirectMediaPicker } from "@/components/admin/direct-media-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { SaveStatusBanner, type SaveStatus } from "@/components/admin/save-status"

export function SliderItemForm({ initial, isNew }: { initial: CmsSliderItem; isNew: boolean }) {
  const router = useRouter()
  const [data, setData] = useState<CmsSliderItem>(initial)
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<SaveStatus>(null)
  const [isDirty, setIsDirty] = useState(false)

  // Canlı Simülatör Cihaz Modu
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop")

  // Silme Onay Modalı
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const [tagInput, setTagInput] = useState<string>(() => (initial.tags || []).join(", "))

  const set = (patch: Partial<CmsSliderItem>) => {
    setData((prev) => ({ ...prev, ...patch }))
    setIsDirty(true)
    setStatus(null)
  }

  const handleTagsChange = (rawText: string) => {
    setTagInput(rawText)
    const parsedTags = rawText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    set({ tags: parsedTags })
  }

  const handleSave = () => {
    startTransition(async () => {
      const res = await saveSingleSliderAction(data)
      if (res.ok) {
        setStatus({ type: "ok", msg: "Slayt başarıyla kaydedildi ve siteye yansıtıldı." })
        setIsDirty(false)
        router.push("/admin/website/slider")
        router.refresh()
      } else {
        setStatus({ type: "err", msg: res.error })
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteSingleSliderAction(data.id)
      if (res.ok) {
        setStatus({ type: "ok", msg: "Slayt silindi." })
        setDeleteConfirmOpen(false)
        router.push("/admin/website/slider")
        router.refresh()
      } else {
        setStatus({ type: "err", msg: res.error })
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Sabit İşlem Barı */}
      <div className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/website/slider")}>
            <ArrowLeft className="mr-1 size-4" /> Slayt Listesine Dön
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

      {/* BU SLAYTA ÖZEL CANLI HERO PREVIEW SİMÜLATÖRÜ */}
      <Card className="overflow-hidden border-2 border-emerald-500/30 bg-slate-950 text-white shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 p-4">
          <div className="flex items-center gap-2">
            <Eye className="size-4 text-emerald-400" />
            <CardTitle className="text-sm font-semibold text-white">
              Bu Slayta Özel Canlı Hero Simülasyonu
            </CardTitle>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1">
            <button
              type="button"
              onClick={() => setPreviewDevice("desktop")}
              className={`rounded p-1 text-xs transition-colors ${
                previewDevice === "desktop" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
              }`}
              title="Masaüstü (16:9)"
            >
              <Monitor className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice("mobile")}
              className={`rounded p-1 text-xs transition-colors ${
                previewDevice === "mobile" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
              }`}
              title="Mobil (9:16)"
            >
              <Smartphone className="size-3.5" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div
            className={`relative mx-auto flex items-center justify-center overflow-hidden transition-all duration-300 ${
              previewDevice === "desktop" ? "aspect-[21/9] w-full" : "aspect-[9/14] max-w-sm py-8"
            }`}
          >
            {/* Arka Plan Medyası */}
            {data.mediaType === "VIDEO" && data.videoUrl ? (
              <video src={data.videoUrl} autoPlay loop muted playsInline className="absolute inset-0 size-full object-cover" />
            ) : data.imageUrl ? (
              <Image src={data.imageUrl} alt={data.title || "Slayt Görseli"} fill sizes="1200px" className="object-cover" unoptimized />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-slate-600">
                <ImageOff className="size-12" />
              </div>
            )}

            {/* Dynamic Overlay Gradient */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"
              style={{ opacity: (data.overlayOpacity ?? 50) / 100 }}
            />

            {/* İçerik Katmanı */}
            <div className="relative z-10 mx-auto max-w-2xl px-6 text-center space-y-3">
              {data.badgeText ? (
                <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 backdrop-blur border border-emerald-500/30">
                  <Sparkles className="mr-1 size-3 text-emerald-400" />
                  {data.badgeText}
                </span>
              ) : null}

              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl drop-shadow-md">
                {data.title || "Slayt Başlığı Buraya Gelir"}
              </h2>

              <p className="line-clamp-2 text-xs text-slate-300 sm:text-sm max-w-xl mx-auto">
                {data.description || "Slayt açıklama ve detay alt başlığı..."}
              </p>

              {data.tags && data.tags.length > 0 ? (
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                  {data.tags.map((t, idx) => (
                    <span key={idx} className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-slate-200 backdrop-blur">
                      #{t}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {data.buttonText ? (
                  <span className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur">
                    {data.buttonText}
                  </span>
                ) : null}
                {data.secondaryButtonText ? (
                  <span className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur">
                    {data.secondaryButtonText}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DÜZENLEME FORM KARTLARI */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sol Kolon: Medya & Görünüm */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Medya & Arka Plan Yapılandırması</CardTitle>
            <CardDescription>Slayt görseli, video bağlantısı ve arka plan karartma ayarları.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Medya Tipi</Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="mediaType"
                    checked={data.mediaType !== "VIDEO"}
                    onChange={() => set({ mediaType: "IMAGE" })}
                  />
                  Görsel Fotoğraf
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="mediaType"
                    checked={data.mediaType === "VIDEO"}
                    onChange={() => set({ mediaType: "VIDEO" })}
                  />
                  Video (MP4 / WebM)
                </label>
              </div>
            </div>

            {data.mediaType === "VIDEO" ? (
              <DirectMediaPicker
                value={data.videoUrl || ""}
                onChange={(url) => set({ videoUrl: url })}
                label="Video Yükle (MP4 / WebM)"
                accept="video/*"
                placeholder="https://.../video.mp4 veya doğrudan yükleyin"
                target={{ scope: "slider" }}
              />
            ) : (
              <DirectMediaPicker
                value={data.imageUrl}
                onChange={(url) => set({ imageUrl: url })}
                label="Slayt Fotoğrafı Yükle veya Seç"
                accept="image/*"
                placeholder="https://.../hero.jpg veya doğrudan yükleyin"
                target={{ scope: "slider" }}
              />
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Arka Plan Karartma (Overlay Opacity): %{data.overlayOpacity ?? 50}</Label>
              </div>
              <input
                type="range"
                min={0}
                max={90}
                step={5}
                value={data.overlayOpacity ?? 50}
                onChange={(e) => set({ overlayOpacity: Number(e.target.value) })}
                className="w-full accent-emerald-600"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Fırsat Rozeti Metni (Badge)</Label>
              <Input
                value={data.badgeText || ""}
                onChange={(e) => set({ badgeText: e.target.value })}
                placeholder="Örn: %15 Erken Rezervasyon Fırsatı"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Switch checked={data.isActive} onCheckedChange={(v) => set({ isActive: v })} />
              <div>
                <Label className="cursor-pointer">Bu Slayt Yayında</Label>
                <p className="text-xs text-slate-500">Pasife alındığında anasayfada gösterilmez.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sağ Kolon: Başlık, Açıklama & Butonlar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">İçerik & Buton Yapılandırması</CardTitle>
            <CardDescription>Başlık, açıklama metni ve aksiyon (CTA) butonları.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Ana Başlık *</Label>
              <Input
                value={data.title}
                onChange={(e) => set({ title: e.target.value })}
                placeholder="Sapanca Doğasında Lüks Konaklama"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Açıklama Metni</Label>
              <Textarea
                rows={3}
                value={data.description}
                onChange={(e) => set({ description: e.target.value })}
                placeholder="Bungalov ve konaklama hakkında açıklama yazısı..."
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>1. Buton Metni (Birincil CTA)</Label>
                <Input
                  value={data.buttonText || ""}
                  onChange={(e) => set({ buttonText: e.target.value })}
                  placeholder="Bungalovları Keşfet"
                />
              </div>
              <div className="space-y-1.5">
                <Label>1. Buton URL</Label>
                <Input
                  value={data.buttonUrl || ""}
                  onChange={(e) => set({ buttonUrl: e.target.value })}
                  placeholder="/bungalovlarimiz"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>2. Buton Metni (İkincil CTA)</Label>
                <Input
                  value={data.secondaryButtonText || ""}
                  onChange={(e) => set({ secondaryButtonText: e.target.value })}
                  placeholder="WhatsApp İletişim"
                />
              </div>
              <div className="space-y-1.5">
                <Label>2. Buton URL</Label>
                <Input
                  value={data.secondaryButtonUrl || ""}
                  onChange={(e) => set({ secondaryButtonUrl: e.target.value })}
                  placeholder="https://wa.me/..."
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Etiketler (virgülle ayırın)</Label>
              <Input
                value={tagInput}
                onChange={(e) => handleTagsChange(e.target.value)}
                placeholder="Sapanca, Isıtmalı Havuz, Jakuzi"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Silme Onay Modalı */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slaytı Sil</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Bu slaytı silmek istediğinizden emin misiniz? İşlem kaydedildiğinde anasayfa hero alanından tamamen kaldırılacaktır.
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
