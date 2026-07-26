"use client"

import { useState, useTransition } from "react"
import { Save, Search, Globe, Image as ImageIcon, ChevronRight } from "lucide-react"

import { saveSeoAction } from "@/app/admin/(panel)/website/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SaveStatusBanner, type SaveStatus } from "@/components/admin/save-status"

export type PageSeoItem = {
  id: string
  slug: string
  label: string
  title: string
  description: string
  keywords: string
}

export type SeoData = {
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  logoDarkUrl: string
  logoLightUrl: string
  pageSeoItems: PageSeoItem[]
}

const ORIGIN = "www.adenbungalov.com"

function CharCount({ value, ideal }: { value: string; ideal: [number, number] }) {
  const len = value.length
  const ok = len >= ideal[0] && len <= ideal[1]
  return (
    <span className={ok ? "text-emerald-600" : len > ideal[1] ? "text-red-500" : "text-slate-400"}>
      {len} karakter{len > ideal[1] ? " • fazla" : ""}
    </span>
  )
}

/** Canlı Google sonuç önizlemesi */
function SerpPreview({ title, url, description }: { title: string; url: string; description: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-center gap-1 text-xs text-slate-500">
        <span className="flex size-4 items-center justify-center rounded-full bg-slate-100 dark:bg-neutral-800">
          <Globe className="size-2.5" />
        </span>
        <span className="truncate">{url}</span>
      </div>
      <p className="mt-1 truncate text-[19px] leading-tight text-[#1a0dab] dark:text-blue-400">
        {title || "Sayfa başlığı"}
      </p>
      <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-[#4d5156] dark:text-slate-400">
        {description || "Meta açıklaması burada görünecek. Arama sonuçlarında bu metin gösterilir."}
      </p>
    </div>
  )
}

export function SeoEditor({ initial }: { initial: SeoData }) {
  const [data, setData] = useState<SeoData>(initial)
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<SaveStatus>(null)

  const set = (p: Partial<SeoData>) => {
    setData((prev) => ({ ...prev, ...p }))
    setStatus(null)
  }
  const setPage = (id: string, p: Partial<PageSeoItem>) => {
    setData((prev) => ({
      ...prev,
      pageSeoItems: prev.pageSeoItems.map((it) => (it.id === id ? { ...it, ...p } : it)),
    }))
    setStatus(null)
  }
  const save = () =>
    startTransition(async () => {
      const res = await saveSeoAction(data)
      setStatus(res.ok ? { type: "ok", msg: "SEO ayarları kaydedildi ve siteye yansıtıldı." } : { type: "err", msg: res.error })
    })

  return (
    <div className="space-y-4">
      {/* Sticky işlem barı */}
      <div className="sticky top-14 z-20 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-2xs backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
        <Badge variant="outline" className="h-6 border-emerald-200 bg-emerald-50 text-[11px] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <Search className="mr-1 size-3" /> Arama Motoru Optimizasyonu
        </Badge>
        <Button onClick={save} disabled={pending} size="sm" className="h-8 bg-emerald-600 text-xs hover:bg-emerald-700">
          <Save className="mr-1 size-3.5" /> {pending ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </div>

      <SaveStatusBanner status={status} />

      {/* Genel SEO + canlı önizleme */}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-sm">Genel SEO & Logo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Site başlığı</Label>
                <span className="text-[10px]"><CharCount value={data.seoTitle} ideal={[30, 60]} /></span>
              </div>
              <Input value={data.seoTitle} onChange={(e) => set({ seoTitle: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Meta açıklama</Label>
                <span className="text-[10px]"><CharCount value={data.seoDescription} ideal={[70, 160]} /></span>
              </div>
              <Textarea rows={3} value={data.seoDescription} onChange={(e) => set({ seoDescription: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Anahtar kelimeler</Label>
              <Input value={data.seoKeywords} onChange={(e) => set({ seoKeywords: e.target.value })} placeholder="sapanca bungalov, aden bungalov" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs"><ImageIcon className="size-3" /> Koyu logo URL</Label>
                <Input value={data.logoDarkUrl} onChange={(e) => set({ logoDarkUrl: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs"><ImageIcon className="size-3" /> Açık logo URL</Label>
                <Input value={data.logoLightUrl} onChange={(e) => set({ logoLightUrl: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500">Canlı Önizleme (Google)</p>
          <SerpPreview title={data.seoTitle} url={ORIGIN} description={data.seoDescription} />
        </div>
      </div>

      {/* Sayfa bazlı SEO */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-sm">Sayfa Bazlı SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.pageSeoItems.map((page) => (
            <details key={page.id} className="group rounded-lg border border-slate-200 open:bg-slate-50/50 dark:border-neutral-800 dark:open:bg-neutral-800/30">
              <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-sm">
                <span className="flex items-center gap-2">
                  <ChevronRight className="size-4 text-slate-400 transition-transform group-open:rotate-90" />
                  <span className="font-medium">{page.label}</span>
                  <code className="text-[11px] text-slate-400">{page.slug}</code>
                </span>
                {page.title || page.description ? (
                  <Badge variant="secondary" className="text-[10px]">özelleştirildi</Badge>
                ) : (
                  <span className="text-[11px] text-slate-400">genel ayardan alınır</span>
                )}
              </summary>
              <div className="space-y-3 border-t border-slate-200 px-3 py-3 dark:border-neutral-800">
                <div className="space-y-1.5">
                  <Label className="text-xs">Başlık</Label>
                  <Input value={page.title} onChange={(e) => setPage(page.id, { title: e.target.value })} placeholder="Boş bırakılırsa genel başlık kullanılır" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Açıklama</Label>
                  <Textarea rows={2} value={page.description} onChange={(e) => setPage(page.id, { description: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Anahtar kelimeler</Label>
                  <Input value={page.keywords} onChange={(e) => setPage(page.id, { keywords: e.target.value })} />
                </div>
                <SerpPreview
                  title={page.title || data.seoTitle}
                  url={`${ORIGIN}${page.slug === "/" ? "" : page.slug}`}
                  description={page.description || data.seoDescription}
                />
              </div>
            </details>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
