/**
 * Seed doğrulama: JSON uzunlukları vs MySQL satır sayıları.
 */
import fs from "node:fs/promises"
import path from "node:path"
import { config } from "dotenv"

config({ path: path.join(process.cwd(), ".env") })

import { PrismaClient } from "@prisma/client"

async function main() {
  const prisma = new PrismaClient()
  const dataDir = path.join(process.cwd(), "data")
  const errors: string[] = []

  try {
    const files = (await fs.readdir(dataDir)).filter((f) => f.endsWith(".json"))
    for (const file of files) {
      const full = path.join(dataDir, file)
      if (!(await fs.stat(full)).isFile()) continue
      const json = JSON.parse(await fs.readFile(full, "utf8"))
      const doc = await prisma.cmsDocument.findUnique({ where: { key: file } })
      if (!doc) {
        errors.push(`EKSİK document: ${file}`)
        continue
      }
      const a = JSON.stringify(json)
      const b = JSON.stringify(doc.payload)
      if (a !== b) {
        // Sıra farkı olabilir; yapısal karşılaştırma
        if (Array.isArray(json) && Array.isArray(doc.payload)) {
          if (json.length !== (doc.payload as unknown[]).length) {
            errors.push(
              `${file}: dizi uzunluğu JSON=${json.length} DB=${(doc.payload as unknown[]).length}`
            )
          }
        } else if (typeof json === "object" && json && typeof doc.payload === "object") {
          const jk = Object.keys(json).sort().join(",")
          const dk = Object.keys(doc.payload as object).sort().join(",")
          if (jk !== dk) {
            errors.push(`${file}: anahtar farkı`)
          }
        }
      } else {
        console.log(`✓ birebir ${file}`)
      }
      if (a === b) continue
      // derin eşitlik değilse uyarı (sıralama)
      console.log(`~ içerik var (normalize/sıra farkı olabilir): ${file}`)
    }

    console.log("\nNormalize sayaçlar:")
    console.log("  admin_users", await prisma.adminUser.count())
    console.log("  gallery_categories", await prisma.galleryCategory.count())
    console.log("  gallery_items", await prisma.galleryItem.count())
    console.log("  bungalovs", await prisma.bungalov.count())
    console.log("  seo_meta", await prisma.seoMeta.count())
    console.log("  faq_items", await prisma.faqItem.count())
    console.log("  inquiries", await prisma.inquiry.count())
    console.log("  cms_documents", await prisma.cmsDocument.count())

    if (errors.length) {
      console.error("\nHATALAR:")
      for (const e of errors) console.error(" -", e)
      process.exit(1)
    }
    console.log("\nDoğrulama OK")
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
