"use client"

import { useMemo, useState, useTransition } from "react"
import { Save, Search, Type } from "lucide-react"

import { saveUiStringAction } from "@/app/admin/(panel)/site/arayuz-metinleri/actions"
import { SaveStatusBanner, type SaveStatus } from "@/components/admin/save-status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type UiStringEntry = { key: string; value: string }

export function UiStringsEditor({ initial }: { initial: UiStringEntry[] }) {
  const [entries, setEntries] = useState<UiStringEntry[]>(initial)
  const [searchQuery, setSearchQuery] = useState("")
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [status, setStatus] = useState<SaveStatus>(null)
  const [pending, startTransition] = useTransition()

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return entries
    return entries.filter(
      (entry) => entry.key.toLowerCase().includes(q) || entry.value.toLowerCase().includes(q)
    )
  }, [entries, searchQuery])

  const patchValue = (key: string, value: string) => {
    setEntries((current) => current.map((entry) => (entry.key === key ? { ...entry, value } : entry)))
    setStatus(null)
  }

  const saveEntry = (key: string, value: string) => {
    setPendingKey(key)
    startTransition(async () => {
      const result = await saveUiStringAction(key, value)
      setPendingKey(null)
      setStatus(
        result.ok
          ? { type: "ok", msg: `"${key}" kaydedildi ve siteye yansıtıldı.` }
          : { type: "err", msg: result.error }
      )
    })
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-14 z-20 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-2xs backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="h-6 border-emerald-200 bg-emerald-50 text-[11px] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          >
            <Type className="mr-1 size-3" /> Arayüz Metinleri
          </Badge>
          <span className="text-xs font-medium text-slate-500">
            {filteredEntries.length}/{entries.length} anahtar
          </span>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Anahtar veya metin ara…"
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <SaveStatusBanner status={status} />

      {filteredEntries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-neutral-800">
          {entries.length === 0 ? "Henüz arayüz metni tanımlanmamış." : "Aramanızla eşleşen metin bulunamadı."}
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-neutral-800">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:border-neutral-800 dark:bg-neutral-900/60">
            <span>Anahtar</span>
            <span>Metin</span>
            <span className="sr-only">Kaydet</span>
          </div>
          <ul className="divide-y divide-slate-200 dark:divide-neutral-800">
            {filteredEntries.map((entry) => {
              const isSaving = pending && pendingKey === entry.key
              return (
                <li
                  key={entry.key}
                  className="grid grid-cols-1 items-start gap-3 px-3 py-3 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]"
                >
                  <div className="space-y-1">
                    <Label className="text-[11px] text-slate-500 md:sr-only">Anahtar</Label>
                    <code className="block rounded bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-neutral-900 dark:text-slate-200">
                      {entry.key}
                    </code>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`ui-string-${entry.key}`} className="text-[11px] text-slate-500 md:sr-only">
                      Metin
                    </Label>
                    <Input
                      id={`ui-string-${entry.key}`}
                      value={entry.value}
                      onChange={(event) => patchValue(entry.key, event.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9"
                    disabled={pending}
                    onClick={() => saveEntry(entry.key, entry.value)}
                  >
                    <Save className="mr-1 size-3.5" />
                    {isSaving ? "Kaydediliyor…" : "Kaydet"}
                  </Button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
