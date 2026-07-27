import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createHmac, timingSafeEqual } from "node:crypto"
import bcrypt from "bcryptjs"

import { prisma } from "@/lib/db"
import { readJson, writeJson } from "@/lib/cms/store"

/**
 * Bağımsız (standalone) admin kimlik doğrulama.
 *
 * Admin kullanıcıları MySQL `admin_users` / `cms_documents` (admin-users.json key)
 * üzerinden okunur. Oturum, AUTH_SECRET ile HMAC-SHA256 imzalı, durumsuz
 * (stateless) httpOnly cookie'dir.
 */

const ADMIN_USERS_FILE = "admin-users.json"
export const ADMIN_SESSION_COOKIE = "aden_admin"
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 12 // 12 saat
export const ADMIN_LOGIN_PATH = "/admin/login"

export type AdminRole = "SUPERADMIN" | "ADMIN" | "CONTENT_EDITOR" | "STAFF"

export type AdminUser = {
  id: string
  email: string
  name: string
  role: AdminRole
  passwordHash: string
  isActive: boolean
}

export type AdminSessionUser = Omit<AdminUser, "passwordHash">

function getSecret(): string {
  const secret = process.env.AUTH_SECRET
  if (secret && secret.length >= 16) return secret
  // Geliştirmede kutudan çıktığı gibi çalışsın; ÜRETİMDE AUTH_SECRET zorunlu.
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[admin/auth] AUTH_SECRET tanımlı değil! Üretimde oturum imzalama güvensiz. .env dosyasına AUTH_SECRET ekleyin."
    )
  }
  return "aden-dev-insecure-secret-change-me"
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url")
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url")
}

/** userId + son kullanma tarihini imzalayıp durumsuz oturum token'ı üretir. */
export function signSession(userId: string, maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS): string {
  const exp = Date.now() + maxAgeSeconds * 1000
  const payload = base64url(JSON.stringify({ sub: userId, exp }))
  return `${payload}.${sign(payload)}`
}

/** Token'ı doğrular; geçerliyse userId döner, değilse null. */
export function verifySession(token: string | undefined | null): string | null {
  if (!token || !token.includes(".")) return null
  const [payload, sig] = token.split(".")
  if (!payload || !sig) return null

  const expected = sign(payload)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      sub?: string
      exp?: number
    }
    if (!decoded.sub || !decoded.exp || decoded.exp < Date.now()) return null
    return decoded.sub
  } catch {
    return null
  }
}

function mapRow(u: {
  id: string
  email: string
  name: string
  role: string
  passwordHash: string
  isActive: boolean
}): AdminUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as AdminRole,
    passwordHash: u.passwordHash,
    isActive: u.isActive,
  }
}

/**
 * Admin listesi: önce cms_documents, olmazsa normalize admin_users tablosu.
 * DB hatasını yutmaz — girişte "yanlış parola" ile karışmasın.
 */
export async function getAdminUsers(): Promise<AdminUser[]> {
  try {
    const users = await readJson<AdminUser[]>(ADMIN_USERS_FILE)
    if (Array.isArray(users)) return users
  } catch (err) {
    console.warn("[admin/auth] cms_documents okunamadı, admin_users fallback:", err)
  }

  try {
    const rows = await prisma.adminUser.findMany()
    return rows.map(mapRow)
  } catch (err) {
    console.error("[admin/auth] admin kullanıcıları okunamadı:", err)
    throw new Error(
      "Veritabanı bağlantısı başarısız. Hostinger env'de DATABASE_URL (localhost veya srvXXXX.hstgr.io) kontrol edin."
    )
  }
}

export async function saveAdminUsers(users: AdminUser[]): Promise<void> {
  await writeJson(ADMIN_USERS_FILE, users)
}

/** E-posta için ASCII lower (tr-TR'de I→ı domain eşleşmesini bozar). */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** E-posta + parola doğrular. Başarılıysa parolasız kullanıcı, değilse null. */
export async function verifyCredentials(
  email: string,
  password: string
): Promise<AdminSessionUser | null> {
  const users = await getAdminUsers()
  const user = users.find((u) => normalizeEmail(u.email) === normalizeEmail(email))
  if (!user || !user.isActive) return null
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return null
  const { passwordHash: _omit, ...safe } = user
  return safe
}

/** Girişten sonra oturum cookie'sini yazar. */
export async function createAdminSession(userId: string): Promise<void> {
  const token = signSession(userId)
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DEFAULT_MAX_AGE_SECONDS,
  })
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_SESSION_COOKIE)
}

/** Geçerli oturumdaki admini döner (yoksa null). Prisma'ya bağlı değildir. */
export async function getCurrentAdmin(): Promise<AdminSessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  const userId = verifySession(token)
  if (!userId) return null
  try {
    const users = await getAdminUsers()
    const user = users.find((u) => u.id === userId)
    if (!user || !user.isActive) return null
    const { passwordHash: _omit, ...safe } = user
    return safe
  } catch (err) {
    console.error("[admin/auth] getCurrentAdmin:", err)
    return null
  }
}

/** Korunan sayfalarda çağrılır — admin yoksa login'e yönlendirir. */
export async function requireAdmin(): Promise<AdminSessionUser> {
  const admin = await getCurrentAdmin()
  if (!admin) redirect(ADMIN_LOGIN_PATH)
  return admin
}
