import { cookies } from "next/headers"
import { prisma } from "@/lib/db"
import { generateToken, hashToken } from "./tokens"
import { SESSION_COOKIE } from "./constants"

/**
 * Oturum yönetimi — Prisma DB session + httpOnly imzasız-ama-hash'li token
 * cookie. Ham token cookie'de tutulur; DB'de yalnız SHA-256 hash saklanır.
 * "Tüm cihazlardan çıkış" için kullanıcının tüm Session kayıtları silinebilir.
 */
export { SESSION_COOKIE }
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 // 1 saat (settings.sessionMaxAge ile override edilebilir)

type SessionMeta = {
  ip?: string | null
  userAgent?: string | null
  maxAgeSeconds?: number
}

export async function createSession(userId: string, meta: SessionMeta = {}) {
  const token = generateToken()
  const tokenHash = hashToken(token)
  const maxAge = meta.maxAgeSeconds ?? DEFAULT_MAX_AGE_SECONDS
  const expiresAt = new Date(Date.now() + maxAge * 1000)

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      expiresAt,
    },
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  })

  return { token, expiresAt }
}

/** Aktif oturum kaydını döndürür (süresi geçmişse temizler). */
export async function getSessionRecord() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
  })
  if (!session) return null

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {})
    return null
  }

  return session
}

/** Mevcut oturumu sonlandırır (cookie + DB kaydı). */
export async function destroySession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } })
  }
  cookieStore.delete(SESSION_COOKIE)
}

/** Kullanıcının tüm cihazlardaki oturumlarını kapatır. */
export async function destroyAllSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } })
}
