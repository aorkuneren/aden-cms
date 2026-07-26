"use server"

import { mutateCms } from "@/lib/cms/mutate-cms"

export type ActionResult = { ok: true } | { ok: false; error: string }

const UI_STRINGS_FILE = "ui-strings.json"

export async function saveUiStringAction(key: string, value: string): Promise<ActionResult> {
  const trimmedKey = key.trim()
  if (!trimmedKey) return { ok: false, error: "Anahtar boş olamaz." }

  const result = await mutateCms<Record<string, string>>({
    action: "update",
    file: UI_STRINGS_FILE,
    entityType: "ui_string",
    entityId: trimmedKey,
    auditAction: "Arayüz metni güncellendi",
    details: { key: trimmedKey },
    updater: (current) => ({
      ...current,
      [trimmedKey]: value,
    }),
  })

  if (!result.ok) return result
  return { ok: true }
}
