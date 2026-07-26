"use client"

import { useMemo, useState, useTransition } from "react"
import { Save } from "lucide-react"

import { saveSectionAction } from "@/app/admin/(panel)/sayfalar/actions"
import { DirectMediaPicker } from "@/components/admin/direct-media-picker"
import { SaveStatusBanner, type SaveStatus } from "@/components/admin/save-status"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { FieldDef } from "@/lib/cms/registry"

type FormValues = Record<string, string | number | boolean>

function normalizeValues(fields: FieldDef[], initialValues: Record<string, unknown>): FormValues {
  return Object.fromEntries(
    fields.map((field) => {
      const value = initialValues[field.name] ?? field.defaultValue
      if (field.type === "boolean") {
        return [field.name, value === true || value === "true"]
      }
      return [field.name, String(value ?? "")]
    })
  )
}

export function SectionForm({
  pageSlug,
  sectionKey,
  fields,
  initialValues,
}: {
  pageSlug: string
  sectionKey: string
  fields: FieldDef[]
  initialValues: Record<string, unknown>
}) {
  const initial = useMemo(() => normalizeValues(fields, initialValues), [fields, initialValues])
  const [values, setValues] = useState<FormValues>(initial)
  const [savedValues, setSavedValues] = useState<FormValues>(initial)
  const [status, setStatus] = useState<SaveStatus>(null)
  const [pending, startTransition] = useTransition()
  const isDirty = JSON.stringify(values) !== JSON.stringify(savedValues)

  const setValue = (name: string, value: FormValues[string]) => {
    setValues((current) => ({ ...current, [name]: value }))
    setStatus(null)
  }

  const save = () => {
    startTransition(async () => {
      const result = await saveSectionAction(pageSlug, sectionKey, values)
      if (result.ok) {
        setSavedValues(values)
        setStatus({ type: "ok", msg: "Bölüm kaydedildi ve siteye yansıtıldı." })
      } else {
        setStatus({ type: "err", msg: result.error })
      }
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <SaveStatusBanner status={status} />

      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="space-y-4 p-4">
          {fields.map((field) => {
            const value = values[field.name]
            const id = `section-field-${field.name}`

            if (field.type === "image") {
              return (
                <div key={field.name}>
                  <DirectMediaPicker
                    value={String(value ?? "")}
                    onChange={(url) => setValue(field.name, url)}
                    label={field.label}
                    accept="image/*"
                  />
                  {field.help ? <p className="mt-1 text-xs text-slate-500">{field.help}</p> : null}
                </div>
              )
            }

            if (field.type === "boolean") {
              return (
                <div key={field.name} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 dark:border-neutral-800">
                  <Checkbox
                    id={id}
                    checked={value === true}
                    onCheckedChange={(checked) => setValue(field.name, checked === true)}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <Label htmlFor={id} className="cursor-pointer text-sm font-medium">
                      {field.label}
                    </Label>
                    {field.help ? <p className="text-xs text-slate-500">{field.help}</p> : null}
                  </div>
                </div>
              )
            }

            return (
              <div key={field.name} className="space-y-1.5">
                <Label htmlFor={id} className="text-xs font-medium">
                  {field.label}
                  {field.required ? " *" : ""}
                </Label>
                {field.type === "longText" || field.type === "richText" ? (
                  <Textarea
                    id={id}
                    rows={5}
                    value={String(value ?? "")}
                    onChange={(event) => setValue(field.name, event.target.value)}
                    className="resize-y rounded-xl text-sm leading-6"
                  />
                ) : field.type === "select" ? (
                  <select
                    id={id}
                    value={String(value ?? "")}
                    onChange={(event) => setValue(field.name, event.target.value)}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background"
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
                    type={field.type === "number" ? "number" : field.type === "link" ? "url" : "text"}
                    value={String(value ?? "")}
                    onChange={(event) => setValue(field.name, event.target.value)}
                    className="h-10 rounded-xl"
                  />
                )}
                {field.help ? <p className="text-xs text-slate-500">{field.help}</p> : null}
              </div>
            )
          })}
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={save} disabled={pending || !isDirty} className="bg-emerald-600 hover:bg-emerald-700">
          <Save className="mr-1.5 size-4" />
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </div>
    </div>
  )
}
