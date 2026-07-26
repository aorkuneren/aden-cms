import { cache } from "react"
import { settingsQueries } from "@/lib/data/queries"
import { SITE_ORIGIN, WHATSAPP_CONFIG } from "@/lib/site/site-config"
import { resolveWhatsappPhone } from "@/lib/site/whatsapp"

function trim(value: string | null | undefined) {
  return String(value || "").trim()
}

export const getSiteContactConfig = cache(async () => {
  const settings = await settingsQueries.findFirst()
  const phone = trim(settings?.phone)

  return {
    companyName: trim(settings?.companyName) || "Aden Bungalov",
    phone,
    whatsappPhone: resolveWhatsappPhone(phone),
    defaultWhatsappMessage: WHATSAPP_CONFIG.defaultMessage,
    email: trim(settings?.email),
    address: trim(settings?.address),
    website: trim(settings?.website) || SITE_ORIGIN,
  }
})
