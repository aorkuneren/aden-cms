import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

const FALLBACK_DATABASE_URL = "mysql://invalid:invalid@127.0.0.1:3306/invalid"

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    console.error(
      "[db] DATABASE_URL tanımlı değil. Hostinger env'e MySQL bağlantı dizesini ekleyin (host: localhost)."
    )
  }
  return new PrismaClient({
    datasources: {
      db: { url: url || FALLBACK_DATABASE_URL },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient()
  }
  return globalForPrisma.prisma
}

/**
 * Lazy Prisma proxy — import anında process'i düşürmez.
 * DATABASE_URL yok/yanlışsa ilk sorguda hata olur; public katman catch eder.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getClient()
    const value = Reflect.get(client, prop, receiver as object)
    return typeof value === "function" ? value.bind(client) : value
  },
})
