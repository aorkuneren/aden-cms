/**
 * data/*.json → MySQL cms_documents (+ normalize senkron).
 * Kullanım: npx tsx scripts/seed-mysql-from-json.ts [--force]
 */
import fs from "node:fs/promises"
import path from "node:path"
import { config } from "dotenv"

config({ path: path.join(process.cwd(), ".env") })

import { PrismaClient } from "@prisma/client"
import { syncNormalizedFromDocument } from "../lib/cms/sync-normalized"

const DATA_DIR = path.join(process.cwd(), "data")
const FORCE = process.argv.includes("--force")

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL eksik (.env)")
  }

  const prisma = new PrismaClient()
  try {
    const existing = await prisma.cmsDocument.count()
    if (existing > 0 && !FORCE) {
      console.error(
        `DB'de zaten ${existing} CmsDocument var. Üzerine yazmak için --force kullanın.`
      )
      process.exit(1)
    }

    const files = (await fs.readdir(DATA_DIR)).filter(
      (f) => f.endsWith(".json") && !f.startsWith(".")
    )

    console.log(`Seed: ${files.length} JSON dosyası → MySQL`)

    for (const file of files) {
      const full = path.join(DATA_DIR, file)
      const stat = await fs.stat(full)
      if (!stat.isFile()) continue

      const raw = await fs.readFile(full, "utf8")
      const payload = JSON.parse(raw) as unknown

      // 1) Belgeyi yaz (kaynak gerçeği)
      await prisma.cmsDocument.upsert({
        where: { key: file },
        create: { key: file, payload: payload as object, version: 1 },
        update: { payload: payload as object, version: { increment: 1 } },
      })

      // 2) Normalize senkron — belge zaten güvenli; senkron ayrı (timeout'suz batch)
      await syncNormalizedFromDocument(prisma, file, payload)

      const size = Array.isArray(payload)
        ? `array[${payload.length}]`
        : typeof payload === "object" && payload
          ? `object(${Object.keys(payload as object).length} keys)`
          : typeof payload
      console.log(`  ✓ ${file} — ${size}`)
    }

    const docs = await prisma.cmsDocument.count()
    const admins = await prisma.adminUser.count()
    const bungalovs = await prisma.bungalov.count()
    const seo = await prisma.seoMeta.count()
    console.log("\nÖzet:")
    console.log(`  cms_documents: ${docs}`)
    console.log(`  admin_users:   ${admins}`)
    console.log(`  bungalovs:     ${bungalovs}`)
    console.log(`  seo_meta:      ${seo}`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
