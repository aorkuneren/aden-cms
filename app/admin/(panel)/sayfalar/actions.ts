"use server"

import { mutateCms } from "@/lib/cms/mutate-cms"
import { buildSectionZod, getPage, getSection } from "@/lib/cms/registry"

const PAGE_CONTENT_FILE = "page-content.json"

type ActionResult = { ok: true } | { ok: false; error: string }

function toStringMap(values: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(values)) {
    result[key] = typeof value === "string" ? value : String(value)
  }
  return result
}

export async function saveSectionAction(
  pageSlug: string,
  sectionKey: string,
  values: unknown
): Promise<{ ok: true } | { ok: false; error: string }> {
  const section = getSection(pageSlug, sectionKey)
  if (!section || section.kind !== "fields") {
    return { ok: false, error: "Bölüm bulunamadı." }
  }

  const parsed = buildSectionZod(section).safeParse(values)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Geçersiz veri." }
  }

  const asStrings = toStringMap(parsed.data)

  const result = await mutateCms<Record<string, Record<string, Record<string, string>>>>({
    action: "update",
    file: PAGE_CONTENT_FILE,
    entityType: "page_section",
    entityId: `${pageSlug}.${sectionKey}`,
    auditAction: "Sayfa bölümü güncellendi",
    updater: (current) => ({
      ...current,
      [pageSlug]: {
        ...(current[pageSlug] ?? {}),
        [sectionKey]: asStrings,
      },
    }),
  })

  if (!result.ok) return result
  return { ok: true }
}

/**
 * Bir sayfanın tüm bölümlerini tek yazımda kaydeder.
 *
 * Sayfa editörü tek "Kaydet" düğmesi sunduğu için bölümler ayrı ayrı değil,
 * tek dosya yazımı ve tek denetim kaydıyla işlenir.
 */
export async function savePageSectionsAction(
  pageSlug: string,
  sections: Record<string, Record<string, unknown>>
): Promise<ActionResult> {
  const page = getPage(pageSlug)
  if (!page) return { ok: false, error: "Sayfa bulunamadı." }

  const validated: Record<string, Record<string, string>> = {}

  for (const [sectionKey, values] of Object.entries(sections)) {
    const section = page.sections.find((item) => item.key === sectionKey)
    if (!section || section.kind !== "fields") {
      return { ok: false, error: `Bölüm bulunamadı: ${sectionKey}` }
    }

    const parsed = buildSectionZod(section).safeParse(values)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return {
        ok: false,
        error: `${section.label}: ${issue?.message ?? "Geçersiz veri."}`,
      }
    }

    validated[sectionKey] = toStringMap(parsed.data)
  }

  const result = await mutateCms<Record<string, Record<string, Record<string, string>>>>({
    action: "update",
    file: PAGE_CONTENT_FILE,
    entityType: "page_content",
    entityId: pageSlug,
    auditAction: "Sayfa içeriği güncellendi",
    updater: (current) => ({
      ...current,
      [pageSlug]: {
        ...(current[pageSlug] ?? {}),
        ...validated,
      },
    }),
  })

  if (!result.ok) return result
  return { ok: true }
}
