import fs from "fs/promises"
import os from "os"
import path from "path"
import sharp from "sharp"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { readJson, mutateJson, revalidateSite } = vi.hoisted(() => ({
  readJson: vi.fn(),
  mutateJson: vi.fn(),
  revalidateSite: vi.fn(),
}))

vi.mock("@/lib/cms/store", () => ({
  readJson,
  mutateJson,
  revalidateSite,
}))

import { remapGalleryCategoryIds } from "../migrate-gallery-paths"

describe("remapGalleryCategoryIds", () => {
  it("gallery-category- önekini name slug'a çevirir ve item'ları günceller", () => {
    const { categories, items, idMap } = remapGalleryCategoryIds(
      [
        { id: "gallery-category-bungalovlar", name: "Bungalovlar", isActive: true },
        { id: "gallery-category-odalar-suit", name: "Odalar/Suit", isActive: true },
      ],
      [
        { id: "g1", categoryId: "gallery-category-bungalovlar", imageUrl: "/uploads/x.jpg" },
      ]
    )
    expect(idMap["gallery-category-bungalovlar"]).toBe("bungalovlar")
    expect(idMap["gallery-category-odalar-suit"]).toBe("odalar-suit")
    expect(categories.map((c) => c.id)).toEqual(["bungalovlar", "odalar-suit"])
    expect(items[0].categoryId).toBe("bungalovlar")
  })

  it("zaten slug olan id'ye dokunmaz", () => {
    const { categories, idMap } = remapGalleryCategoryIds(
      [{ id: "bungalovlar", name: "Bungalovlar", isActive: true }],
      []
    )
    expect(categories[0].id).toBe("bungalovlar")
    expect(Object.keys(idMap)).toHaveLength(0)
  })
})

describe("migrateGallerySeoPaths", () => {
  let tmpRoot: string

  beforeEach(async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "aden-mig-"))
    vi.stubEnv("UPLOAD_DIR", tmpRoot)
    mutateJson.mockImplementation(async (_file, updater) => {
      const current = await readJson()
      return updater(current)
    })
  })

  afterEach(async () => {
    vi.unstubAllEnvs()
    vi.resetModules()
    await fs.rm(tmpRoot, { recursive: true, force: true })
    readJson.mockReset()
    mutateJson.mockReset()
  })

  it("zaten SEO webp path olan item'ları atlar", async () => {
    const seoUrl = "/uploads/galeri/bungalovlar/aden-aile-suit-1785136677955.webp"
    const seoAbs = path.join(tmpRoot, seoUrl.replace("/uploads/", ""))
    await fs.mkdir(path.dirname(seoAbs), { recursive: true })
    await sharp({
      create: { width: 4, height: 4, channels: 3, background: { r: 1, g: 2, b: 3 } },
    })
      .webp()
      .toFile(seoAbs)

    readJson.mockResolvedValue({
      galleryManagement: {
        categories: [{ id: "bungalovlar", name: "Bungalovlar", isActive: true }],
        items: [
          {
            id: "g1",
            categoryId: "bungalovlar",
            title: "Aden Aile Suit",
            imageUrl: seoUrl,
            isActive: true,
          },
        ],
      },
    })

    const { migrateGallerySeoPaths } = await import("../migrate-gallery-paths")
    const result = await migrateGallerySeoPaths()
    expect(result.filesMigrated).toBe(0)
    expect(result.errors).toHaveLength(0)
  })

  it("staging path'i hâlâ dönüştürür", async () => {
    const stagingRel = path.join("galeri", "_staging", "foto.jpg")
    const stagingAbs = path.join(tmpRoot, stagingRel)
    await fs.mkdir(path.dirname(stagingAbs), { recursive: true })
    await sharp({
      create: { width: 8, height: 8, channels: 3, background: { r: 10, g: 20, b: 30 } },
    })
      .jpeg()
      .toFile(stagingAbs)

    readJson.mockResolvedValue({
      galleryManagement: {
        categories: [{ id: "bungalovlar", name: "Bungalovlar", isActive: true }],
        items: [
          {
            id: "g1",
            categoryId: "bungalovlar",
            title: "Aden Aile Suit",
            imageUrl: "/uploads/galeri/_staging/foto.jpg",
            isActive: true,
          },
        ],
      },
    })

    const { migrateGallerySeoPaths } = await import("../migrate-gallery-paths")
    const result = await migrateGallerySeoPaths()
    expect(result.filesMigrated).toBe(1)
    expect(result.errors).toHaveLength(0)
    expect(mutateJson).toHaveBeenCalled()
  })
})
