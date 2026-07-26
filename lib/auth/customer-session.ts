import { cookies } from "next/headers"
import { prisma } from "@/lib/db"

const CUSTOMER_COOKIE_NAME = "aden_customer_session"
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 // 7 Gün

function hashToken(rawToken: string): string {
  // Simple deterministic hash for session tokens
  const encoder = new TextEncoder()
  const data = encoder.encode(rawToken + "CUSTOMER_SALT")
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 5) - hash + data[i]
    hash |= 0
  }
  return Math.abs(hash).toString(16)
}

export async function createCustomerSession(userId: string) {
  const rawToken = Math.random().toString(36).substring(2) + Date.now().toString(36)
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000)

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  })

  const cookieStore = await cookies()
  cookieStore.set(CUSTOMER_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  })
}

export async function getCurrentCustomer() {
  const cookieStore = await cookies()
  const rawToken = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value

  if (!rawToken) return null

  const tokenHash = hashToken(rawToken)

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) {
    return null
  }

  if (session.user.actorType !== "CUSTOMER" || session.user.status !== "ACTIVE") {
    return null
  }

  return session.user
}

export async function destroyCustomerSession() {
  const cookieStore = await cookies()
  const rawToken = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value

  if (rawToken) {
    const tokenHash = hashToken(rawToken)
    await prisma.session.deleteMany({ where: { tokenHash } })
  }

  cookieStore.delete(CUSTOMER_COOKIE_NAME)
}
