"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Save,
  ArrowLeft,
  Trash2,
  Sparkles,
  ExternalLink,
} from "lucide-react"

import { type CmsWhyAdenItem } from "@/lib/site/website-cms-types"
import { saveSingleWhyAdenAction, deleteSingleWhyAdenAction } from "@/app/admin/(panel)/website/actions"
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
import { LucideIcon } from "@/components/admin/lucide-icon"
import { SaveStatusBanner, type SaveStatus } from "@/components/admin/save-status"
import { DirectMediaPicker } from "@/components/admin/direct-media-picker"

const POPULAR_ICONS = [
  "Sparkles",
  "Waves",
  "ShieldCheck",
  "Flame",
  "Wifi",
  "Trees",
  "Heart",
  "MapPin",
  "Car",
  "Coffee",
  "Lock",
  "Award",
  "Smile",
  "Star",
  "Sun",
  "Activity",
  "CheckCircle2",
]

function IconPreview({ name }: { name: string }) {
  return <LucideIcon name={name} className="size-6 text-emerald-600 dark:text-emerald-400" />
}

export function WhyAdenItemForm({ initial, isNew }: { initial: CmsWhyAdenItem; isNew: boolean }) {
  const router = useRouter()
  const [data, setData] = useState<CmsWhyAdenItem>(initial)
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<SaveStatus>(null)
  const [isDirty, setIsDirty] = useState(false)

  // Silme Onay Modalı
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const set = (patch: Partial<CmsWhyAdenItem>) => {
    setData((prev) => ({ ...prev, ...patch }))
    setIsDirty(true)
    setStatus(null)
  }

  const handleSave = () => {
    startTransition(async () => {
      const res = await saveSingleWhyAdenAction(data)
      if (res.ok) {
        setStatus({ type: "ok", msg: "Özellik kartı başarıyla kaydedildi." })
        setIsDirty(false)
        router.push("/admin/website/neden-aden")
        router.refresh()
      } else {
        setStatus({ type: "err", msg: res.error })
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteSingleWhyAdenAction(data.id)
      if (res.ok) {
        setStatus({ type: "ok", msg: "Özellik silindi." })
        setDeleteConfirmOpen(false)
        router.push("/admin/website/neden-aden")
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
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/website/neden-aden")}>
            <ArrowLeft className="mr-1 size-4" /> Avantaj Listesine Dön
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

      {/* ÖZELLİK DÜZENLEME FORMU */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sol Kolon: İkon & Metinler */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Özellik & İkon Bilgileri</CardTitle>
            <CardDescription>Kart ikonunu, başlığını ve açıklamasını belirleyin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* İkon Seçici */}
            <div className="space-y-3 rounded-xl border p-4 bg-slate-50/50 dark:bg-neutral-900/50 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-10 items-center justify-center rounded-lg border bg-white shadow-xs dark:bg-neutral-800">
                    <IconPreview name={data.icon} />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Özellik İkonu</Label>
                    <p className="text-[11px] text-slate-500">Lucide ikon adını seçin veya girin.</p>
                  </div>
                </div>
                <a
                  href="https://lucide.dev/icons/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-600 hover:underline flex items-center"
                >
                  Tüm İkonlar <ExternalLink className="ml-1 size-3" />
                </a>
              </div>

              <Input
                value={data.icon}
                onChange={(e) => set({ icon: e.target.value })}
                placeholder="Sparkles, Waves, ShieldCheck..."
                className="text-xs font-mono"
              />

              {/* Popüler İkonlar Çip Paleti */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {POPULAR_ICONS.map((iconName) => {
                  const isSelected = data.icon === iconName
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => set({ icon: iconName })}
                      className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs border transition-colors ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-semibold"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-slate-300"
                      }`}
                      title={iconName}
                    >
                      <LucideIcon name={iconName} className="size-3.5" />
                      <span>{iconName}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Özellik Başlığı *</Label>
              <Input
                value={data.title}
                onChange={(e) => set({ title: e.target.value })}
                placeholder="Örn: Özel Isıtmalı Havuz"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Açıklama Metni (Opsiyonel)</Label>
              <Textarea
                rows={4}
                value={data.description}
                onChange={(e) => set({ description: e.target.value })}
                placeholder="Tesis avantajı hakkında açıklama metni..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Sağ Kolon: Görsel & Yayın Durumu */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Görsel & Yayın Yapılandırması</CardTitle>
            <CardDescription>Özellik kartı için opsiyonel kapak fotoğrafı ve yayın ayarı.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DirectMediaPicker
              value={data.imageUrl}
              onChange={(url) => set({ imageUrl: url })}
              label="Özellik Kapak Fotoğrafı (Opsiyonel)"
              target={{ scope: "neden-aden" }}
            />

            <div className="flex items-center gap-3 pt-4 border-t dark:border-neutral-800">
              <Switch checked={data.isActive} onCheckedChange={(v) => set({ isActive: v })} />
              <div>
                <Label className="cursor-pointer font-medium">Bu Özellik Yayında Olsun</Label>
                <p className="text-xs text-slate-500">Pasife alındığında anasayfa vitrininden kaldırılır.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Silme Onay Modalı */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Özelliği Sil</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Bu özellik kartını silmek istediğinizden emin misiniz? Değişikliği kaydettiğinizde anasayfadan tamamen kaldırılacaktır.
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
