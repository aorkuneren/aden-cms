"use client"

import { useState, useTransition } from "react"
import { Plus, Trash2, Save, Share2, ExternalLink } from "lucide-react"

import { saveSocialAction } from "@/app/admin/(panel)/website/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "@/components/admin/lucide-icon"
import { SaveStatusBanner, type SaveStatus } from "@/components/admin/save-status"

export type SocialProfile = { id: string; platform: string; icon: string; url: string }

// Hızlı ekleme için hazır platformlar (lucide ikon adı)
const PRESETS: { platform: string; icon: string }[] = [
  { platform: "Instagram", icon: "Instagram" },
  { platform: "Facebook", icon: "Facebook" },
  { platform: "YouTube", icon: "Youtube" },
  { platform: "X (Twitter)", icon: "Twitter" },
  { platform: "WhatsApp", icon: "MessageCircle" },
  { platform: "LinkedIn", icon: "Linkedin" },
]

export function SocialEditor({ initial }: { initial: SocialProfile[] }) {
  const [items, setItems] = useState<SocialProfile[]>(initial)
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<SaveStatus>(null)

  const patch = (id: string, p: Partial<SocialProfile>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...p } : it)))
    setStatus(null)
  }
  const add = (preset?: { platform: string; icon: string }) => {
    setItems((prev) => [
      ...prev,
      {
        id: `social-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        platform: preset?.platform ?? "",
        icon: preset?.icon ?? "",
        url: "",
      },
    ])
    setStatus(null)
  }
  const remove = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
    setStatus(null)
  }
  const save = () =>
    startTransition(async () => {
      const res = await saveSocialAction(items)
      setStatus(res.ok ? { type: "ok", msg: "Kaydedildi ve siteye yansıtıldı." } : { type: "err", msg: res.error })
    })

  const filled = items.filter((i) => i.url.trim())

  return (
    <div className="space-y-4">
      {/* Sticky bar */}
      <div className="sticky top-14 z-20 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-2xs backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-6 border-emerald-200 bg-emerald-50 text-[11px] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <Share2 className="mr-1 size-3" /> Sosyal Medya
          </Badge>
          <span className="text-xs font-medium text-slate-500">{items.length} profil</span>
        </div>
        <Button onClick={save} disabled={pending} size="sm" className="h-8 bg-emerald-600 text-xs hover:bg-emerald-700">
          <Save className="mr-1 size-3.5" /> {pending ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </div>

      <SaveStatusBanner status={status} />

      {/* Canlı önizleme */}
      {filled.length > 0 ? (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Önizleme:</span>
            {filled.map((s) => (
              <span key={s.id} className="flex size-9 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                <LucideIcon name={s.icon} className="size-4" />
              </span>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Hazır platformlar */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.platform}
            onClick={() => add(p)}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-emerald-400 hover:text-emerald-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-slate-300"
          >
            <LucideIcon name={p.icon} className="size-3.5" /> {p.platform}
          </button>
        ))}
        <button
          onClick={() => add()}
          className="flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-emerald-400 hover:text-emerald-700 dark:border-neutral-700"
        >
          <Plus className="size-3.5" /> Özel
        </button>
      </div>

      {/* Satırlar */}
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900 sm:flex-nowrap"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-slate-300">
              <LucideIcon name={item.icon} className="size-4" />
            </span>
            <Input
              value={item.platform}
              onChange={(e) => patch(item.id, { platform: e.target.value })}
              placeholder="Platform"
              className="h-8 w-full text-sm sm:w-36"
            />
            <Input
              value={item.icon}
              onChange={(e) => patch(item.id, { icon: e.target.value })}
              placeholder="İkon (lucide)"
              className="h-8 w-full text-sm sm:w-32"
            />
            <div className="relative flex-1">
              <Input
                value={item.url}
                onChange={(e) => patch(item.id, { url: e.target.value })}
                placeholder="https://…"
                className="h-8 pr-8 text-sm"
              />
              {item.url.trim() ? (
                <a href={item.url} target="_blank" rel="noreferrer" className="absolute right-2 top-1.5 text-slate-400 hover:text-emerald-600" aria-label="Bağlantıyı aç">
                  <ExternalLink className="size-4" />
                </a>
              ) : null}
            </div>
            <Button variant="ghost" size="icon-sm" className="shrink-0 text-red-500 hover:text-red-600" onClick={() => remove(item.id)} aria-label="Sil">
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-xs text-slate-500">
              Henüz sosyal profil yok. Yukarıdan hazır platform seçin veya “Özel” ekleyin.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
