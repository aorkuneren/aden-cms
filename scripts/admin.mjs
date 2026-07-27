#!/usr/bin/env node
/**
 * Admin kullanıcı yönetimi (CLI) — MySQL cms_documents / admin_users.
 *
 * Kullanım:
 *   node scripts/admin.mjs list
 *   node scripts/admin.mjs add <email> "<Ad Soyad>" <parola> [ROL]
 *   node scripts/admin.mjs set-password <email> <yeni-parola>
 *   node scripts/admin.mjs deactivate <email>
 *   node scripts/admin.mjs activate <email>
 *
 * ROL: SUPERADMIN | ADMIN | STAFF  (varsayılan: ADMIN)
 */
import path from "node:path"
import { fileURLToPath } from "node:url"
import { config } from "dotenv"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
config({ path: path.join(__dirname, "..", ".env") })

const KEY = "admin-users.json"
const prisma = new PrismaClient()

const norm = (e) => String(e || "").trim().toLowerCase()
const rid = () => `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

async function load() {
  const row = await prisma.cmsDocument.findUnique({ where: { key: KEY } })
  if (!row) return []
  return Array.isArray(row.payload) ? row.payload : []
}

async function save(users) {
  const existing = await prisma.cmsDocument.findUnique({ where: { key: KEY } })
  const version = (existing?.version ?? 0) + 1
  await prisma.$transaction(async (tx) => {
    await tx.cmsDocument.upsert({
      where: { key: KEY },
      create: { key: KEY, payload: users, version: 1 },
      update: { payload: users, version },
    })
    await tx.adminUser.deleteMany()
    if (users.length) {
      await tx.adminUser.createMany({
        data: users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          passwordHash: u.passwordHash,
          isActive: u.isActive !== false,
        })),
      })
    }
  })
}

const [, , cmd, ...args] = process.argv

try {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL eksik (.env)")
    process.exit(1)
  }

  const users = await load()

  switch (cmd) {
    case "list": {
      if (users.length === 0) console.log("(kullanıcı yok)")
      for (const u of users) {
        console.log(`${u.isActive ? "●" : "○"} ${u.email}  —  ${u.name}  [${u.role}]`)
      }
      break
    }
    case "add": {
      const [email, name, password, role = "ADMIN"] = args
      if (!email || !name || !password) {
        console.error('Kullanım: node scripts/admin.mjs add <email> "<Ad>" <parola> [ROL]')
        process.exit(1)
      }
      if (users.some((u) => norm(u.email) === norm(email))) {
        console.error("Bu e-posta zaten kayıtlı.")
        process.exit(1)
      }
      users.push({
        id: rid(),
        email: norm(email),
        name,
        role,
        passwordHash: bcrypt.hashSync(password, 10),
        isActive: true,
      })
      await save(users)
      console.log(`Eklendi: ${email} [${role}]`)
      break
    }
    case "set-password": {
      const [email, password] = args
      const u = users.find((x) => norm(x.email) === norm(email))
      if (!u) {
        console.error("Kullanıcı bulunamadı:", email)
        process.exit(1)
      }
      if (!password) {
        console.error("Kullanım: node scripts/admin.mjs set-password <email> <yeni-parola>")
        process.exit(1)
      }
      u.passwordHash = bcrypt.hashSync(password, 10)
      await save(users)
      console.log("Parola güncellendi (MySQL):", email)
      break
    }
    case "deactivate":
    case "activate": {
      const [email] = args
      const u = users.find((x) => norm(x.email) === norm(email))
      if (!u) {
        console.error("Kullanıcı bulunamadı:", email)
        process.exit(1)
      }
      u.isActive = cmd === "activate"
      await save(users)
      console.log(`${email} → ${u.isActive ? "aktif" : "pasif"}`)
      break
    }
    default:
      console.log(
        [
          "Admin kullanıcı yönetimi (MySQL)",
          "",
          "  node scripts/admin.mjs list",
          '  node scripts/admin.mjs add <email> "<Ad Soyad>" <parola> [ROL]',
          "  node scripts/admin.mjs set-password <email> <yeni-parola>",
          "  node scripts/admin.mjs deactivate <email>",
          "  node scripts/admin.mjs activate <email>",
        ].join("\n")
      )
  }
} finally {
  await prisma.$disconnect()
}
