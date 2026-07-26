import { z } from "zod"
import type { FieldDef, SectionDef } from "./types"

function fieldZod(field: FieldDef) {
  switch (field.type) {
    case "number":
      return field.required === false
        ? z.union([z.number(), z.string()]).optional()
        : z.union([z.number(), z.string()])
    case "boolean":
      return z.union([z.boolean(), z.literal("true"), z.literal("false")])
    case "select": {
      const values = field.options?.map((option) => option.value)
      if (!values?.length) {
        throw new Error(`Seçim alanının seçenekleri eksik: ${field.name}`)
      }
      return z.enum(values as [string, ...string[]])
    }
    default:
      return field.required === false ? z.string().optional() : z.string()
  }
}

export function buildSectionZod(section: SectionDef) {
  if (section.kind !== "fields" || !section.fields) {
    throw new Error(`Bölüm şema üretmez: ${section.key}`)
  }

  const shape: Record<string, z.ZodType> = {}
  for (const field of section.fields) {
    shape[field.name] = fieldZod(field)
  }

  return z.object(shape)
}

export function sectionDefaults(section: SectionDef): Record<string, unknown> {
  const defaults: Record<string, unknown> = {}
  for (const field of section.fields ?? []) {
    defaults[field.name] = field.defaultValue
  }

  return defaults
}
