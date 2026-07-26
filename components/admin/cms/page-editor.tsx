"use client"

import { useMemo, useState, useTransition } from "react"
import { ExternalLink, FileText, Save } from "lucide-react"

import { savePageSectionsAction } from "@/app/admin/(panel)/sayfalar/actions"
import { DirectMediaPicker } from "@/components/admin/direct-media-picker"
import { SaveStatusBanner, type SaveStatus } from "@/components/admin/save-status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { FieldDef } from "@/lib/cms/registry"

export type PageEditorSection = {
  key: string
  label: string
  description?: string
  fields: FieldDef[]
  values: Record<string, unknown>
}

type SectionValues = Record<string, string | boolean>
type AllValues = Record<string, SectionValues>

/** Geniş alanlar kart içinde tek başına satır kaplar. */
function isWideField(field: FieldDef) {
  return field.type === "longText" || field.type === "richText" || field.type === "image"
}

function normalize(sections: PageEditorSection[]): AllValues {
  return Object.fromEntries(
    sections.map((section) => [
      section.key,
      Object.fromEntries(
        section.fields.map((field) => {
          const value = section.values[field.name] ?? field.defaultValue
          if (field.type === "boolean") return [field.name, value === true || value === "true"]
          return [field.name, String(value ?? "")]
        })
      ) as SectionValues,
    ])
  )
}

/**
 * Bir sayfanın tüm bölümlerini tek ekranda, tek "Kaydet" ile yöneten editör.
 *
 * Alanlar kayıt defterindeki (registry) tanımlardan üretilir; bölümler kart
 * olarak dizilir ve kaydetme tek yazımda yapılır.
 */
export function PageEditor({
  pageSlug,
  scopeLabel,
  siteHref,
  sections,
}: {
  pageSlug: string
  /** Komut çubuğundaki bağlam rozeti — örn. "Galeri Sayfası". */
  scopeLabel: string
  /** Sitedeki karşılığı. */
  siteHref: string
  sections: PageEditorSection[]
}) {
  const initial = useMemo(() => normalize(sections), [sections])
  const [values, setValues] = useState<AllValues>(initial)
  const [savedValues, setSavedValues] = useState<AllValues>(initial)
  const [status, setStatus] = useState<SaveStatus>(null)
  const [pending, startTransition] = useTransition()

  const changedCount = useMemo(() => {
    let count = 0
    for (const [sectionKey, sectionValues] of Object.entries(values)) {
      for (const [name, value] of Object.entries(sectionValues)) {
        if (value !== savedValues[sectionKey]?.[name]) count += 1
      }
    }
    return count
  }, [values, savedValues])

  const setValue = (sectionKey: string, name: string, value: string | boolean) => {
    setValues((current) => ({
      ...current,
      [sectionKey]: { ...current[sectionKey], [name]: value },
    }))
    setStatus(null)
  }

  const save = () =>
    startTransition(async () => {
      const res = await savePageSectionsAction(pageSlug, values)
      if (res.ok) {
        setSavedValues(values)
        setStatus({ type: "ok", msg: "Sayfa içeriği kaydedildi ve siteye yansıtıldı." })
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
            <FileText className="mr-1 size-3" /> {scopeLabel}
          </Badge>
          <span className="text-xs font-medium text-slate-500">{sections.length} bölüm</span>
          {changedCount > 0 ? (
            <span className="text-xs font-medium text-amber-600">
              ● {changedCount} alan değişti
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
            <a href={siteHref} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-1 size-3.5" /> Siteyi Aç
            </a>
          </Button>
          <Button
            onClick={save}
            disabled={pending || changedCount === 0}
            size="sm"
            className="h-8 bg-emerald-600 text-xs hover:bg-emerald-700"
          >
            <Save className="mr-1 size-3.5" /> {pending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </div>

      <SaveStatusBanner status={status} />

      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map((section) => (
          <Card
            key={section.key}
            className={
              sections.length === 1 || section.fields.length > 4 ? "lg:col-span-2" : undefined
            }
          >
            <CardHeader>
              <CardTitle className="text-base">{section.label}</CardTitle>
              {section.description ? (
                <CardDescription>{section.description}</CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {section.fields.map((field) => {
                const value = values[section.key]?.[field.name]
                const id = `${section.key}-${field.name}`
                const wide = isWideField(field)

                if (field.type === "image") {
                  return (
                    <div key={field.name} className="sm:col-span-2">
                      <DirectMediaPicker
                        value={String(value ?? "")}
                        onChange={(url) => setValue(section.key, field.name, url)}
                        label={field.label}
                        accept="image/*"
                      />
                      {field.help ? (
                        <p className="mt-1 text-[11px] text-slate-400">{field.help}</p>
                      ) : null}
                    </div>
                  )
                }

                if (field.type === "boolean") {
                  return (
                    <div
                      key={field.name}
                      className="flex items-center gap-3 rounded-lg border p-3 sm:col-span-2 dark:border-neutral-800"
                    >
                      <Switch
                        id={id}
                        checked={value === true}
                        onCheckedChange={(checked) => setValue(section.key, field.name, checked)}
                      />
                      <div>
                        <Label htmlFor={id} className="cursor-pointer font-medium">
                          {field.label}
                        </Label>
                        {field.help ? (
                          <p className="text-xs text-slate-500">{field.help}</p>
                        ) : null}
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={field.name}
                    className={wide ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}
                  >
                    <Label htmlFor={id} className="text-xs font-medium">
                      {field.label}
                      {field.required ? " *" : ""}
                    </Label>

                    {field.type === "longText" || field.type === "richText" ? (
                      <Textarea
                        id={id}
                        rows={4}
                        value={String(value ?? "")}
                        onChange={(event) => setValue(section.key, field.name, event.target.value)}
                      />
                    ) : field.type === "select" ? (
                      <select
                        id={id}
                        value={String(value ?? "")}
                        onChange={(event) => setValue(section.key, field.name, event.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        id={id}
                        type={
                          field.type === "number" ? "number" : field.type === "link" ? "url" : "text"
                        }
                        value={String(value ?? "")}
                        onChange={(event) => setValue(section.key, field.name, event.target.value)}
                      />
                    )}

                    {field.help ? <p className="text-[11px] text-slate-400">{field.help}</p> : null}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
