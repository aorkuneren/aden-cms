"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Save,
  ArrowLeft,
  Trash2,
  HelpCircle,
  Sparkles,
  Star,
  Plus,
} from "lucide-react"

import { type CmsFaqItem } from "@/lib/site/website-cms-types"
import { saveSingleFaqAction, deleteSingleFaqAction } from "@/app/admin/(panel)/website/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

const FAQ_CATEGORIES = [
  "Genel",
  "Rezervasyon & Ödeme",
  "Giriş & Çıkış",
  "Bungalov Özellikleri",
  "Ev Kuralları & İptal",
]

const QUICK_TEMPLATES = [
  {
    category: "Giriş & Çıkış",
    question: "Giriş ve çıkış saatleriniz nelerdir?",
    answer: "Tesisimize giriş saati en erken 14:00, çıkış saati ise en geç 11:00'dir.",
  },
  {
    category: "Bungalov Özellikleri",
    question: "Havuz ısıtması fiyata dahil mi?",
    answer: "Evet, ısıtmalı özel havuzlarımız tüm yıl boyunca 28-30°C sıcaklıkta hizmet vermektedir ve fiyata dahildir.",
  },
  {
    category: "Ev Kuralları & İptal",
    question: "Evcil hayvan kabul ediyor musunuz?",
    answer: "Kullanım şartlarına ve hijyen standartlarına uygun olarak bazı bungalovlarımızda evcil hayvan kabul edilmektedir.",
  },
  {
    category: "Rezervasyon & Ödeme",
    question: "Ödeme seçenekleri ve kaporası ne kadardır?",
    answer: "%30 kapora ödemesi ile rezervasyonunuz kesinleşir. Kalan tutarı tesise girişte nakit veya kredi kartı ile ödeyebilirsiniz.",
  },
]

export function FaqItemForm({ initial, isNew }: { initial: CmsFaqItem; isNew: boolean }) {
  const router = useRouter()
  const [data, setData] = useState<CmsFaqItem>(initial)
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<SaveStatus>(null)
  const [isDirty, setIsDirty] = useState(false)

  // Silme Onay Modalı
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const set = (patch: Partial<CmsFaqItem>) => {
    setData((prev) => ({ ...prev, ...patch }))
    setIsDirty(true)
    setStatus(null)
  }

  const applyTemplate = (tmpl: (typeof QUICK_TEMPLATES)[0]) => {
    setData((prev) => ({
      ...prev,
      question: tmpl.question,
      answer: tmpl.answer,
      category: tmpl.category,
    }))
    setIsDirty(true)
    setStatus(null)
  }

  const handleSave = () => {
    startTransition(async () => {
      const res = await saveSingleFaqAction(data)
      if (res.ok) {
        setStatus({ type: "ok", msg: "SSS soru ve cevabı kaydedildi." })
        setIsDirty(false)
        router.push("/admin/website/sss")
        router.refresh()
      } else {
        setStatus({ type: "err", msg: res.error })
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteSingleFaqAction(data.id)
      if (res.ok) {
        setStatus({ type: "ok", msg: "Soru silindi." })
        setDeleteConfirmOpen(false)
        router.push("/admin/website/sss")
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
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/website/sss")}>
            <ArrowLeft className="mr-1 size-4" /> SSS Listesine Dön
          </Button>
          <div className="hidden items-center gap-2 sm:flex">
            <Badge variant={data.isActive ? "default" : "secondary"} className={data.isActive ? "bg-emerald-600" : ""}>
              {data.isActive ? "Yayında" : "Gizli"}
            </Badge>
            {data.isFeatured ? (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                <Star className="mr-1 size-3 fill-amber-500 text-amber-500" /> Öne Çıkarılan
              </Badge>
            ) : null}
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

      {/* Hazır Şablonlar (opsiyonel) */}
      {isNew ? (
        <Card className="bg-slate-50/50 dark:bg-neutral-900/50 border-emerald-500/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
              <Sparkles className="size-3.5 text-emerald-600" /> Hızlı Soru Şablonu Seç
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex flex-wrap items-center gap-2">
            {QUICK_TEMPLATES.map((tmpl, idx) => (
              <Button
                key={idx}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs bg-white dark:bg-neutral-800 hover:bg-emerald-50 hover:text-emerald-700"
                onClick={() => applyTemplate(tmpl)}
              >
                <Plus className="mr-1 size-3 text-emerald-600" /> {tmpl.question}
              </Button>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* FORMLAR */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Sol / Orta Kolon: Soru ve Cevap Metinleri */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle className="size-4 text-emerald-600" /> Soru & Cevap Detayları
            </CardTitle>
            <CardDescription>Müşterilerinizin göreceği soru ve detaylı cevap metnini yazın.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Soru Cümlesi *</Label>
              <Input
                value={data.question}
                onChange={(e) => set({ question: e.target.value })}
                placeholder="Örn: Giriş ve çıkış saatleriniz nelerdir?"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Detaylı Cevap Metni *</Label>
                <span className="text-[10px] text-slate-400">{data.answer.length} karakter</span>
              </div>
              <Textarea
                rows={6}
                value={data.answer}
                onChange={(e) => set({ answer: e.target.value })}
                placeholder="Anlaşılır, net ve bilgilendirici cevap metni..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Sağ Kolon: Kategori & Yayın Ayarları */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kategori & Durum</CardTitle>
            <CardDescription>Soru kategorisi ve görünürlük ayarları.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Soru Kategorisi</Label>
              <Select
                value={data.category || "Genel"}
                onValueChange={(v) => set({ category: v })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FAQ_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 pt-3 border-t dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="cursor-pointer font-medium text-xs">Öne Çıkarılan Soru</Label>
                  <p className="text-[11px] text-slate-400">SSS listesinin üst kısımlarında yıldızla vurgulanır.</p>
                </div>
                <Switch
                  checked={Boolean(data.isFeatured)}
                  onCheckedChange={(v) => set({ isFeatured: v })}
                />
              </div>

              <div className="flex items-center justify-between border-t pt-3 dark:border-neutral-800">
                <div>
                  <Label className="cursor-pointer font-medium text-xs">Yayında Olsun</Label>
                  <p className="text-[11px] text-slate-400">Pasife alındığında web sitesinde gizlenir.</p>
                </div>
                <Switch
                  checked={data.isActive}
                  onCheckedChange={(v) => set({ isActive: v })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Silme Onay Modalı */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Soruyu Sil</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Bu SSS sorusunu silmek istediğinizden emin misiniz? Değişikliği kaydettiğinizde anasayfadan kaldırılacaktır.
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
