import { migrateGallerySeoPaths } from "../lib/media/migrate-gallery-paths"

async function main() {
  const result = await migrateGallerySeoPaths()
  console.log(JSON.stringify(result, null, 2))
  if (result.errors.length) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
