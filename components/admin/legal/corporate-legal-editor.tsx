"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Save, ExternalLink, FileText } from "lucide-react"

import { saveCorporateLegalAction } from "@/app/admin/(panel)/yasal/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SaveStatusBanner, type SaveStatus } from "@/components/admin/save-status"

export type LegalPage = {
  slug: string
  label: string
  title: string
  description: string
  content: string
}

export function CorporateLegalEditor({ initial }: { initial: LegalPage[] }) {
  const [pages, setPages] = useState<LegalPage[]>(initial)
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<SaveStatus>(null)

  const patch = (slug: string, p: Partial<LegalPage>) => {
    setPages((prev) => prev.map((it) => (it.slug === slug ? { ...it, ...p } : it)))
    setStatus(null)
  }

  const save = () =>
    startTransition(async () => {
      const payload = pages.map(({ slug, title, description, content }) => ({ slug, title, description, content }))
      const res = await saveCorporateLegalAction(payload)
      setStatus(res.ok ? { type: "ok", msg: "Yasal metinler kaydedildi ve siteye yansıtıldı." } : { type: "err", msg: res.error })
    })

  return (
    <div className="space-y-4">
      <div className="sticky top-14 z-20 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-2xs backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
        <p className="text-sm text-slate-500">
          {pages.length} kurumsal sayfa • HTML kullanabilirsiniz
        </p>
        <Button onClick={save} disabled={pending} className="bg-emerald-600 hover:bg-emerald-700">
          <Save className="mr-1 size-4" /> {pending ? "Kaydediliyor…" : "Tümünü Kaydet"}
        </Button>
      </div>

      <SaveStatusBanner status={status} />

      {pages.map((page) => (
        <Card key={page.slug}>
          <CardHeader className="flex flex-row items-center justify-between border-b">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                <FileText className="size-4" />
              </span>
              <div>
                <CardTitle className="text-sm">{page.label}</CardTitle>
                <code className="text-[11px] text-slate-400">/kurumsal/{page.slug}</code>
              </div>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/kurumsal/${page.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1 size-3.5" /> Önizle
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Sayfa başlığı</Label>
                <Input value={page.title} onChange={(e) => patch(page.slug, { title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Kısa açıklama (SEO)</Label>
                <Input value={page.description} onChange={(e) => patch(page.slug, { description: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">İçerik (HTML veya düz metin)</Label>
              <Textarea
                rows={8}
                className="font-mono text-xs"
                value={page.content}
                onChange={(e) => patch(page.slug, { content: e.target.value })}
                placeholder="<p>Metin…</p>"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
