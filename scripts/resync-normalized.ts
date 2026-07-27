/**
 * cms_documents → normalize tabloları yeniden senkronlar.
 * Seed sonrası veya kısmi sync bozulduğunda çalıştırın.
 */
import path from "node:path"
import { config } from "dotenv"

config({ path: path.join(process.cwd(), ".env") })

import { PrismaClient } from "@prisma/client"
import { syncNormalizedFromDocument } from "../lib/cms/sync-normalized"

async function main() {
  const prisma = new PrismaClient()
  try {
    await prisma.$connect()
    const docs = await prisma.cmsDocument.findMany({ orderBy: { key: "asc" } })
    if (docs.length === 0) {
      throw new Error("cms_documents boş — önce npm run db:seed çalıştırın.")
    }

    console.log(`Resync ${docs.length} belge...`)
    for (const doc of docs) {
      await prisma.$transaction(
        async (tx) => {
          await syncNormalizedFromDocument(tx, doc.key, doc.payload)
        },
        { timeout: 180_000, maxWait: 60_000 }
      )
      console.log(`✓ ${doc.key}`)
    }

    console.log("\nNormalize sayaçlar:")
    console.log("  admin_users", await prisma.adminUser.count())
    console.log("  gallery_categories", await prisma.galleryCategory.count())
    console.log("  gallery_items", await prisma.galleryItem.count())
    console.log("  bungalovs", await prisma.bungalov.count())
    console.log("  slider_slides", await prisma.sliderSlide.count())
    console.log("  faq_items", await prisma.faqItem.count())
    console.log("  why_aden_items", await prisma.whyAdenItem.count())
    console.log("  menu_groups", await prisma.menuGroup.count())
    console.log("  inquiries", await prisma.inquiry.count())
    console.log("  seo_meta", await prisma.seoMeta.count())
    console.log("\nResync OK")
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
