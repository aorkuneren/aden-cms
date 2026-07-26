"use server"

import { mutateCms } from "@/lib/cms/mutate-cms"

export type ModuleActionResult = { ok: true } | { ok: false; error: string }

export async function setUserSystemEnabledAction(enabled: boolean): Promise<ModuleActionResult> {
  if (typeof enabled !== "boolean") return { ok: false, error: "Geçersiz modül durumu." }

  const result = await mutateCms<Record<string, unknown>>({
    action: "update",
    file: "settings.json",
    entityType: "settings_module",
    entityId: "user-system",
    auditAction: "Kullanıcı Sistemi Modülü Güncellendi",
    details: { enabled },
    updater: (current) => {
      const modules = current.modules as Record<string, unknown> | undefined
      const userSystem = modules?.userSystem as Record<string, unknown> | undefined

      return {
        ...current,
        modules: {
          ...modules,
          userSystem: { ...userSystem, enabled },
        },
        updatedAt: new Date().toISOString(),
      }
    },
  })

  return result.ok ? { ok: true } : result
}
