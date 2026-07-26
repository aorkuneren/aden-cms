"use server"

import { z } from "zod"

import { getCurrentAdmin } from "@/lib/admin/auth"
import { mutateJson, revalidateSite } from "@/lib/cms/store"

export type ActionResult = { ok: true } | { ok: false; error: string }

// Yalnızca panelde düzenlenen alanlar. Diğer tüm settings alanları korunur.
const settingsPatchSchema = z.object({
  companyName: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  website: z.string().nullable(),
  taxNumber: z.string().nullable(),
  taxOffice: z.string().nullable(),
  bankName: z.string().nullable(),
  iban: z.string().nullable(),
  googleBusinessProfileUrl: z.string().nullable(),
  checkInTime: z.string(),
  checkOutTime: z.string(),
  minStayDays: z.number().int().positive(),
  requiredDepositAmount: z.number().nonnegative(),
  cancellationDaysBefore: z.number().int().nonnegative(),
  themePrimaryColor: z.string(),
  themeSecondaryColor: z.string(),
  themeFontFamily: z.string(),
  maintenanceModeEnabled: z.boolean(),
})

export async function saveSettingsAction(patch: unknown): Promise<ActionResult> {
  const admin = await getCurrentAdmin()
  if (!admin) return { ok: false, error: "Oturum süresi doldu. Lütfen tekrar giriş yapın." }

  const parsed = settingsPatchSchema.safeParse(patch)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ayar verisi geçersiz." }
  }

  await mutateJson<Record<string, unknown>>("settings.json", (current) => ({
    ...current,
    ...parsed.data,
    // settings.json bakım modunu 0/1 olarak tutuyor — o formatı koru.
    maintenanceModeEnabled: parsed.data.maintenanceModeEnabled ? 1 : 0,
    updatedAt: new Date().toISOString(),
  }))
  revalidateSite()
  return { ok: true }
}
