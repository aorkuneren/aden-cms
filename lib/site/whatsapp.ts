import { normalizeWhatsappPhone } from "@/lib/site/b2c"

function getPhoneSource(value: string | null | undefined) {
  const trimmed = String(value || "").trim()
  if (!trimmed) return ""

  try {
    const parsed = new URL(trimmed)
    if (parsed.hostname === "wa.me") {
      return parsed.pathname
    }
    if (parsed.hostname.endsWith("whatsapp.com")) {
      return parsed.searchParams.get("phone") || parsed.pathname
    }
  } catch {
    // Plain phone numbers intentionally fall through to digit normalization.
  }

  return trimmed
}

export function resolveWhatsappPhone(value: string | null | undefined) {
  return normalizeWhatsappPhone(getPhoneSource(value))
}

export function buildWhatsappHref(
  phoneOrHref: string | null | undefined,
  message?: string | null
) {
  const phone = resolveWhatsappPhone(phoneOrHref)
  if (!phone) return ""

  const params = new URLSearchParams()
  const normalizedMessage = String(message || "").trim()
  if (normalizedMessage) params.set("text", normalizedMessage)

  const query = params.toString()
  return `https://wa.me/${phone}${query ? `?${query}` : ""}`
}
