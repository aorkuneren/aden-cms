import { readJson } from "@/lib/cms/store"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { SettingsEditor, type SettingsData } from "@/components/admin/settings/settings-editor"

export const dynamic = "force-dynamic"

const str = (v: unknown) => (v == null ? "" : String(v))
const num = (v: unknown, d: number) => (typeof v === "number" ? v : Number(v) || d)

export default async function AyarlarAdminPage() {
  const s = await readJson<any>("settings.json").catch(() => ({}))

  const initial: SettingsData = {
    companyName: str(s.companyName),
    phone: str(s.phone),
    email: str(s.email),
    address: str(s.address),
    website: str(s.website),
    taxNumber: str(s.taxNumber),
    taxOffice: str(s.taxOffice),
    bankName: str(s.bankName),
    iban: str(s.iban),
    googleBusinessProfileUrl: str(s.googleBusinessProfileUrl),
    checkInTime: str(s.checkInTime) || "14:00",
    checkOutTime: str(s.checkOutTime) || "11:00",
    minStayDays: num(s.minStayDays, 1),
    requiredDepositAmount: num(s.requiredDepositAmount, 0),
    cancellationDaysBefore: num(s.cancellationDaysBefore, 0),
    themePrimaryColor: str(s.themePrimaryColor) || "#000000",
    themeSecondaryColor: str(s.themeSecondaryColor) || "#6B7280",
    themeFontFamily: str(s.themeFontFamily) || "Inter",
    maintenanceModeEnabled: s.maintenanceModeEnabled === 1 || s.maintenanceModeEnabled === true,
  }

  return (
    <>
      <AdminPageHeader title="Ayarlar" description="Firma bilgileri, rezervasyon kuralları ve tema." />
      <SettingsEditor initial={initial} />
    </>
  )
}
