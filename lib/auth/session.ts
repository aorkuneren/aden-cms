/**
 * Staff RBAC oturumu (Prisma Session) — CMS migrasyonu kapsamında değil.
 * Admin paneli `lib/admin/auth.ts` (AdminUser + HMAC cookie) kullanır.
 */

export { SESSION_COOKIE } from "./constants"

type SessionMeta = {
  ip?: string | null
  userAgent?: string | null
  maxAgeSeconds?: number
}

export type SessionRecord = {
  id: string
  userId: string
  tokenHash: string
  expiresAt: Date
}

export async function createSession(
  _userId: string,
  _meta: SessionMeta = {}
): Promise<{ token: string; expiresAt: Date }> {
  throw new Error(
    "Staff Prisma Session henüz aktif değil: User/Session modelleri CMS şemasına eklenmedi."
  )
}

export async function getSessionRecord(): Promise<SessionRecord | null> {
  return null
}

export async function destroySession(): Promise<void> {
  // no-op
}

export async function destroyAllSessions(_userId: string): Promise<void> {
  // no-op
}
