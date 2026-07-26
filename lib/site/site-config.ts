export const SITE_ORIGIN = "https://www.adenbungalov.com"

export const WHATSAPP_CONFIG = {
  defaultMessage: "Merhaba, bilgi ve müsaitlik durumunu öğrenmek istiyorum.",
  bungalowMessage: (bungalowName: string) =>
    `Merhaba, ${bungalowName} hakkında bilgi ve müsaitlik durumunu öğrenmek istiyorum.`,
} as const

export const COOKIE_CONSENT_CONFIG = {
  storageKey: "aden-cookie-consent",
  version: 1,
  retentionDays: 180,
} as const
