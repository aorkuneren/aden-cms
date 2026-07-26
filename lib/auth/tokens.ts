import { randomBytes, createHash } from "node:crypto"

/**
 * Yüksek entropili rastgele token üretir (oturum, davet, parola sıfırlama).
 * Ham token yalnız kullanıcıya (cookie/e-posta) gider; veritabanında sadece
 * hash'i saklanır. Böylece DB sızıntısı kullanılabilir token açığa çıkarmaz.
 */
export function generateToken(byteLength = 32): string {
  return randomBytes(byteLength).toString("hex")
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}
