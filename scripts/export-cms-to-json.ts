/**
 * MySQL cms_documents → data/*.json dışa aktarım (geri dönüş / yedek).
 * Kullanım: npx tsx scripts/export-cms-to-json.ts [outdir]
 */
import fs from "node:fs/promises"
import path from "node:path"
import { config } from "dotenv"

config({ path: path.join(process.cwd(), ".env") })

import { PrismaClient } from "@prisma/client"

async function main() {
  const outDir = path.resolve(
    process.argv[2] || path.join(process.cwd(), "data", "export-from-mysql")
  )
  await fs.mkdir(outDir, { recursive: true })

  const prisma = new PrismaClient()
  try {
    const docs = await prisma.cmsDocument.findMany({ orderBy: { key: "asc" } })
    for (const doc of docs) {
      const target = path.join(outDir, doc.key)
      await fs.writeFile(target, JSON.stringify(doc.payload, null, 2) + "\n", "utf8")
      console.log(`✓ ${doc.key}`)
    }
    console.log(`\n${docs.length} belge → ${outDir}`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
