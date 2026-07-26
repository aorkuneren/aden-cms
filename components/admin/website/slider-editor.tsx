"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Pencil,
  Copy,
  ImageOff,
  Video,
  Sparkles,
  Save,
  Settings2,
  Timer,
} from "lucide-react"

import { type CmsSliderItem } from "@/lib/site/website-cms-types"
import {
  saveSliderAction,
  deleteSingleSliderAction,
  saveSingleSliderAction,
  saveSliderSettingsAction,
} from "@/app/admin/(panel)/website/actions"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { SaveStatusBanner, type SaveStatus } from "@/components/admin/save-status"

export type SliderItem = CmsSliderItem

export type SliderSettings = {
  autoplayEnabled: boolean
  autoplaySeconds: number
  pauseOnHover: boolean
}

const AUTOPLAY_OPTIONS = [3, 4, 5, 6, 7, 8, 10, 12, 15]

export function SliderEditor({ initial, settings: initialSettings }: { initial: SliderItem[]; settings: SliderSettings }) {
  const router = useRouter()
  const [items, setItems] = useState<SliderItem[]>(initial)
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<SaveStatus>(null)

  // Silme Onay Modalı
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Slider Ayarları Modalı
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<SliderSettings>(initialSettings)
  const [savingSettings, startSavingSettings] = useTransition()

  const saveSettings = () =>
    startSavingSettings(async () => {
      const res = await saveSliderSettingsAction(settings)
      if (res.ok) {
        setStatus({ type: "ok", msg: "Slider ayarları kaydedildi ve siteye yansıtıldı." })
        setSettingsOpen(false)
        router.refresh()
      } else {
        setStatus({ type: "err", msg: res.error })
      }
    })

  const handleDuplicate = (item: SliderItem) => {
    const copy: SliderItem = {
      ...item,
      id: `slider-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: `${item.title} (Kopya)`,
    }

    startTransition(async () => {
      const res = await saveSingleSliderAction(copy)
      if (res.ok) {
        setItems((prev) => [...prev, copy])
        setStatus({ type: "ok", msg: "Slayt kopyalandı." })
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
      const res = await saveSliderAction(next)
      if (res.ok) {
        setStatus({ type: "ok", msg: "Slayt sırası kaydedildi." })
      } else {
        setStatus({ type: "err", msg: res.error })
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteSingleSliderAction(id)
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== id))
        setStatus({ type: "ok", msg: "Slayt silindi." })
        setDeleteId(null)
        router.refresh()
      } else {
        setStatus({ type: "err", msg: res.error })
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Sabit Aksiyon Barı */}
      <div className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <Sparkles className="mr-1 size-3" /> Süper Slider Izgara Listesi
          </Badge>
          <span className="text-xs font-medium text-slate-500">{items.length} Slayt Hazır</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>
            <Settings2 className="mr-1 size-4" /> Slider Ayarları
          </Button>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/admin/website/slider/yeni">
              <Plus className="mr-1 size-4" /> Yeni Slayt Ekle
            </Link>
          </Button>
        </div>
      </div>

      {/* Slider Ayarları Modalı */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="size-4" /> Slider Ayarları
            </DialogTitle>
            <DialogDescription>
              Anasayfa hero slaytlarının otomatik geçiş davranışını yönetin. Değişiklikler kaydedildiğinde siteye yansır.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 dark:border-neutral-800">
              <div>
                <Label className="text-sm font-medium">Otomatik geçiş</Label>
                <p className="text-xs text-slate-500">Kapalıysa slaytlar yalnızca elle (noktalar) değişir.</p>
              </div>
              <Switch
                checked={settings.autoplayEnabled}
                onCheckedChange={(v) => setSettings((s) => ({ ...s, autoplayEnabled: v }))}
              />
            </div>

            <div className={`space-y-1.5 ${settings.autoplayEnabled ? "" : "pointer-events-none opacity-50"}`}>
              <Label className="flex items-center gap-1.5 text-sm">
                <Timer className="size-3.5" /> Otomatik süre (saniye)
              </Label>
              <Select
                value={String(settings.autoplaySeconds)}
                onValueChange={(v) => setSettings((s) => ({ ...s, autoplaySeconds: Number(v) }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AUTOPLAY_OPTIONS.map((sec) => (
                    <SelectItem key={sec} value={String(sec)}>{sec} saniye</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">Her slaytın ekranda kalma süresi.</p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 dark:border-neutral-800">
              <div>
                <Label className="text-sm font-medium">Fare üzerindeyken durdur</Label>
                <p className="text-xs text-slate-500">Ziyaretçi slaytın üzerine gelince geçiş durur.</p>
              </div>
              <Switch
                checked={settings.pauseOnHover}
                onCheckedChange={(v) => setSettings((s) => ({ ...s, pauseOnHover: v }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)} disabled={savingSettings}>Vazgeç</Button>
            <Button onClick={saveSettings} disabled={savingSettings} className="bg-emerald-600 hover:bg-emerald-700">
              <Save className="mr-1 size-4" /> {savingSettings ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SaveStatusBanner status={status} />

      {/* GRID SISTEMI ILE SLIDER LISTESI */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-500">
            Henüz slider bulunmuyor. “Yeni Slayt Ekle” butonuna tıklayarak yeni sayfada yeni bir slayt oluşturabilirsiniz.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <Card
              key={item.id}
              className="group relative overflow-hidden transition-all duration-200 py-0 gap-2 hover:border-emerald-500/50 hover:shadow-md dark:hover:border-emerald-500/50"
            >
              {/* Medya Önizleme Görseli / Video Kartı */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-neutral-800">
                {item.mediaType === "VIDEO" && item.videoUrl ? (
                  <div className="relative flex h-full items-center justify-center bg-slate-900 text-white">
                    <video src={item.videoUrl} className="h-full w-full object-cover opacity-60" />
                    <Badge className="absolute left-3 top-3 bg-purple-600 text-white shadow">
                      <Video className="mr-1 size-3" /> MP4 Video
                    </Badge>
                  </div>
                ) : item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title || "Slider Görseli"}
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

                {/* Slayt Sıra Numarası ve Yayın Rozeti */}
                <Badge variant="secondary" className="absolute left-3 top-3 bg-white/90 text-slate-800 backdrop-blur">
                  #{index + 1}
                </Badge>
                <Badge
                  variant={item.isActive ? "default" : "secondary"}
                  className={`absolute right-3 top-3 ${item.isActive ? "bg-emerald-600" : ""}`}
                >
                  {item.isActive ? "Yayında" : "Gizli"}
                </Badge>
              </div>

              {/* Slayt Kart Bilgileri */}
              <CardContent className="px-2.5 pb-2.5 pt-0 gap-2 flex flex-col">
                {item.badgeText ? (
                  <span className="inline-flex items-center text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="mr-1 size-3" /> {item.badgeText}
                  </span>
                ) : null}

                <div>
                  <h3 className="truncate font-semibold text-slate-900 dark:text-white" title={item.title}>
                    {item.title || "İsimsiz Slayt"}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                    {item.description || "Açıklama belirtilmedi."}
                  </p>
                </div>

                {/* Sıralama ve Aksiyon Butonları */}
                <div className="flex items-center justify-between border-t pt-3 dark:border-neutral-800">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleMove(index, -1)}
                      disabled={index === 0 || pending}
                      title="Yukarı Taşı"
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleMove(index, 1)}
                      disabled={index === items.length - 1 || pending}
                      title="Aşağı Taşı"
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDuplicate(item)}
                      disabled={pending}
                      title="Çoğalt"
                    >
                      <Copy className="size-4" />
                    </Button>

                    {/* DÜZENLE YENİ SAYFADA AÇILSIN */}
                    <Button asChild variant="outline" size="sm" className="h-8 text-xs font-semibold border-emerald-500/50 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40">
                      <Link href={`/admin/website/slider/${item.id}`}>
                        <Pencil className="mr-1 size-3.5" /> Düzenle
                      </Link>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(item.id)}
                      disabled={pending}
                      title="Sil"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* SİLME ONAY MODALI */}
      <Dialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slaytı Sil</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Bu slaytı silmek istediğinizden emin misiniz? İşlem siteden anında kaldırılacaktır.
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
