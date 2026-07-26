import { randomBytes } from "node:crypto"

/**
 * Rezervasyon kodu: ADN-YYYYMMDD-XXXX (XXXX rastgele hex).
 * Benzersizlik, oluşturma transaction'ında @unique kısıtı + yeniden deneme ile garantilenir.
 */
export function generateReservationCode(now: Date = new Date()): string {
  const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(
    now.getUTCDate()
  ).padStart(2, "0")}`
  const rand = randomBytes(3).toString("hex").toUpperCase().slice(0, 4)
  return `ADN-${stamp}-${rand}`
}
