import bcrypt from "bcryptjs"

/**
 * Parola hash'leme (bcryptjs — pure JS, paylaşımlı hosting'de native derleme
 * sorunu yaşamaz). Maliyet faktörü 12; şüpheli girişlerde kilitleme ile
 * birlikte brute-force'a karşı yeterlidir.
 */
const BCRYPT_ROUNDS = 12

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!hash) return false
  return bcrypt.compare(plain, hash)
}
