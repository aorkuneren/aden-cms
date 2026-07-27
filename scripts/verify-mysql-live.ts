/**
 * MySQL CMS store okuma/yazma canlı doğrulama (galeri dahil).
 */
import path from "node:path"
import { config } from "dotenv"

config({ path: path.join(process.cwd(), ".env") })

import { PrismaClient } from "@prisma/client"
import { clearCmsMemoryCache, mutateJson, readJson } from "../lib/cms/store"

type CmsConfig = {
  galleryManagement?: {
    categories?: unknown[]
    items?: unknown[]
    _dbProbe?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

async function main() {
  const prisma = new PrismaClient()
  const marker = `__db_probe_${Date.now()}__`

  try {
    await prisma.$connect()
    clearCmsMemoryCache()

    const before = await readJson<CmsConfig>("cms-config.json")
    const catsBefore = before.galleryManagement?.categories?.length ?? 0
    const itemsBefore = before.galleryManagement?.items?.length ?? 0
    console.log("1) STORE READ", { catsBefore, itemsBefore })

    await mutateJson<CmsConfig>("cms-config.json", (cfg = {}) => {
      const gallery = cfg.galleryManagement ?? { categories: [], items: [] }
      return {
        ...cfg,
        galleryManagement: {
          ...gallery,
          _dbProbe: marker,
        },
      }
    })
    console.log("2) STORE WRITE ok")

    clearCmsMemoryCache()
    const after = await readJson<CmsConfig>("cms-config.json")
    if (after.galleryManagement?._dbProbe !== marker) {
      throw new Error("Probe okunamadı — store MySQL'e yazmıyor olabilir")
    }
    console.log("3) STORE READBACK PASS")

    const normCats = await prisma.galleryCategory.count()
    const normItems = await prisma.galleryItem.count()
    console.log("4) NORM TABLES", { galleryCategory: normCats, galleryItem: normItems })
    if (normCats < 1 || normItems < 1) {
      throw new Error("Normalize galeri tabloları boş — resync gerekir")
    }

    await mutateJson<CmsConfig>("cms-config.json", (cfg = {}) => {
      const gallery = { ...(cfg.galleryManagement ?? {}) }
      delete gallery._dbProbe
      return { ...cfg, galleryManagement: gallery }
    })
    clearCmsMemoryCache()
    const cleaned = await readJson<CmsConfig>("cms-config.json")
    if (cleaned.galleryManagement?._dbProbe) {
      throw new Error("Probe temizlenemedi")
    }
    console.log("5) CLEANUP PASS")

    const sample = await prisma.galleryCategory.findMany({
      include: { items: { take: 1 } },
    })
    for (const c of sample) {
      console.log(`   cat ${c.id} (${c.name}) items_in_rel=${c.items.length}`)
    }

    console.log("\nDB LIVE CHECK OK — galeri kategori/görseller MySQL'de")
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
