#!/usr/bin/env node
/**
 * Admin kullanıcı yönetimi (CLI).
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
import fs from "node:fs/promises"
import path from "node:path"
import bcrypt from "bcryptjs"

const FILE = path.join(process.cwd(), "data", "admin-users.json")

async function load() {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"))
  } catch {
    return []
  }
}
async function save(users) {
  await fs.writeFile(FILE, JSON.stringify(users, null, 2) + "\n", "utf8")
}
const norm = (e) => String(e || "").trim().toLocaleLowerCase("tr-TR")
const rid = () => `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const [, , cmd, ...args] = process.argv

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
      console.error("Kullanım: node scripts/admin.mjs add <email> \"<Ad>\" <parola> [ROL]")
      process.exit(1)
    }
    if (users.some((u) => norm(u.email) === norm(email))) {
      console.error("Bu e-posta zaten kayıtlı.")
      process.exit(1)
    }
    users.push({
      id: rid(),
      email,
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
    u.passwordHash = bcrypt.hashSync(password, 10)
    await save(users)
    console.log("Parola güncellendi:", email)
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
        "Admin kullanıcı yönetimi",
        "",
        "  node scripts/admin.mjs list",
        '  node scripts/admin.mjs add <email> "<Ad Soyad>" <parola> [ROL]',
        "  node scripts/admin.mjs set-password <email> <yeni-parola>",
        "  node scripts/admin.mjs deactivate <email>",
        "  node scripts/admin.mjs activate <email>",
      ].join("\n")
    )
}
