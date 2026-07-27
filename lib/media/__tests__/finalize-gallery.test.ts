import fs from "fs/promises"
import os from "os"
import path from "path"
import sharp from "sharp"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/cms/store", () => ({
  readJson: vi.fn().mockResolvedValue(null),
}))

describe("finalizeGalleryImage", () => {
  let tmpRoot: string

  beforeEach(async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "aden-fin-"))
    vi.stubEnv("UPLOAD_DIR", tmpRoot)
  })

  afterEach(async () => {
    vi.unstubAllEnvs()
    vi.resetModules()
    await fs.rm(tmpRoot, { recursive: true, force: true })
  })

  it("harici URL için no-op", async () => {
    const { finalizeGalleryImage } = await import("../finalize-gallery")
    const res = await finalizeGalleryImage({
      imageUrl: "https://cdn.example.com/a.jpg",
      title: "Aden",
      categoryName: "Bungalovlar",
    })
    expect(res).toEqual({ imageUrl: "https://cdn.example.com/a.jpg", changed: false })
  })

  it("staging jpeg → galeri/bungalovlar/title-ts.webp", async () => {
    const stagingRel = path.join("galeri", "_staging", "foto.jpg")
    const stagingAbs = path.join(tmpRoot, stagingRel)
    await fs.mkdir(path.dirname(stagingAbs), { recursive: true })
    await sharp({
      create: { width: 8, height: 8, channels: 3, background: { r: 10, g: 20, b: 30 } },
    })
      .jpeg()
      .toFile(stagingAbs)

    const { finalizeGalleryImage, buildGallerySeoUrl } = await import("../finalize-gallery")
    const ts = 1785136677955
    const res = await finalizeGalleryImage({
      imageUrl: "/uploads/galeri/_staging/foto.jpg",
      title: "Aden Aile Suit",
      categoryName: "Bungalovlar",
      timestamp: ts,
      itemId: "gal-1",
    })

    const expected = buildGallerySeoUrl({
      categoryName: "Bungalovlar",
      title: "Aden Aile Suit",
      timestamp: ts,
    })
    expect(res.imageUrl).toBe(expected)
    expect(res.changed).toBe(true)
    expect(expected).toBe("/uploads/galeri/bungalovlar/aden-aile-suit-1785136677955.webp")

    const abs = path.join(tmpRoot, expected.replace("/uploads/", ""))
    await expect(fs.access(abs)).resolves.toBeUndefined()
    await expect(fs.access(stagingAbs)).rejects.toMatchObject({ code: "ENOENT" })
  })

  it("title yoksa kategori slug kullanır", async () => {
    const stagingRel = path.join("galeri", "_staging", "x.png")
    const stagingAbs = path.join(tmpRoot, stagingRel)
    await fs.mkdir(path.dirname(stagingAbs), { recursive: true })
    await sharp({
      create: { width: 4, height: 4, channels: 3, background: { r: 1, g: 2, b: 3 } },
    })
      .png()
      .toFile(stagingAbs)

    const { finalizeGalleryImage } = await import("../finalize-gallery")
    const res = await finalizeGalleryImage({
      imageUrl: "/uploads/galeri/_staging/x.png",
      title: "  ",
      categoryName: "Bungalovlar",
      timestamp: 1785136658667,
    })
    expect(res.imageUrl).toBe("/uploads/galeri/bungalovlar/bungalovlar-1785136658667.webp")
  })
})
